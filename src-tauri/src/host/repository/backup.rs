//! Explicit vault backup writer; immutable history admission does not initialize it.
use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{Backup, Binding, NativeRepository, Status, Timing};
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
struct Owner {
    window: String,
    backup: Backup,
    watch: String,
    events: Option<tokio::task::JoinHandle<()>>,
}
pub struct Backups {
    root: PathBuf,
    entries: Mutex<HashMap<String, Owner>>,
    active: Arc<AtomicBool>,
}
fn error(value: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Vault backup: {value}")).into()
}
impl Backups {
    pub fn new(root: PathBuf) -> Self {
        Self {
            root,
            entries: Mutex::new(HashMap::new()),
            active: Arc::new(AtomicBool::new(true)),
        }
    }
    pub fn fence(&self) {
        self.active.store(false, Ordering::Release);
    }
    pub async fn close_window(&self, host: NativeHost, window: &str) -> Result<(), NativeError> {
        let sessions: Vec<_> = self
            .entries
            .lock()
            .await
            .iter()
            .filter(|(_, owner)| owner.window == window)
            .map(|(session, _)| session.clone())
            .collect();
        let mut failure = None;
        for session in sessions {
            if let Err(error) = self.close(host.clone(), &session).await {
                failure.get_or_insert(error);
            }
        }
        match failure {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }
    pub async fn close(&self, host: NativeHost, session: &str) -> Result<(), NativeError> {
        let mut entries = self.entries.lock().await;
        let Some(owner) = entries.remove(session) else {
            return Ok(());
        };
        let key = session.to_owned();
        let session = key.clone();
        let watch = owner.watch.clone();
        // Stop delivery before the final capture, after editor persistence.
        if let Err(error) = access(host, move |s| s.watches.close(&session, &watch)).await {
            entries.insert(key, owner);
            return Err(error);
        }
        let result = owner.backup.close().await.map_err(error);
        if let Some(events) = owner.events {
            events.abort();
        }
        result
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
    let mut entries = repository.backups.entries.lock().await;
    if !entries.contains_key(&request.session_id) {
        let binding = Binding {
            vault_id: descriptor.profile_id.clone(),
            root: PathBuf::from(descriptor.path),
            state: repository.backups.root.join(&descriptor.profile_id),
        };
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
        let changes = backup.changes();
        let session = request.session_id.clone();
        let watch = access(host.inner().clone(), move |s| {
            s.watches.start(
                &session,
                s.vaults.get(&session)?,
                "",
                true,
                s.fs_gate.clone(),
                move |batch| {
                    if !batch.changes.is_empty() || batch.reconciliation {
                        changes.changed();
                    }
                    true
                },
            )
        })
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
                watch,
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
