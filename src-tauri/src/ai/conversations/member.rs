//! Resolve an existing canonical member; callers cannot supply its actor or target.
use super::{identity::Identity, invalid, provider, unknown};
use crate::ai::backend::BackendCall;
use jj_collab::{
    CollabObjectRef, CollabObjectV1, ThreadId, ThreadPurposeV1, ThreadStateV1, ThreadStatusV1,
};
use std::{io, sync::Arc};

pub(super) struct Member {
    pub identity: Identity,
    pub expected: CollabObjectRef,
    pub selection: Vec<u8>,
    pub status: ThreadStatusV1,
}
pub(super) async fn current(
    call: Arc<BackendCall>,
    thread: ThreadId,
    observed: Option<&[u8]>,
    writing: bool,
) -> io::Result<Member> {
    let stores = provider::read_current(call.clone())?;
    let snapshot = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    if let Some(observed) = observed
        && (observed.is_empty()
            || observed.len() > 256
            || snapshot.selection.as_slice() != observed)
    {
        return Err(io::Error::other(
            "Conversation changed; refresh before writing",
        ));
    }
    let state = ThreadStateV1::read(snapshot.data.root.clone(), &snapshot.data.graph)
        .map_err(|_| invalid())?;
    let expected = *state.threads.get(&thread).ok_or_else(invalid)?;
    let CollabObjectV1::ThreadVersion(header) =
        snapshot.data.graph.get(expected).map_err(|_| invalid())?
    else {
        return Err(invalid());
    };
    let Some(ThreadPurposeV1::Conversation { target }) = &header.purpose else {
        return Err(invalid());
    };
    if header.thread_id != thread
        || snapshot.scope.repository.is_none()
        || writing
            && matches!(
                header.status,
                ThreadStatusV1::Archived | ThreadStatusV1::Tombstoned
            )
    {
        return Err(invalid());
    }
    call.check()?;
    Ok(Member {
        identity: Identity {
            target: target.clone(),
            thread_id: thread,
            repository: snapshot.scope.repository,
        },
        expected,
        selection: snapshot.selection.clone(),
        status: header.status,
    })
}
