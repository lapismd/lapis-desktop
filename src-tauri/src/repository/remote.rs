//! Device-local remote selection. No credential or Git authority is stored here.
use super::forges::RemoteAccess;
use jj_vault::{Binding, Checkpoint, RemoteTarget};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{self, Read as _, Write as _},
    path::Path,
};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Configuration {
    pub account: String,
    pub project: String,
    pub target: RemoteTarget,
    pub can_push: bool,
}
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RemoteState {
    pub revision: u64,
    pub configuration: Option<Configuration>,
    pub checkpoint: Option<Checkpoint>,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Saved {
    version: u32,
    state: RemoteState,
}
fn failure(message: &str) -> io::Error {
    io::Error::other(format!("Remote backup: {message}"))
}
pub fn read(binding: &Binding) -> io::Result<RemoteState> {
    binding
        .validate()
        .map_err(|_| failure("Vault binding is unavailable"))?;
    let path = binding.state.join("remote-backup.json");
    let metadata = match fs::symlink_metadata(&path) {
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(RemoteState::default()),
        value => value?,
    };
    if !metadata.is_file() || metadata.is_symlink() || metadata.len() > 256 * 1024 {
        return Err(failure("Saved connection is invalid"));
    }
    let mut bytes = Vec::new();
    fs::File::open(path)?
        .take(256 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 256 * 1024 {
        return Err(failure("Saved connection is too large"));
    }
    let saved: Saved =
        serde_json::from_slice(&bytes).map_err(|_| failure("Saved connection is invalid"))?;
    if saved.version != 1 || saved.state.revision > 9_007_199_254_740_991 {
        return Err(failure("Saved connection version is unsupported"));
    }
    if let Some(config) = &saved.state.configuration {
        config
            .target
            .validate()
            .map_err(|_| failure("Saved endpoint is invalid"))?;
        if config.account.len() > 128 || config.project.len() > 256 {
            return Err(failure("Saved account binding is invalid"));
        }
    }
    Ok(saved.state)
}
fn save(path: &Path, state: &RemoteState) -> io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| failure("Storage is unavailable"))?;
    if !parent.join("vault.json").is_file() {
        return Err(failure("Wait for the first local checkpoint"));
    }
    let mut file = tempfile::NamedTempFile::new_in(parent)?;
    let bytes = serde_json::to_vec(&Saved {
        version: 1,
        state: state.clone(),
    })
    .map_err(|_| failure("Connection could not be encoded"))?;
    file.write_all(&bytes)?;
    file.as_file().sync_all()?;
    file.persist(path).map_err(|e| e.error)?;
    fs::File::open(parent)?.sync_all()
}
fn expected(binding: &Binding, revision: u64) -> io::Result<RemoteState> {
    let state = read(binding)?;
    if state.revision != revision {
        return Err(failure("Connection changed; refresh before continuing"));
    }
    Ok(state)
}
/// Caller serializes metadata writes under native admission; no network occurs.
pub fn configure(
    binding: &Binding,
    revision: u64,
    resolved: RemoteAccess,
) -> io::Result<RemoteState> {
    changing(binding)?;
    let mut state = expected(binding, revision)?;
    state.revision = state
        .revision
        .checked_add(1)
        .ok_or_else(|| failure("Connection revision is exhausted"))?;
    state.configuration = Some(Configuration {
        account: resolved.account,
        project: resolved.project,
        target: resolved.target,
        can_push: resolved.can_push,
    });
    state.checkpoint = None;
    save(&binding.state.join("remote-backup.json"), &state)?;
    Ok(state)
}
pub fn disconnect(binding: &Binding, revision: u64) -> io::Result<RemoteState> {
    changing(binding)?;
    let mut state = expected(binding, revision)?;
    state.revision = state
        .revision
        .checked_add(1)
        .ok_or_else(|| failure("Connection revision is exhausted"))?;
    state.configuration = None;
    state.checkpoint = None;
    save(&binding.state.join("remote-backup.json"), &state)?;
    Ok(state)
}
pub fn observed(
    binding: &Binding,
    revision: u64,
    checkpoint: Option<Checkpoint>,
    can_push: bool,
) -> io::Result<RemoteState> {
    let mut state = expected(binding, revision)?;
    if state.configuration.is_none() {
        return Err(failure("Connect a remote repository first"));
    }
    state.configuration.as_mut().unwrap().can_push = can_push;
    state.checkpoint = checkpoint;
    save(&binding.state.join("remote-backup.json"), &state)?;
    Ok(state)
}
fn changing(binding: &Binding) -> io::Result<()> {
    if binding
        .state
        .join("remote-push-receipts/active.json")
        .exists()
    {
        return Err(failure(
            "An earlier push needs review before changing the connection",
        ));
    }
    Ok(())
}
