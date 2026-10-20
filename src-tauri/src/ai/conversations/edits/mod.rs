//! Source-backed typed edits. A retained uncertain write is never executed again.
mod intent;
mod types;
use super::{identity::Identity, invalid, provider, records, unknown};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use cap_std::fs::Dir;
use intent::{DIRECTORY, Intent};
use jj_collab::{
    CollabObjectV1, ThreadCommandV1, ThreadId, ThreadPurposeV1, ThreadStateV1, ThreadStatusV1,
};
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use std::{io, sync::Arc};
pub use types::{Action, EditWrite, Input};

async fn recover(call: Arc<BackendCall>, dir: &Dir, intent: &mut Intent) -> io::Result<EditWrite> {
    let stores = provider::write_current(
        call.clone(),
        intent.actor,
        intent.identity.repository.ok_or_else(invalid)?,
    )?;
    let current = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    let state = ThreadStateV1::read(current.data.root.clone(), &current.data.graph)
        .map_err(|_| invalid())?;
    let header = state
        .threads
        .get(&intent.identity.thread_id)
        .ok_or_else(invalid)?;
    match current.data.graph.get(*header).map_err(|_| invalid())? {
        CollabObjectV1::ThreadVersion(header)
            if header.thread_id == intent.identity.thread_id
                && header.purpose
                    == Some(ThreadPurposeV1::Conversation {
                        target: intent.identity.target.clone(),
                    }) => {}
        _ => return Err(invalid()),
    }
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .status(intent.request.request_id)
        .await;
    call.check()?;
    match outcome {
        Ok(StoreOutcome::Committed(receipt)) => {
            intent.confirm(receipt)?;
            intent.save(dir, false).map_err(|_| unknown())?;
        }
        _ if intent.receipt.is_some() => return Err(unknown()),
        _ => {}
    }
    call.check()?;
    intent.reply()
}
pub async fn edit(
    call: BackendCall,
    mut input: Input,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<EditWrite> {
    if input.expected_selection.is_empty() || input.expected_selection.len() > 256 {
        return Err(invalid());
    }
    input.action = input.action.sanitize(&privacy)?;
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (profile, _, _) = call.conversation_location()?;
    if let Some(dir) = storage::existing_directory(&profile, DIRECTORY)?
        && let Some(mut intent) = Intent::read(&dir, input.request_id)?
    {
        intent.validate(&call, input.request_id, input.thread_id)?;
        if intent.action != input.action || intent.observed != input.expected_selection {
            return Err(invalid());
        }
        return recover(call.clone(), &dir, &mut intent).await;
    }
    let stores = provider::read_current(call.clone())?;
    let current = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    if current.selection != input.expected_selection {
        return Err(io::Error::other(
            "Conversation changed; refresh before editing",
        ));
    }
    let state = ThreadStateV1::read(current.data.root.clone(), &current.data.graph)
        .map_err(|_| invalid())?;
    let expected = *state.threads.get(&input.thread_id).ok_or_else(invalid)?;
    let CollabObjectV1::ThreadVersion(header) =
        current.data.graph.get(expected).map_err(|_| invalid())?
    else {
        return Err(invalid());
    };
    let Some(ThreadPurposeV1::Conversation { target }) = &header.purpose else {
        return Err(invalid());
    };
    if header.thread_id != input.thread_id {
        return Err(invalid());
    }
    let command = match &input.action {
        Action::Rename { title } => {
            if header.status == ThreadStatusV1::Tombstoned {
                return Err(invalid());
            }
            let expected_metadata = state
                .metadata
                .get(&target.key().map_err(|_| invalid())?)
                .copied();
            let mut value = match expected_metadata {
                None => Default::default(),
                Some(reference) => {
                    match current.data.graph.get(reference).map_err(|_| invalid())? {
                        CollabObjectV1::ConversationMetadata(metadata)
                            if metadata.thread_id == input.thread_id
                                && metadata.target == *target =>
                        {
                            metadata.value.clone()
                        }
                        _ => return Err(invalid()),
                    }
                }
            };
            value.custom_title = title.clone();
            ThreadCommandV1::SetMetadata {
                thread_id: input.thread_id,
                expected_thread: expected,
                expected_metadata,
                target: target.clone(),
                value: Box::new(value),
            }
        }
        Action::Lifecycle { action } => {
            header.status.transition(*action).map_err(|_| invalid())?;
            ThreadCommandV1::Lifecycle {
                thread_id: input.thread_id,
                expected,
                action: *action,
            }
        }
    };
    command.validate().map_err(|_| invalid())?;
    let identity = Identity {
        target: target.clone(),
        thread_id: input.thread_id,
        repository: Some(current.scope.repository.ok_or_else(invalid)?),
    };
    call.check()?;
    let actor_dir = storage::directory(&profile, "conversations-v1")?;
    let actor = records::actor(&actor_dir, true)?.ok_or_else(invalid)?;
    let mut intent = Intent::new(&call, identity, actor, input, command)?;
    let dir = storage::directory(&profile, DIRECTORY)?;
    intent.save(&dir, true).map_err(|_| unknown())?;
    call.check()?;
    let stores = provider::write_current(
        call.clone(),
        actor,
        intent.identity.repository.ok_or_else(invalid)?,
    )?;
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .execute(&StoreRequest::new(
            intent.request.request_id,
            intent.command()?.clone(),
        ))
        .await;
    call.check()?;
    if let Ok(StoreOutcome::Committed(receipt)) = outcome {
        intent.confirm(receipt)?;
        intent.save(&dir, false).map_err(|_| unknown())?;
    }
    call.check()?;
    intent.reply()
}
pub async fn status(
    call: BackendCall,
    request: RequestId,
    thread: ThreadId,
) -> io::Result<Option<EditWrite>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (profile, _, _) = call.conversation_location()?;
    let Some(dir) = storage::existing_directory(&profile, DIRECTORY)? else {
        call.check()?;
        return Ok(None);
    };
    let Some(mut intent) = Intent::read(&dir, request)? else {
        call.check()?;
        return Ok(None);
    };
    intent.validate(&call, request, thread)?;
    recover(call.clone(), &dir, &mut intent).await.map(Some)
}
