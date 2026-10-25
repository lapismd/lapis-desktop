//! Shared owner projection and explicit storage-mutation drain.
use jj_vault::{Storage, search::indexed};
use lapis_app_core::services::VaultService;
use std::{io, sync::Arc};

pub(super) fn status(service: Arc<VaultService>, start: bool) -> Result<indexed::Status, String> {
    let state = if start {
        service.start_history_indexing()
    } else {
        service.history_indexing_status()
    }
    .map_err(|error| error.to_string())?;
    if let Some(error) = state.error {
        return Err(error);
    }
    Ok(state.source.unwrap_or(indexed::Status {
        generation: 0,
        indexed: 0,
        omitted: 0,
        complete: false,
    }))
}

fn reselect(service: &Arc<VaultService>, storage: &Storage) -> io::Result<()> {
    if storage
        .status()
        .map_err(io::Error::other)?
        .pending
        .is_some()
    {
        return Err(io::Error::other("History storage move is pending"));
    }
    let source = storage.binding().map_err(io::Error::other)?;
    match std::fs::symlink_metadata(source.state.join("vault.json")) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
        Ok(_) => {}
    }
    service.start_history_indexing().map_err(io::Error::other)?;
    Ok(())
}

pub(super) fn relocate<T>(
    service: Arc<VaultService>,
    storage: &Storage,
    action: impl FnOnce() -> io::Result<T>,
) -> io::Result<T> {
    service.stop_history_indexing().map_err(io::Error::other)?;
    let result = action();
    let resumed = reselect(&service, storage);
    // A failed restart must never replace the original storage mutation error.
    result.and_then(|value| resumed.map(|()| value))
}
