//! Device-private execution intent; canonical conversation content stays in stores.
mod claims;
mod journal;
mod model;
mod reservation;
mod worker;
use super::{invalid, member, messages, unknown};
use crate::ai::backend::BackendCall;
pub use claims::ensure_unclaimed;
use jj_collab::ThreadId;
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_model::RequestId;
pub use model::{Binding, Input, Owner, Phase, RecipientInput, View};
use model::{Recipient, Record};
pub use reservation::reserve;
pub use reservation::{Hook, Reservation};
use std::{io, sync::Arc};

pub async fn begin(
    call: Arc<BackendCall>,
    owner: Owner,
    input: Input,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<View> {
    input.validate()?;
    let _guard = call.preparation_guard().await?;
    let digest = journal::digest(&input)?;
    if let Some(dir) = journal::directory(&call, input.thread_id, false)?
        && let Some(record) = journal::read(&dir, input.request_id)?
    {
        record.validate(&call, input.request_id, input.thread_id)?;
        let current = member::current(call.clone(), input.thread_id, None, false).await?;
        if record.digest != digest || record.identity != current.identity {
            return Err(invalid());
        }
        return Ok(record.view(false));
    }
    let current = member::current(
        call.clone(),
        input.thread_id,
        Some(&input.expected_selection),
        true,
    )
    .await?;
    let dir = journal::directory(&call, input.thread_id, true)?.ok_or_else(invalid)?;
    if let Some(active) = journal::active(&dir)? {
        let prior = journal::read(&dir, active)?.ok_or_else(invalid)?;
        prior.validate(&call, active, input.thread_id)?;
        if !prior.settled() {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Review the outstanding native turn before sending another",
            ));
        }
    }
    let authored =
        messages::canonical::status_locked(call.clone(), input.request_id, input.thread_id).await?;
    let authored = match (input.authored, authored) {
        (true, Some(write)) if write.is_confirmed() => {
            if write.conversation != current.identity {
                return Err(invalid());
            }
            Some(write.authored_turn()?)
        }
        (false, None) => None,
        _ => return Err(unknown()),
    };
    let mut recipients = Vec::new();
    for recipient in input.recipients {
        let participant = if let Some(participant) = &recipient.participant {
            let safe = privacy
                .sanitize(serde_json::to_value(participant).map_err(|_| invalid())?)
                .ok_or_else(invalid)?;
            Some(serde_json::from_slice(safe.bytes()).map_err(|_| invalid())?)
        } else {
            None
        };
        let sanitized = RecipientInput {
            request_id: recipient.request_id,
            participant,
        };
        if sanitized.participant.as_ref().map(|p| &p.profile_id)
            != recipient.participant.as_ref().map(|p| &p.profile_id)
        {
            return Err(invalid());
        }
        if let Some(participant) = &sanitized.participant {
            participant.validate()?;
        }
        recipients.push(Recipient {
            input: sanitized,
            digest: journal::digest(&recipient)?,
            target: None,
            binding: None,
            phase: Phase::Planned,
            wire: None,
            terminal: None,
        });
    }
    let record = Record {
        schema: 1,
        request: input.request_id,
        identity: current.identity,
        source: call.conversation_location()?.2,
        backend: call.selection().clone(),
        owner,
        observed: input.expected_selection,
        digest,
        authored,
        recipients,
        stop_requested: false,
        stopped: false,
    };
    claims::create_parent(&call, &record)?;
    record.validate(&call, input.request_id, input.thread_id)?;
    journal::save(&dir, &record, true).map_err(|_| unknown())?;
    journal::activate(&dir, input.request_id).map_err(|_| unknown())?;
    call.check().map_err(|_| unknown())?;
    Ok(record.view(true))
}
pub async fn status(
    call: Arc<BackendCall>,
    request: Option<RequestId>,
    thread: ThreadId,
) -> io::Result<Option<View>> {
    let _guard = call.preparation_guard().await?;
    let Some(dir) = journal::directory(&call, thread, false)? else {
        if let Some(request) = request {
            claims::ensure_unclaimed(&call, request)?;
        }
        call.check()?;
        return Ok(None);
    };
    let Some(request) = request.or(journal::active(&dir)?) else {
        call.check()?;
        return Ok(None);
    };
    let Some(record) = journal::read(&dir, request)? else {
        claims::ensure_unclaimed(&call, request)?;
        call.check()?;
        return Ok(None);
    };
    record.validate(&call, request, thread)?;
    if member::current(call.clone(), thread, None, false)
        .await?
        .identity
        != record.identity
    {
        return Err(invalid());
    }
    Ok(Some(record.view(false)))
}
pub async fn request_stop(
    call: Arc<BackendCall>,
    request: RequestId,
    thread: ThreadId,
) -> io::Result<View> {
    let _guard = call.preparation_guard().await?;
    let dir = journal::directory(&call, thread, false)?.ok_or_else(invalid)?;
    let mut record = journal::read(&dir, request)?.ok_or_else(invalid)?;
    record.validate(&call, request, thread)?;
    if member::current(call.clone(), thread, None, false)
        .await?
        .identity
        != record.identity
    {
        return Err(invalid());
    }
    record.stop_requested = true;
    journal::save(&dir, &record, false).map_err(|_| unknown())?;
    call.check().map_err(|_| unknown())?;
    Ok(record.view(false))
}
pub async fn stopped(
    call: Arc<BackendCall>,
    request: RequestId,
    thread: ThreadId,
) -> io::Result<View> {
    let _guard = call.preparation_guard().await?;
    let dir = journal::directory(&call, thread, false)?.ok_or_else(invalid)?;
    let mut record = journal::read(&dir, request)?.ok_or_else(invalid)?;
    record.validate(&call, request, thread)?;
    if !record.stop_requested {
        return Err(invalid());
    }
    record.stopped = true;
    journal::save(&dir, &record, false).map_err(|_| unknown())?;
    call.check().map_err(|_| unknown())?;
    Ok(record.view(false))
}
