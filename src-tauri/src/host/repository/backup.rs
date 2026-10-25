//! Explicit vault backup writer; immutable history admission does not initialize it.
use super::backup_client::BackupClient;
use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::Status;
use lapis_desktop::repository::storage::Locations;
use serde::Deserialize;
use std::{
    collections::HashMap,
    io,
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};
use tauri::{State, WebviewWindow, ipc::Channel};
use tokio::sync::Mutex;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
}
pub(super) struct Owner {
    pub window: String,
    pub backup: BackupClient,
    pub(super) events: Option<tokio::task::JoinHandle<()>>,
}
pub struct Backups {
    pub(super) locations: Locations,
    pub(super) entries: Mutex<HashMap<String, Owner>>,
    active: Arc<AtomicBool>,
}
pub(super) fn error(value: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Vault backup: {value}")).into()
}
impl Backups {
    pub(super) async fn owner(
        &self,
        session: &str,
        window: &str,
    ) -> Result<tokio::sync::MappedMutexGuard<'_, Owner>, NativeError> {
        let entries = self.entries.lock().await;
        if !entries
            .get(session)
            .is_some_and(|owner| owner.window == window)
        {
            return Err(error("Backup is closed or belongs to another window"));
        }
        Ok(tokio::sync::MutexGuard::map(entries, |entries| {
            entries.get_mut(session).unwrap()
        }))
    }
    pub fn new(root: PathBuf) -> Self {
        Self {
            locations: Locations::new(root),
            entries: Mutex::new(HashMap::new()),
            active: Arc::new(AtomicBool::new(true)),
        }
    }
    pub fn fence(&self) {
        self.active.store(false, Ordering::Release);
    }
}
#[tauri::command]
pub async fn desktop_backup_start(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
    on_change: Channel<Status>,
) -> Result<Status, NativeError> {
    let caller = policy::caller(&window).map_err(error)?;
    if !repository.backups.active.load(Ordering::Acquire) {
        return Err(error("Backup admission is closed"));
    }
    let _transition = repository.transitions.lock().await;
    let session = request.session_id.clone();
    let (descriptor, client) = access(host.inner().clone(), move |s| {
        Ok((
            s.vaults.descriptor(&session)?.clone(),
            s.core_vaults.client(&s.vaults, &session)?,
        ))
    })
    .await?;
    let mut entries = repository.backups.entries.lock().await;
    if entries
        .get(&request.session_id)
        .is_some_and(|owner| owner.window != caller.window)
    {
        return Err(error("Backup belongs to another window"));
    }
    // Resolve an earlier stop even when its caller did not observe completion.
    // Core reuses a live owner or explicitly restarts a successfully drained one.
    let backup = BackupClient::start(client).await.map_err(error)?;
    if !entries.contains_key(&request.session_id) {
        let binding = super::storage::resolve(&repository, descriptor, false).await?;
        let session = request.session_id.clone();
        let state = binding.state;
        access(host.inner().clone(), move |s| {
            s.repository.bind_backup(&s.vaults, &session, &state)
        })
        .await?;
        entries.insert(
            request.session_id.clone(),
            Owner {
                window: caller.window.clone(),
                backup,
                events: None,
            },
        );
    } else {
        entries.get_mut(&request.session_id).unwrap().backup = backup;
    }
    let owner = entries
        .get_mut(&request.session_id)
        .ok_or_else(|| error("Backup is closed"))?;
    if owner.window != caller.window {
        return Err(error("Backup belongs to another window"));
    }
    if let Some(events) = owner.events.take() {
        events.abort();
    }
    let mut state = owner.backup.subscribe();
    let initial = state.borrow().clone();
    owner.events = Some(tokio::spawn(async move {
        while state.changed().await.is_ok() {
            if on_change.send(state.borrow().clone()).is_err() {
                break;
            }
        }
    }));
    Ok(initial)
}
#[tauri::command]
pub async fn desktop_backup_capture(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<Status, NativeError> {
    let caller = policy::caller(&window).map_err(error)?;
    let session = request.session_id.clone();
    access(host.inner().clone(), move |s| {
        s.vaults.get(&session).map(|_| ())
    })
    .await?;
    let entries = repository.backups.entries.lock().await;
    let owner = entries
        .get(&request.session_id)
        .ok_or_else(|| error("Backup is closed"))?;
    if owner.window != caller.window {
        return Err(error("Backup belongs to another window"));
    }
    owner.backup.capture().await.map_err(error)?;
    let result = owner.backup.subscribe().borrow().clone();
    Ok(result)
}
#[tauri::command]
pub async fn desktop_backup_stop(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<(), NativeError> {
    policy::caller(&window).map_err(error)?;
    let _transition = repository.transitions.lock().await;
    repository
        .backups
        .close(host.inner().clone(), &request.session_id)
        .await
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn renderer_cannot_choose_backup_paths_or_source_identity() {
        for key in [
            "root",
            "path",
            "metadata",
            "profileId",
            "generation",
            "operation",
            "window",
        ] {
            let mut value = serde_json::json!({"sessionId":"opaque"});
            value[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(value).is_err());
        }
    }
}
