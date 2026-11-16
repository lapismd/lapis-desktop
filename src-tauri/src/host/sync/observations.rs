//! Bounded pull observation: no unacknowledged event queue or renderer scheduler.
use super::{caller, selected};
use crate::host::state::{NativeError, NativeHost, NativeServices, access};
use lapis_desktop::sync::account::presentation::Presentation;
use serde::Deserialize;
use std::{io, time::Duration};
use tauri::{State, WebviewWindow};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    handle: Uuid,
    after_revision: Option<u64>,
}

#[tauri::command]
pub async fn desktop_sync_observe(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: Request,
) -> Result<Presentation, NativeError> {
    let owner = caller(&window)?;
    if request
        .after_revision
        .is_some_and(|revision| revision > 9_007_199_254_740_991)
    {
        return Err(invalid().into());
    }
    let admitting = owner.clone();
    let (mut wait, initial) = access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        let sync = selected(sync)?;
        // Subscribe before reading current state so concurrent Core work is not lost.
        let wait = sync.observe(vaults, &admitting, request.handle)?;
        let initial = bounded(sync.presentation(vaults, &admitting, request.handle)?)?;
        if request
            .after_revision
            .is_some_and(|revision| revision > initial.revision())
        {
            return Err(invalid());
        }
        Ok((wait, initial))
    })
    .await?;
    // Timeout is a passive heartbeat, never a checkpoint or account retry trigger.
    if request.after_revision == Some(initial.revision())
        && let Ok(result) = tokio::time::timeout(Duration::from_secs(30), wait.changed()).await
    {
        result?;
    }
    caller(&window)?;
    access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        bounded(selected(sync)?.presentation(vaults, &owner, request.handle)?)
    })
    .await
}

fn bounded(value: Presentation) -> io::Result<Presentation> {
    if serde_json::to_vec(&value).map_err(io::Error::other)?.len() > 64 * 1024 {
        return Err(invalid());
    }
    Ok(value)
}

fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidInput,
        "Invalid native Sync observation",
    )
}
