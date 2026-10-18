//! Native opaque cursors retain only immutable, originally selected read data.
use super::{confirmed, encode, invalid, reply, streams};
use crate::ai::{backend::BackendCall, conversations::Conversation};
use jj_agent::{AgentObjectRef, AgentSessionId, TranscriptStreamV1};
use jj_store_core::engine::{AgentReader, AgentSnapshotRead};
use jj_store_model::RequestId;
use serde::Serialize;
use std::{
    collections::{BTreeMap, BTreeSet},
    io,
    sync::{Arc, Mutex},
};
use uuid::Uuid;

pub(super) struct Cursor {
    session: AgentSessionId,
    manifest: AgentObjectRef,
    stream: TranscriptStreamV1,
    issued: Mutex<BTreeSet<u64>>,
}
impl Cursor {
    pub(super) fn new(
        session: AgentSessionId,
        manifest: AgentObjectRef,
        stream: TranscriptStreamV1,
        after: u64,
    ) -> Self {
        Self {
            session,
            manifest,
            stream,
            issued: Mutex::new(BTreeSet::from([after])),
        }
    }
}
/// Detached Agent snapshots contain no host/counted backend call. Every actual
/// range needs a fresh current call and exact original receipt verification.
pub struct ReadPin {
    request: RequestId,
    conversation: Conversation,
    selection: Vec<u8>,
    snapshot: Arc<dyn AgentSnapshotRead>,
    cursors: BTreeMap<Uuid, Cursor>,
}
impl ReadPin {
    pub(super) fn new(
        request: RequestId,
        conversation: Conversation,
        selection: Vec<u8>,
        snapshot: Arc<dyn AgentSnapshotRead>,
        cursors: BTreeMap<Uuid, Cursor>,
    ) -> Self {
        Self {
            request,
            conversation,
            selection,
            snapshot,
            cursors,
        }
    }
    pub async fn transcript(
        &self,
        call: BackendCall,
        cursor: Uuid,
        after: String,
    ) -> io::Result<String> {
        let sequence = after.parse::<u64>().map_err(|_| invalid())?;
        if sequence.to_string() != after {
            return Err(invalid());
        }
        let cursor_data = self.cursors.get(&cursor).ok_or_else(invalid)?;
        if !cursor_data
            .issued
            .lock()
            .map_err(|_| invalid())?
            .contains(&sequence)
        {
            return Err(invalid());
        }
        let call = Arc::new(call);
        let _guard = call.preparation_guard().await?;
        let (record, _) = confirmed(&call, self.request).await?.ok_or_else(invalid)?;
        if reply(&record)? != self.conversation {
            return Err(invalid());
        }
        let transcript = streams::range(
            &AgentReader::new(self.snapshot.as_ref()),
            cursor_data.manifest,
            cursor_data.stream.clone(),
            Some(sequence),
            256 * 1024,
            Some(cursor),
        )
        .await?;
        call.check()?;
        #[derive(Serialize)]
        struct Page<'a> {
            version: u8,
            conversation_request_id: RequestId,
            selection: &'a [u8],
            session_id: AgentSessionId,
            after_sequence: u64,
            transcript: &'a streams::Transcript,
        }
        let encoded = encode(&Page {
            version: 1,
            conversation_request_id: self.request,
            selection: &self.selection,
            session_id: cursor_data.session,
            after_sequence: sequence,
            transcript: &transcript,
        })?;
        call.check()?;
        if let Some(next) = transcript.next_after_sequence {
            cursor_data
                .issued
                .lock()
                .map_err(|_| invalid())?
                .insert(next);
        }
        Ok(encoded)
    }
}
