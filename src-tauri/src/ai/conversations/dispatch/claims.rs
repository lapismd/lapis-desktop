//! Durable request namespace, independent of the bounded volatile launch queue.
use super::super::{invalid, unknown};
use super::{
    journal,
    model::{Recipient, Record},
};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use cap_std::fs::Dir;
use jj_store_model::RequestId;
use serde::{Deserialize, Serialize};
use std::io;
use uuid::Uuid;

const DIRECTORY: &str = "canonical-dispatch-requests-v1";
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Claim {
    schema: u8,
    binding: [u8; 32],
}
fn directory(call: &BackendCall, create: bool) -> io::Result<Option<Dir>> {
    let (profile, _, _) = call.conversation_location()?;
    if create {
        storage::directory(&profile, DIRECTORY).map(Some)
    } else {
        storage::existing_directory(&profile, DIRECTORY)
    }
}
fn read(dir: &Dir, request: RequestId) -> io::Result<Option<Claim>> {
    let value = storage::read(dir, &format!("{request}.json"), 1024)?
        .map(|bytes| serde_json::from_slice::<Claim>(&bytes).map_err(|_| invalid()))
        .transpose()?;
    if value.as_ref().is_some_and(|claim| claim.schema != 1) {
        return Err(invalid());
    }
    Ok(value)
}
/// A legacy preparation cannot recycle a retained parent or recipient request.
pub fn ensure_unclaimed(call: &BackendCall, request: RequestId) -> io::Result<()> {
    if let Some(dir) = directory(call, false)?
        && read(&dir, request)?.is_some()
    {
        return Err(invalid());
    }
    call.check()
}
fn parent(record: &Record) -> io::Result<[u8; 32]> {
    journal::digest(&(
        "parent",
        record.request,
        &record.identity,
        record.source,
        &record.backend,
        &record.owner,
        &record.observed,
        record.digest,
    ))
}
fn recipient(record: &Record, recipient: &Recipient, target: Uuid) -> io::Result<[u8; 32]> {
    journal::digest(&(
        "recipient",
        record.request,
        &record.identity,
        record.source,
        &record.backend,
        &record.owner,
        &record.observed,
        record.digest,
        recipient.input.request_id,
        recipient.digest,
        target,
    ))
}
fn create(call: &BackendCall, request: RequestId, binding: [u8; 32]) -> io::Result<()> {
    let dir = directory(call, true)?.ok_or_else(invalid)?;
    // Even an identical orphan claim is an unknown prior attempt, not a refund.
    if read(&dir, request)?.is_some() {
        return Err(unknown());
    }
    let bytes = serde_json::to_vec(&Claim { schema: 1, binding }).map_err(|_| invalid())?;
    storage::write(&dir, &format!("{request}.json"), &bytes, true).map_err(|_| unknown())?;
    call.check().map_err(|_| unknown())
}
fn check(call: &BackendCall, request: RequestId, binding: [u8; 32]) -> io::Result<()> {
    let dir = directory(call, false)?.ok_or_else(invalid)?;
    let claim = read(&dir, request)?.ok_or_else(invalid)?;
    if claim.binding != binding {
        return Err(invalid());
    }
    call.check()
}
pub(super) fn create_parent(call: &BackendCall, record: &Record) -> io::Result<()> {
    create(call, record.request, parent(record)?)
}
pub(super) fn check_parent(call: &BackendCall, record: &Record) -> io::Result<()> {
    check(call, record.request, parent(record)?)
}
pub(super) fn create_recipient(
    call: &BackendCall,
    record: &Record,
    index: usize,
    target: Uuid,
) -> io::Result<()> {
    let item = record.recipients.get(index).ok_or_else(invalid)?;
    create(
        call,
        item.input.request_id,
        recipient(record, item, target)?,
    )
}
pub(super) fn check_recipient(
    call: &BackendCall,
    record: &Record,
    item: &Recipient,
    target: Uuid,
) -> io::Result<()> {
    check(
        call,
        item.input.request_id,
        recipient(record, item, target)?,
    )
}
