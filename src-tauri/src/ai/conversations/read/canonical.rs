//! Source-member reads do not rely on device creation/recovery records.
use super::{ReadPin, View, encode, invalid, links, messages, provider, streams, unknown};
use crate::ai::{backend::BackendCall, conversations::identity::Identity};
use jj_collab::{CollabObjectV1, ThreadId, ThreadPurposeV1, ThreadStateV1};
use std::{collections::BTreeMap, io, sync::Arc};

pub async fn read(call: BackendCall, thread: ThreadId) -> io::Result<Option<String>> {
    Ok(load(call, thread, false).await?.map(|(text, _)| text))
}
pub async fn open(call: BackendCall, thread: ThreadId) -> io::Result<Option<(String, ReadPin)>> {
    load(call, thread, true).await
}
async fn load(
    call: BackendCall,
    thread: ThreadId,
    retain: bool,
) -> io::Result<Option<(String, ReadPin)>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let stores = provider::read_current(call.clone())?;
    let threads = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    let state = ThreadStateV1::read(threads.data.root.clone(), &threads.data.graph)
        .map_err(|_| invalid())?;
    let Some(reference) = state.threads.get(&thread) else {
        call.check()?;
        return Ok(None);
    };
    let CollabObjectV1::ThreadVersion(header) =
        threads.data.graph.get(*reference).map_err(|_| invalid())?
    else {
        return Err(invalid());
    };
    let Some(ThreadPurposeV1::Conversation { target }) = &header.purpose else {
        return Err(invalid());
    };
    if header.thread_id != thread {
        return Err(invalid());
    }
    let identity = Identity {
        thread_id: thread,
        target: target.clone(),
        repository: threads.scope.repository,
    };
    let metadata = state
        .metadata
        .get(&target.key().map_err(|_| invalid())?)
        .map(
            |reference| match threads.data.graph.get(*reference).map_err(|_| invalid())? {
                CollabObjectV1::ConversationMetadata(value)
                    if value.thread_id == thread && value.target == *target =>
                {
                    Ok(value.clone())
                }
                _ => Err(invalid()),
            },
        )
        .transpose()?;
    let messages = messages(&threads.data, &state, thread)?;
    let links = links(&threads.data, &state, thread)?;
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
    let mut cursors = BTreeMap::new();
    let sessions = streams::sessions(agent.data.as_ref(), links, retain, &mut cursors).await?;
    let pin = ReadPin::canonical(
        identity.clone(),
        threads.selection.clone(),
        agent.data,
        cursors,
    );
    let view = View {
        version: 2,
        conversation: identity,
        selection: threads.selection,
        thread: header.as_ref().clone(),
        metadata,
        messages,
        sessions,
    };
    call.check()?;
    let encoded = encode(&view)?;
    call.check()?;
    Ok(Some((encoded, pin)))
}
