use super::super::{identity::Identity, invalid, member, unknown};
use super::{
    claims, journal,
    model::{Owner, Phase, RecipientInput, Record},
};
use crate::ai::backend::BackendCall;
use cap_std::fs::Dir;
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use std::{io, sync::Arc};
use uuid::Uuid;

#[derive(Clone)]
pub struct Hook {
    pub(super) owner: Owner,
    pub(super) parent: RequestId,
    pub(super) recipient: RequestId,
    pub(super) identity: Identity,
}
pub struct Reservation {
    pub target: Uuid,
    pub hook: Hook,
    /// A replay cannot reconstruct a native in-memory launch grant.
    pub fresh: bool,
}
pub async fn reserve(
    call: Arc<BackendCall>,
    owner: Owner,
    parent: RequestId,
    thread: ThreadId,
    observed: &[u8],
    input: RecipientInput,
    room_for_plan: bool,
) -> io::Result<Reservation> {
    let _guard = call.preparation_guard().await?;
    let dir = journal::directory(&call, thread, false)?.ok_or_else(invalid)?;
    let mut record = journal::read(&dir, parent)?.ok_or_else(invalid)?;
    record.validate(&call, parent, thread)?;
    if record.owner != owner
        || record.stop_requested
        || record.observed != observed
        || journal::active(&dir)? != Some(parent)
    {
        return Err(invalid());
    }
    let index = record
        .recipients
        .iter()
        .position(|r| r.input.request_id == input.request_id)
        .ok_or_else(invalid)?;
    if record.recipients[index].digest != journal::digest(&input)? {
        return Err(invalid());
    }
    let identity = member::current(call.clone(), thread, None, true)
        .await?
        .identity;
    if identity != record.identity {
        return Err(invalid());
    }
    let hook = Hook {
        owner,
        parent,
        recipient: input.request_id,
        identity,
    };
    if let Some(target) = record.recipients[index].target {
        return Ok(Reservation {
            target,
            hook,
            fresh: false,
        });
    }
    if !room_for_plan {
        return Err(io::Error::new(
            io::ErrorKind::WouldBlock,
            "Native launch preparation limit reached",
        ));
    }
    member::current(call.clone(), thread, Some(observed), true).await?;
    let target = Uuid::new_v4();
    claims::create_recipient(&call, &record, index, target)?;
    record.recipients[index].target = Some(target);
    record.recipients[index].phase = Phase::Reserved;
    record.validate(&call, parent, thread)?;
    journal::save(&dir, &record, false).map_err(|_| unknown())?;
    call.check().map_err(|_| unknown())?;
    Ok(Reservation {
        target,
        hook,
        fresh: true,
    })
}
impl Hook {
    pub fn identity(&self) -> &Identity {
        &self.identity
    }
    pub fn parent_request(&self) -> RequestId {
        self.parent
    }
    pub fn owner_handle(&self) -> Uuid {
        self.owner.handle
    }
    pub(super) fn load(&self, call: &BackendCall) -> io::Result<(Dir, Record, usize)> {
        let dir = journal::directory(call, self.identity.thread_id, false)?.ok_or_else(invalid)?;
        let record = journal::read(&dir, self.parent)?.ok_or_else(invalid)?;
        record.validate(call, self.parent, self.identity.thread_id)?;
        if record.owner != self.owner || record.identity != self.identity {
            return Err(invalid());
        }
        let index = record
            .recipients
            .iter()
            .position(|r| r.input.request_id == self.recipient)
            .ok_or_else(invalid)?;
        Ok((dir, record, index))
    }
}
