//! Bounded immutable conversation views; original receipts authorize no new write.
mod retained;
mod streams;
use super::{invalid, provider, records, reply, unknown};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use jj_agent::AgentSessionSnapshotV1;
use jj_collab::{
    CollabObjectV1, ConversationMetadataTargetV1, ConversationMetadataV1, HumanMessageRevisionV1,
    ThreadLinkV1, ThreadPurposeV1, ThreadStateV1, ThreadVersionV1,
};
use jj_store_core::{StoreOutcome, ThreadData};
use jj_store_model::RequestId;
pub use retained::ReadPin;
use serde::Serialize;
use std::{collections::BTreeMap, io, sync::Arc};

#[derive(Serialize)]
struct View {
    version: u8,
    conversation: super::Conversation,
    selection: Vec<u8>,
    thread: ThreadVersionV1,
    metadata: Option<ConversationMetadataV1>,
    messages: Vec<HumanMessageRevisionV1>,
    sessions: Vec<Session>,
}
#[derive(Serialize)]
struct Session {
    link: ThreadLinkV1,
    snapshot: AgentSessionSnapshotV1,
    transcripts: Vec<streams::Transcript>,
}
/// The returned JSON text preserves every native integer. Missing private intent
/// is explicit absence; an unknown receipt is never converted to an empty view.
pub(super) async fn confirmed(
    call: &Arc<BackendCall>,
    request: RequestId,
) -> io::Result<Option<(records::Record, jj_store_core::RepositoryStores)>> {
    let (profile, root, source) = call.conversation_location()?;
    let Some(dir) = storage::existing_directory(&profile, "conversations-v1")? else {
        call.check()?;
        return Ok(None);
    };
    let Some(mut record) = records::read(&dir, request)? else {
        call.check()?;
        return Ok(None);
    };
    let actor = records::actor(&dir, false)?.ok_or_else(invalid)?;
    record.validate(request, source, call.selection(), actor)?;
    let stores = provider::open(call.clone(), &root, &record)?;
    let thread = stores.thread().ok_or_else(invalid)?;
    let StoreOutcome::Committed(receipt) = thread.status(request).await.map_err(|_| unknown())?
    else {
        return Err(unknown());
    };
    // Verify the actual original provider proof in memory, without repairing or
    // replacing private records during a read.
    provider::confirm(&mut record, receipt)?;
    call.check()?;
    Ok(Some((record, stores)))
}
pub async fn read(call: BackendCall, request: RequestId) -> io::Result<Option<String>> {
    Ok(load(call, request, false).await?.map(|(text, _)| text))
}
pub async fn open(call: BackendCall, request: RequestId) -> io::Result<Option<(String, ReadPin)>> {
    load(call, request, true).await
}
async fn load(
    call: BackendCall,
    request: RequestId,
    retain: bool,
) -> io::Result<Option<(String, ReadPin)>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let Some((record, stores)) = confirmed(&call, request).await? else {
        return Ok(None);
    };
    let thread = stores.thread().ok_or_else(invalid)?;
    let threads = thread.snapshot().await.map_err(|_| unknown())?;
    let agent = stores
        .agent()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    if threads.scope != agent.scope || threads.selection != agent.selection {
        return Err(io::Error::other(
            "Conversation source selection changed; refresh the view",
        ));
    }
    let conversation = reply(&record)?;
    if threads.scope.repository != conversation.repository {
        return Err(invalid());
    }
    let state = ThreadStateV1::read(threads.data.root.clone(), &threads.data.graph)
        .map_err(|_| invalid())?;
    let reference = state
        .threads
        .get(&conversation.thread_id)
        .ok_or_else(invalid)?;
    let CollabObjectV1::ThreadVersion(version) =
        threads.data.graph.get(*reference).map_err(|_| invalid())?
    else {
        return Err(invalid());
    };
    let target = ConversationMetadataTargetV1::Conversation {
        id: conversation.conversation_id.to_string(),
    };
    if version.purpose
        != Some(ThreadPurposeV1::Conversation {
            target: target.clone(),
        })
    {
        return Err(invalid());
    }
    let metadata = state
        .metadata
        .get(&target.key().map_err(|_| invalid())?)
        .map(
            |reference| match threads.data.graph.get(*reference).map_err(|_| invalid())? {
                CollabObjectV1::ConversationMetadata(value)
                    if value.thread_id == conversation.thread_id =>
                {
                    Ok(value.clone())
                }
                _ => Err(invalid()),
            },
        )
        .transpose()?;
    let messages = messages(&threads.data, &state, conversation.thread_id)?;
    let links = links(&threads.data, &state, conversation.thread_id)?;
    let mut cursors = BTreeMap::new();
    let sessions = streams::sessions(agent.data.as_ref(), links, retain, &mut cursors).await?;
    call.check()?;
    let pin = ReadPin::new(
        request,
        conversation.clone(),
        threads.selection.clone(),
        agent.data,
        cursors,
    );
    let view = View {
        version: 1,
        conversation,
        selection: threads.selection,
        thread: version.as_ref().clone(),
        metadata,
        messages,
        sessions,
    };
    let encoded = encode(&view)?;
    call.check()?;
    Ok(Some((encoded, pin)))
}
fn messages(
    data: &ThreadData,
    state: &ThreadStateV1,
    thread: jj_collab::ThreadId,
) -> io::Result<Vec<HumanMessageRevisionV1>> {
    let mut result = Vec::new();
    let mut bytes = 0usize;
    for reference in state.messages.values() {
        let CollabObjectV1::HumanMessageRevision(value) =
            data.graph.get(*reference).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if value.thread_id == thread {
            bytes += value.body.as_ref().map_or(0, String::len);
            if result.len() >= 64 || bytes > 256 * 1024 {
                return Err(io::Error::other("Conversation message limit exceeded"));
            }
            result.push(value.clone());
        }
    }
    result.sort_by_key(|v| (v.accepted_at_millis, v.message_id));
    Ok(result)
}
fn links(
    data: &ThreadData,
    state: &ThreadStateV1,
    thread: jj_collab::ThreadId,
) -> io::Result<Vec<ThreadLinkV1>> {
    let mut result = Vec::new();
    for reference in state.links.values() {
        let CollabObjectV1::ThreadLink(link) = data.graph.get(*reference).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if link.thread_id == thread
            && link.active
            && matches!(link.target, jj_collab::ThreadLinkTargetV1::Session { .. })
        {
            if result.len() >= 16 {
                return Err(io::Error::other("Conversation session limit exceeded"));
            }
            result.push(link.clone());
        }
    }
    Ok(result)
}
fn encode(value: &impl Serialize) -> io::Result<String> {
    struct Output(Vec<u8>);
    impl io::Write for Output {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            if bytes.len() > (2 * 1024 * 1024usize).saturating_sub(self.0.len()) {
                return Err(io::Error::other("Conversation view limit exceeded"));
            }
            self.0.extend_from_slice(bytes);
            Ok(bytes.len())
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
    let mut output = Output(Vec::new());
    serde_json::to_writer(&mut output, value)
        .map_err(|_| io::Error::other("Conversation view limit exceeded"))?;
    String::from_utf8(output.0).map_err(|_| invalid())
}
