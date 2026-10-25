//! Admitted immutable indexing/query work. No capture or editor writer lease.
use super::{
    RepositoryHost, policy,
    remote::{bound, failure},
};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::search::{NativeHistory, indexed};
use serde::{Deserialize, Serialize};
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
    Start {},
    Status {},
    Query {
        search: indexed::Request,
    },
    Context {
        commit: String,
        path: String,
        start: usize,
        end: usize,
    },
}
#[derive(Serialize)]
#[serde(untagged)]
pub enum Response {
    Status(indexed::Status),
    Page(indexed::Page),
    Context(Context),
}
#[derive(Serialize)]
pub struct Context {
    text: String,
    start: usize,
    end: usize,
    before: bool,
    after: bool,
}

#[tauri::command]
pub async fn desktop_backup_history_search(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<Response, NativeError> {
    policy::caller(&window).map_err(failure)?;
    let session = request.session_id.clone();
    let observe = matches!(request.action, Action::Start {} | Action::Status {});
    let (descriptor, service) = access(host.inner().clone(), move |state| {
        state.vaults.get(&session)?.verify_physical_root()?;
        let service = if observe {
            Some(state.core_vaults.service(&state.vaults, &session)?)
        } else {
            None
        };
        Ok((state.vaults.descriptor(&session)?.clone(), service))
    })
    .await?;
    let permit = repository
        .search_slots
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| failure("History search is closed"))?;
    let binding = super::storage::resolve(&repository, descriptor, false).await?;
    let source = binding.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        let _permit = permit;
        // Missing managed history is a neutral empty source. Reads never initialize it.
        if std::fs::symlink_metadata(source.state.join("vault.json"))
            .is_err_and(|error| error.kind() == std::io::ErrorKind::NotFound)
        {
            let status = indexed::Status {
                generation: 0,
                indexed: 0,
                omitted: 0,
                complete: true,
            };
            return match request.action {
                Action::Start {} | Action::Status {} => Ok(Response::Status(status)),
                Action::Query { .. } => Ok(Response::Page(indexed::Page {
                    status,
                    hits: vec![],
                    next: None,
                    reset: false,
                })),
                Action::Context { .. } => Err("This vault has no saved history".into()),
            };
        }
        let history = NativeHistory {
            binding: source,
            exclusions: vec![],
        };
        let value = match request.action {
            Action::Start {} => Response::Status(super::history_owner::status(
                service.ok_or("History owner is unavailable")?,
                true,
            )?),
            Action::Status {} => Response::Status(super::history_owner::status(
                service.ok_or("History owner is unavailable")?,
                false,
            )?),
            Action::Query { search } => Response::Page(history.indexed_search(&search)?),
            Action::Context {
                commit,
                path,
                start,
                end,
            } => {
                if end <= start || end - start > 80 || end > 1_000_000 {
                    return Err("Invalid historical context range".into());
                }
                let text = history
                    .indexed_text(&commit, &path)?
                    .ok_or("Historical text is unavailable")?;
                let lines = text.lines().collect::<Vec<_>>();
                let selected = lines
                    .get(start..end.min(lines.len()))
                    .ok_or("Historical context is unavailable")?
                    .join("\n");
                if selected.len() > 32 * 1024 {
                    return Err("Historical context exceeds its read budget".into());
                }
                Response::Context(Context {
                    text: selected,
                    start,
                    end: end.min(lines.len()),
                    before: start > 0,
                    after: end < lines.len(),
                })
            }
        };
        Ok::<_, String>(value)
    })
    .await
    .map_err(|_| failure("History index worker stopped"))?
    .map_err(failure)?;
    bound(
        host.inner().clone(),
        request.session_id,
        binding,
        |_| Ok(()),
    )
    .await?;
    Ok(result)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn index_actions_cannot_select_storage_paths_or_caller_authority() {
        let frame = serde_json::json!({"sessionId":"opaque","action":{"kind":"status"}});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        let legacy = serde_json::json!({"sessionId":"opaque","action":{"kind":"step"}});
        assert!(serde_json::from_value::<Request>(legacy).is_err());
        for key in ["root", "state", "index", "window", "token", "exclusions"] {
            for nested in [false, true] {
                let mut value = frame.clone();
                if nested {
                    value["action"][key] = serde_json::json!("outside");
                } else {
                    value[key] = serde_json::json!("outside");
                }
                assert!(serde_json::from_value::<Request>(value).is_err());
            }
        }
    }
}
