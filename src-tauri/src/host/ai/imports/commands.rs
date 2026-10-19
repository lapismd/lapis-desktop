use super::{NativeImports, denied};
use crate::host::state::{NativeError, NativeHost, access};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{io, sync::Arc};
use tauri::{Manager, WebviewWindow};
use uuid::Uuid;
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Request {
    #[serde(rename_all = "camelCase")]
    Open {
        session_id: String,
    },
    Prepare {
        handle: Uuid,
    },
    List {
        handle: Uuid,
        ticket: Uuid,
    },
    Preview {
        handle: Uuid,
        ticket: Uuid,
        selector: String,
    },
    Cancel {
        handle: Uuid,
        ticket: Uuid,
    },
    Close {
        handle: Uuid,
    },
}
#[tauri::command]
pub async fn desktop_ai_imports(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: Request,
) -> Result<Value, NativeError> {
    let context = super::super::policy::caller(&window).map_err(|_| denied())?;
    let imports = window
        .app_handle()
        .state::<Arc<NativeImports>>()
        .inner()
        .clone();
    let owner = context.window.clone();
    let handle = match request {
        Request::Open { session_id } => {
            let _transition = imports.transitions.lock().await;
            let checking = imports.clone();
            let name = owner.clone();
            let plan = access(host.inner().clone(), move |services| {
                checking.check_window(&name)?;
                services
                    .imports
                    .prepare(&services.vaults, &name, &session_id)
            })
            .await?;
            imports.drain(&owner, None).await?;
            let checking = imports.clone();
            let lease = access(host.inner().clone(), move |services| {
                checking.check_window(&context.window)?;
                services.imports.complete(&services.vaults, &plan)
            })
            .await?;
            return Ok(json!(imports.open(host.inner(), &owner, lease)?));
        }
        Request::Close { handle } => {
            let _transition = imports.transitions.lock().await;
            // A late client may release only its own handle.
            if imports.matching(&owner, handle)?.is_some() {
                imports.drain(&owner, Some(handle)).await?;
                access(host.inner().clone(), move |services| {
                    services.imports.leave(&owner, false);
                    Ok(())
                })
                .await?;
            }
            return Ok(Value::Null);
        }
        Request::Prepare { handle } => {
            let scope = imports.scope(&owner, handle)?;
            let ticket = tauri::async_runtime::spawn_blocking(move || scope.prepare())
                .await
                .map_err(|_| denied())??;
            return Ok(json!(ticket));
        }
        Request::Cancel { handle, ticket } => {
            imports.scope(&owner, handle)?.cancel(ticket)?;
            return Ok(Value::Null);
        }
        Request::List { handle, .. } | Request::Preview { handle, .. } => handle,
    };
    let scope = imports.scope(&owner, handle)?;
    let ticket = match &request {
        Request::List { ticket, .. } | Request::Preview { ticket, .. } => *ticket,
        _ => unreachable!(),
    };
    // Registered before spawn_blocking, including when the worker pool is busy.
    let work = scope.begin(ticket)?;
    let home = imports.home.clone();
    tauri::async_runtime::spawn_blocking(move || -> io::Result<Value> {
        work.check()?;
        let result = match request {
            Request::List { .. } => {
                let catalog = lapis_desktop::ai::imports::discover(&home, &|| work.check())?;
                let rows = catalog.rows();
                work.check()?;
                *scope.catalog.lock().map_err(|_| denied())? = catalog;
                json!(rows)
            }
            Request::Preview { selector, .. } => {
                if selector.len() > 128 {
                    return Err(denied());
                }
                let catalog = NativeImports::catalog(&scope)?;
                json!(lapis_desktop::ai::imports::preview(
                    &catalog,
                    &selector,
                    &home,
                    &|| work.check()
                )?)
            }
            _ => unreachable!(),
        };
        work.check()?;
        Ok(result)
    })
    .await
    .map_err(|_| io::Error::other("Transcript worker could not complete"))?
    .map_err(Into::into)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn frames_reject_paths_and_generation_or_execution_overrides() {
        for request in [
            json!({"type":"open","sessionId":"v","root":"/private"}),
            json!({"type":"open","sessionId":"v","generation":"x"}),
            json!({"type":"list","path":"/private"}),
            json!({"type":"execute","program":"codex"}),
        ] {
            assert!(serde_json::from_value::<Request>(request).is_err());
        }
    }
}
