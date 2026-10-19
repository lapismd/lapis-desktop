//! Exact, vault-admitted automatic synchronization actions.
use super::{
    RepositoryHost, policy,
    remote::{bound, failure, runtime, worker},
    remote_transfer::Context,
};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{Binding, SyncResolution, VaultRestoreRequest};
use lapis_desktop::repository::forges::ForgeAccounts;
use serde::Deserialize;
use serde_json::Value;
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
    Prepare {
        revision: u64,
    },
    Preview {
        candidate: String,
        revision: u64,
    },
    Apply {
        request: VaultRestoreRequest,
        revision: u64,
    },
    Conflict {
        candidate: String,
        path: String,
        revision: u64,
    },
    Resolve {
        candidate: String,
        path: String,
        resolution: SyncResolution,
        revision: u64,
    },
    Publish {
        revision: u64,
        request_id: String,
    },
}
#[tauri::command]
pub async fn desktop_backup_sync(
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
        root: descriptor.path.into(),
        state: repository.backups.state_path(&descriptor.profile_id),
    };
    let context = Context {
        host: host.inner().clone(),
        repository: &repository,
        accounts: &accounts,
        session: request.session_id.clone(),
        window: caller.window.clone(),
        binding: binding.clone(),
    };
    let result = match request.action {
        Action::Prepare { revision } => {
            let state = context.fetch(revision).await?;
            let _mutation = repository.remote_mutations.lock().await;
            if context.current().await?.revision != revision {
                return Err(failure(
                    "Connection changed while preparing synchronization",
                ));
            }
            let owner = repository
                .backups
                .owner(&request.session_id, &caller.window)
                .await?;
            let proposal = if let Some(checkpoint) = state.checkpoint {
                Some(
                    owner
                        .backup
                        .prepare_sync(checkpoint.commit)
                        .await
                        .map_err(failure)?,
                )
            } else {
                owner.backup.capture().await.map_err(failure)?;
                None
            };
            serde_json::to_value(proposal)
        }
        Action::Publish {
            revision,
            request_id,
        } => {
            let (transfer, can_push) = context.transfer(revision).await?;
            if !can_push {
                return Err(failure("This account cannot push to the backup repository"));
            }
            // Serialize the final revision check and native intent selection with
            // configuration writes. The subsequent child holds neither lock.
            let target = worker(&repository, move || {
                runtime()?.block_on(async {
                    let before = transfer
                        .observe()
                        .await
                        .map_err(|e| std::io::Error::other(e.to_string()))?;
                    Ok((transfer, before))
                })
            })
            .await?;
            let (transfer, before) = target;
            let mutation = repository.remote_mutations.lock().await;
            let selected = bound(
                host.inner().clone(),
                request.session_id,
                binding.clone(),
                move |binding| {
                    let state = lapis_desktop::repository::remote::read(binding)?;
                    if state.revision != revision {
                        return Err(std::io::Error::other("Connection changed before push"));
                    }
                    runtime()?.block_on(async {
                        let intent = if let Some(original) = transfer
                            .pending_push()
                            .map_err(|e| std::io::Error::other(e.to_string()))?
                        {
                            original
                        } else {
                            let session =
                                jj_store_jj::vault_workspace::Session::open(binding.clone())
                                    .await
                                    .map_err(|e| std::io::Error::other(e.to_string()))?;
                            session
                                .prepare_push(&transfer, &request_id, before)
                                .await
                                .map_err(|e| std::io::Error::other(e.to_string()))?
                        };
                        transfer
                            .reserve(&intent)
                            .map_err(|e| std::io::Error::other(e.to_string()))?;
                        Ok((transfer, intent))
                    })
                },
            )
            .await?;
            let (transfer, intent) = selected;
            drop(mutation);
            serde_json::to_value(
                worker(&repository, move || {
                    runtime()?.block_on(async {
                        transfer
                            .publish(&intent)
                            .await
                            .map_err(|e| std::io::Error::other(e.to_string()))
                    })
                })
                .await?,
            )
        }
        action => {
            let _mutation = repository.remote_mutations.lock().await;
            let current = context.current().await?;
            let (revision, recovering) = match &action {
                Action::Preview { revision, .. }
                | Action::Conflict { revision, .. }
                | Action::Resolve { revision, .. } => (*revision, false),
                Action::Apply { revision, request } => {
                    if request.request_id.is_empty()
                        || !request
                            .request_id
                            .bytes()
                            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
                    {
                        return Err(failure("Invalid sync request identity"));
                    }
                    (
                        *revision,
                        binding
                            .state
                            .join("sync-restore-receipts")
                            .join(format!("{}.json", request.request_id))
                            .is_file(),
                    )
                }
                _ => unreachable!(),
            };
            if current.revision != revision && !recovering {
                return Err(failure("Connection changed; synchronize again"));
            }
            let owner = repository
                .backups
                .owner(&request.session_id, &caller.window)
                .await?;
            match action {
                Action::Preview { candidate, .. } => serde_json::to_value(
                    owner
                        .backup
                        .preview_sync(candidate)
                        .await
                        .map_err(failure)?,
                ),
                Action::Apply { request, .. } => {
                    serde_json::to_value(owner.backup.apply_sync(request).await.map_err(failure)?)
                }
                Action::Conflict {
                    candidate, path, ..
                } => serde_json::to_value(
                    owner
                        .backup
                        .sync_conflict(candidate, path)
                        .await
                        .map_err(failure)?,
                ),
                Action::Resolve {
                    candidate,
                    path,
                    resolution,
                    ..
                } => serde_json::to_value(
                    owner
                        .backup
                        .resolve_sync(candidate, path, resolution)
                        .await
                        .map_err(failure)?,
                ),
                _ => unreachable!(),
            }
        }
    };
    result.map_err(|_| failure("Synchronization response is invalid"))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sync_frames_reject_paths_credentials_and_caller_injection() {
        let frame =
            serde_json::json!({"sessionId":"opaque","action":{"kind":"prepare","revision":1}});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        for key in [
            "root",
            "metadata",
            "url",
            "token",
            "window",
            "generation",
            "account",
        ] {
            let mut altered = frame.clone();
            altered[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(altered).is_err());
            let mut altered = frame.clone();
            altered["action"][key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(altered).is_err());
        }
    }
}
