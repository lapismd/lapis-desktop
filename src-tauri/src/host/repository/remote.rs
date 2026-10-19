use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{Binding, RemoteTransfer, VaultRestoreRequest};
use lapis_desktop::repository::{forges::ForgeAccounts, remote};
use serde::Deserialize;
use serde_json::Value;
use std::{
    io,
    path::{Path, PathBuf},
};
use tauri::{State, WebviewWindow};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    action: Action,
}
#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
enum Action {
    Status,
    Configure {
        revision: u64,
        account: String,
        project: String,
        branch: Option<String>,
    },
    Disconnect {
        revision: u64,
    },
    Fetch {
        revision: u64,
    },
    Preview {
        checkpoint: String,
    },
    Restore {
        request: VaultRestoreRequest,
    },
}
fn failure(message: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Remote backup: {message}")).into()
}
async fn bound<T: Send + 'static>(
    host: NativeHost,
    session: String,
    binding: Binding,
    action: impl FnOnce(&Binding) -> io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    access(host, move |s| {
        s.vaults.get(&session)?.verify_physical_root()?;
        let descriptor = s.vaults.descriptor(&session)?;
        if descriptor.profile_id != binding.vault_id
            || Path::new(&descriptor.path) != binding.root.as_path()
        {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Vault source changed",
            ));
        }
        action(&binding)
    })
    .await
}
async fn worker<T: Send + 'static>(
    repository: &RepositoryHost,
    action: impl FnOnce() -> io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    let permit = repository
        .remote_slots
        .clone()
        .try_acquire_owned()
        .map_err(|_| failure("Remote workers are busy"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let _permit = permit;
        action()
    })
    .await
    .map_err(|_| failure("Remote worker stopped"))?
    .map_err(Into::into)
}
fn runtime() -> io::Result<tokio::runtime::Runtime> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
}
#[tauri::command]
pub async fn desktop_backup_remote(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    accounts: State<'_, ForgeAccounts>,
    request: Request,
) -> Result<Value, NativeError> {
    let caller = policy::caller(&window).map_err(failure)?;
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |s| {
        s.vaults.get(&session)?.verify_physical_root()?;
        Ok(s.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let binding = Binding {
        vault_id: descriptor.profile_id.clone(),
        root: PathBuf::from(descriptor.path),
        state: repository.backups.state_path(&descriptor.profile_id),
    };
    let state = bound(
        host.inner().clone(),
        request.session_id.clone(),
        binding.clone(),
        remote::read,
    )
    .await?;
    let result = match request.action {
        Action::Status => serde_json::to_value(state),
        Action::Configure {
            revision,
            account,
            project,
            branch,
        } => {
            if state.revision != revision {
                return Err(failure("Connection changed; refresh before continuing"));
            }
            let resolved = accounts
                .remote(account, project, branch)
                .await
                .map_err(NativeError::from)?;
            let init = binding.clone();
            worker(&repository, move || {
                runtime()?.block_on(async {
                    jj_store_jj::vault_workspace::Session::open(init)
                        .await
                        .map_err(|e| io::Error::other(e.to_string()))?;
                    Ok(())
                })
            })
            .await?;
            serde_json::to_value(
                bound(
                    host.inner().clone(),
                    request.session_id,
                    binding,
                    move |binding| remote::configure(binding, revision, resolved),
                )
                .await?,
            )
        }
        Action::Disconnect { revision } => serde_json::to_value(
            bound(
                host.inner().clone(),
                request.session_id,
                binding,
                move |binding| remote::disconnect(binding, revision),
            )
            .await?,
        ),
        Action::Fetch { revision } => {
            if state.revision != revision {
                return Err(failure("Connection changed; refresh before continuing"));
            }
            let config = state
                .configuration
                .ok_or_else(|| failure("Connect a remote repository first"))?;
            let resolved = accounts
                .remote(
                    config.account.clone(),
                    config.project.clone(),
                    Some(config.target.branch.clone()),
                )
                .await
                .map_err(NativeError::from)?;
            if resolved.target != config.target {
                return Err(failure(
                    "Forge repository changed; reconnect before continuing",
                ));
            }
            let transfer_binding = binding.clone();
            let can_push = resolved.can_push;
            let fetched = worker(&repository, move || {
                runtime()?.block_on(async {
                    let transfer = RemoteTransfer::connect(
                        transfer_binding,
                        resolved.target,
                        resolved.credentials,
                    )
                    .await
                    .map_err(|e| io::Error::other(e.to_string()))?;
                    transfer
                        .fetch()
                        .await
                        .map_err(|e| io::Error::other(e.to_string()))
                })
            })
            .await?;
            // Network work holds neither the vault-service lock nor backup map.
            let current = bound(
                host.inner().clone(),
                request.session_id.clone(),
                binding.clone(),
                remote::read,
            )
            .await?;
            if current.revision != revision {
                return Err(failure("Connection changed while fetching"));
            }
            let checkpoint = if let Some(fetched) = fetched {
                let owner = repository
                    .backups
                    .owner(&request.session_id, &caller.window)
                    .await?;
                Some(owner.backup.import_remote(fetched).await.map_err(failure)?)
            } else {
                None
            };
            serde_json::to_value(
                bound(
                    host.inner().clone(),
                    request.session_id,
                    binding,
                    move |binding| remote::observed(binding, revision, checkpoint, can_push),
                )
                .await?,
            )
        }
        Action::Preview { checkpoint } => {
            if state.checkpoint.as_ref().map(|c| c.commit.as_str()) != Some(&checkpoint) {
                return Err(failure(
                    "Remote version changed; fetch before reviewing restoration",
                ));
            }
            let owner = repository
                .backups
                .owner(&request.session_id, &caller.window)
                .await?;
            serde_json::to_value(
                owner
                    .backup
                    .preview_vault_restore(checkpoint)
                    .await
                    .map_err(failure)?,
            )
        }
        Action::Restore { request: restore } => {
            let owner = repository
                .backups
                .owner(&request.session_id, &caller.window)
                .await?;
            serde_json::to_value(
                owner
                    .backup
                    .restore_remote(restore)
                    .await
                    .map_err(failure)?,
            )
        }
    };
    result.map_err(|_| failure("Native response is invalid"))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn remote_frames_cannot_choose_paths_tokens_or_caller_authority() {
        let frame = serde_json::json!({"sessionId":"opaque","action":{"kind":"configure","revision":0,"account":"opaque-account","project":"owner/notes","branch":null}});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        for key in [
            "root",
            "state",
            "metadata",
            "window",
            "generation",
            "token",
            "url",
            "clientId",
        ] {
            let mut altered = frame.clone();
            altered[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(altered).is_err());
            let mut altered = frame.clone();
            altered["action"][key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(altered).is_err());
        }
        let frame = serde_json::json!({"sessionId":"opaque","action":{"kind":"restore","request":{"request_id":"stable","checkpoint":"abc","expected":"tree","root":"outside"}}});
        assert!(serde_json::from_value::<Request>(frame).is_err());
    }
}
