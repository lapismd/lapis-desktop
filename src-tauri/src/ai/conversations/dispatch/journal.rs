use super::{super::invalid, model::Record};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use cap_std::fs::Dir;
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::io;

const LIMIT: usize = 4 * 1024 * 1024;
pub(super) fn directory(
    call: &BackendCall,
    thread: ThreadId,
    create: bool,
) -> io::Result<Option<Dir>> {
    let (profile, _, _) = call.conversation_location()?;
    if create {
        let parent = storage::directory(&profile, "canonical-dispatch-v1")?;
        storage::directory(&parent, &thread.to_string()).map(Some)
    } else {
        let Some(parent) = storage::existing_directory(&profile, "canonical-dispatch-v1")? else {
            return Ok(None);
        };
        storage::existing_directory(&parent, &thread.to_string())
    }
}
pub(super) fn read(dir: &Dir, request: RequestId) -> io::Result<Option<Record>> {
    storage::read(dir, &format!("{request}.json"), LIMIT)?
        .map(|bytes| serde_json::from_slice(&bytes).map_err(|_| invalid()))
        .transpose()
}
pub(super) fn save(dir: &Dir, record: &Record, exclusive: bool) -> io::Result<()> {
    let bytes = serde_json::to_vec(record).map_err(|_| invalid())?;
    if bytes.len() > LIMIT {
        return Err(invalid());
    }
    storage::write(dir, &format!("{}.json", record.request), &bytes, exclusive)
}
pub(super) fn active(dir: &Dir) -> io::Result<Option<RequestId>> {
    storage::read(dir, "active.json", 128)?
        .map(|bytes| serde_json::from_slice(&bytes).map_err(|_| invalid()))
        .transpose()
}
pub(super) fn activate(dir: &Dir, request: RequestId) -> io::Result<()> {
    storage::write(
        dir,
        "active.json",
        &serde_json::to_vec(&request).map_err(|_| invalid())?,
        false,
    )
}
pub(super) fn digest(value: &impl Serialize) -> io::Result<[u8; 32]> {
    Ok(
        Sha256::new_with_prefix(b"lapis-canonical-dispatch-input-v1\0")
            .chain_update(serde_json::to_vec(value).map_err(|_| invalid())?)
            .finalize()
            .into(),
    )
}
