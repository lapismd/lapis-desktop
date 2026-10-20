//! Native opaque cursors retain only immutable, originally selected read data.
use super::{confirmed, encode, invalid, record_cursors::RecordReads, reply, streams};
use crate::ai::{
    backend::BackendCall,
    conversations::{Conversation, identity::Identity, provider},
};
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
    origin: Origin,
    selection: Vec<u8>,
    snapshot: Arc<dyn AgentSnapshotRead>,
    cursors: BTreeMap<Uuid, Cursor>,
    records: RecordReads,
    thread_graph: Option<Arc<jj_collab::CollabGraphV1>>,
}
#[derive(Serialize)]
pub(super) struct ReadContext<'a> {
    version: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    conversation_request_id: Option<RequestId>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) conversation: Option<&'a Identity>,
    #[serde(skip)]
    pub(super) thread_graph: Option<&'a jj_collab::CollabGraphV1>,
    selection: &'a [u8],
}
enum Origin {
    Prepared {
        request: RequestId,
        conversation: Conversation,
    },
    Canonical(Identity),
}
impl ReadPin {
    pub(super) fn new(
        request: RequestId,
        conversation: Conversation,
        selection: Vec<u8>,
        snapshot: Arc<dyn AgentSnapshotRead>,
        cursors: BTreeMap<Uuid, Cursor>,
        records: RecordReads,
    ) -> Self {
        Self {
            origin: Origin::Prepared {
                request,
                conversation,
            },
            selection,
            snapshot,
            cursors,
            records,
            thread_graph: None,
        }
    }
    pub(super) fn canonical(
        identity: Identity,
        selection: Vec<u8>,
        snapshot: Arc<dyn AgentSnapshotRead>,
        cursors: BTreeMap<Uuid, Cursor>,
        records: RecordReads,
        thread_graph: Arc<jj_collab::CollabGraphV1>,
    ) -> Self {
        Self {
            origin: Origin::Canonical(identity),
            selection,
            snapshot,
            cursors,
            records,
            thread_graph: Some(thread_graph),
        }
    }
    async fn authorize(&self, call: &Arc<BackendCall>) -> io::Result<()> {
        match &self.origin {
            Origin::Prepared {
                request,
                conversation,
            } => {
                let (record, _) = confirmed(call, *request).await?.ok_or_else(invalid)?;
                if reply(&record)? != *conversation {
                    return Err(invalid());
                }
            }
            Origin::Canonical(identity) => {
                let stores = provider::read_current(call.clone())?;
                let current = stores
                    .thread()
                    .ok_or_else(invalid)?
                    .snapshot()
                    .await
                    .map_err(|_| invalid())?;
                if current.scope.repository != identity.repository {
                    return Err(invalid());
                }
            }
        }
        Ok(())
    }
    fn context(&self) -> ReadContext<'_> {
        ReadContext {
            version: match &self.origin {
                Origin::Prepared { .. } => 1,
                Origin::Canonical(_) => 2,
            },
            conversation_request_id: match &self.origin {
                Origin::Prepared { request, .. } => Some(*request),
                _ => None,
            },
            conversation: match &self.origin {
                Origin::Canonical(identity) => Some(identity),
                _ => None,
            },
            selection: &self.selection,
            thread_graph: self.thread_graph.as_deref(),
        }
    }
    pub async fn records(&self, call: BackendCall, cursor: Uuid, after: u32) -> io::Result<String> {
        let call = Arc::new(call);
        let _guard = call.preparation_guard().await?;
        self.authorize(&call).await?;
        self.records
            .page(self.snapshot.as_ref(), &call, self.context(), cursor, after)
            .await
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
        self.authorize(&call).await?;
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
            #[serde(skip_serializing_if = "Option::is_none")]
            conversation_request_id: Option<RequestId>,
            #[serde(skip_serializing_if = "Option::is_none")]
            conversation: Option<&'a Identity>,
            selection: &'a [u8],
            session_id: AgentSessionId,
            after_sequence: u64,
            transcript: &'a streams::Transcript,
        }
        let encoded = encode(&Page {
            version: match &self.origin {
                Origin::Prepared { .. } => 1,
                Origin::Canonical(_) => 2,
            },
            conversation_request_id: match &self.origin {
                Origin::Prepared { request, .. } => Some(*request),
                _ => None,
            },
            conversation: match &self.origin {
                Origin::Canonical(identity) => Some(identity),
                _ => None,
            },
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
