//! Explicit vault backup writer; immutable history admission does not initialize it.
use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{Backup, NativeRepository, Status, Timing};
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
    pub backup: Backup,
    pub(super) watch: Option<String>,
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
    async fn prepare_start(
        &self,
        host: NativeHost,
        session: &str,
        window: &str,
    ) -> Result<(), NativeError> {
        let draining = {
            let entries = self.entries.lock().await;
            if let Some(owner) = entries.get(session) {
                if owner.window != window {
                    return Err(error("Backup belongs to another window"));
                }
                owner.watch.is_none()
            } else {
                false
            }
        };
        if draining && let Err(failure) = self.close(host, session).await {
            // Failed capture restores watching; an unknown close is resolved
            // before this owner is reattached or a replacement is created.
            if !self
                .entries
                .lock()
                .await
                .get(session)
                .is_some_and(|owner| owner.watch.is_some())
            {
                return Err(failure);
            }
        }
        Ok(())
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
    let (descriptor, files) = access(host.inner().clone(), move |s| {
        Ok((s.vaults.descriptor(&session)?.clone(), s.fs_gate.clone()))
    })
    .await?;
    repository
        .backups
        .prepare_start(host.inner().clone(), &request.session_id, &caller.window)
        .await?;
    let mut entries = repository.backups.entries.lock().await;
    if !entries.contains_key(&request.session_id) {
        let binding = super::storage::resolve(&repository, descriptor, true).await?;
        let backup = Backup::start_idle(
            super::backup_provider::Provider {
                native: NativeRepository {
                    binding: binding.clone(),
                    exclusions: vec![],
                },
                files,
                active: repository.backups.active.clone(),
            },
            Timing::default(),
        )
        .map_err(error)?;
        let watch = super::backup_watch::start(
            host.inner().clone(),
            request.session_id.clone(),
            backup.changes(),
        )
        .await;
        let watch = match watch {
            Ok(watch) => watch,
            Err(failure) => {
                let _ = backup.close().await;
                return Err(failure);
            }
        };
        // Watching is live before initialization and the first tree scan. Any
        // concurrent write is retained by the coordinator's dirty flag.
        if let Err(failure) = backup.capture().await {
            let session = request.session_id.clone();
            let id = watch.clone();
            let _ = access(host.inner().clone(), move |s| {
                s.watches.close(&session, &id)
            })
            .await;
            let _ = backup.close().await;
            return Err(error(failure));
        }
        let session = request.session_id.clone();
        let state = binding.state;
        if let Err(failure) = access(host.inner().clone(), move |s| {
            s.repository.bind_backup(&s.vaults, &session, &state)
        })
        .await
        {
            let session = request.session_id.clone();
            let id = watch.clone();
            let _ = access(host.inner().clone(), move |s| {
                s.watches.close(&session, &id)
            })
            .await;
            let _ = backup.close().await;
            return Err(failure);
        }
        entries.insert(
            request.session_id.clone(),
            Owner {
                window: caller.window.clone(),
                backup,
                watch: Some(watch),
                events: None,
            },
        );
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
