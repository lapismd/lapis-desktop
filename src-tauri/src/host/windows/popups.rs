use lapis_desktop::windows::{CloseOutcome, WorkspaceWindows};
use serde::Deserialize;
use serde_json::{Value, json};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use uuid::Uuid;

#[derive(Clone, Default)]
pub struct NativeWorkspaceWindows(pub Arc<Mutex<WorkspaceWindows>>);

#[derive(Deserialize)]
#[serde(
    tag = "action",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum WindowFrame {
    Begin {
        session_id: String,
    },
    Issue {
        session_id: String,
    },
    CancelTicket {
        label: String,
    },
    Fence {
        session_id: String,
    },
    Resume {
        session_id: String,
    },
    End {
        session_id: String,
    },
    RequestClose {
        label: String,
    },
    FinishClose {
        label: String,
        request_id: Uuid,
        saved: bool,
    },
    Focus {
        label: String,
    },
    Drag {
        label: String,
    },
    Zoom {
        label: String,
    },
}

#[tauri::command]
pub async fn desktop_workspace_windows(
    app: AppHandle,
    window: WebviewWindow,
    frame: WindowFrame,
) -> Result<Value, String> {
    if window.label() != "main" {
        return Err("Workspace windows require the main App owner".into());
    }
    let state = app.state::<NativeWorkspaceWindows>().inner().clone();
    if let WindowFrame::Begin { session_id } = frame {
        let host = app
            .state::<crate::host::state::NativeHost>()
            .inner()
            .clone();
        return tauri::async_runtime::spawn_blocking(move || {
            let services = host.0.lock().map_err(|_| "Vault owner is unavailable")?;
            services
                .vaults
                .get(&session_id)
                .map_err(|error| error.to_string())?;
            let mut registry = state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?;
            registry.begin(&session_id).map_err(str::to_owned)?;
            let mut tickets = Vec::new();
            for _ in 0..4.min(registry.available_capacity()) {
                let ticket = registry.issue("main").map_err(str::to_owned)?;
                tickets.push(json!({"label": ticket.label(), "url": ticket.url()}));
            }
            Ok(json!(tickets))
        })
        .await
        .map_err(|_| "Workspace window admission failed")?;
    }
    match frame {
        WindowFrame::Issue { session_id } => {
            let mut registry = state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?;
            if registry.session_id() != Some(session_id.as_str()) {
                return Err("Workspace session is stale".into());
            }
            if registry.available_capacity() == 0 {
                return Ok(Value::Null);
            }
            let ticket = registry.issue("main").map_err(str::to_owned)?;
            return Ok(json!({"label": ticket.label(), "url": ticket.url()}));
        }
        WindowFrame::CancelTicket { label } => {
            state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?
                .cancel_ticket(&label)
                .map_err(str::to_owned)?;
        }
        WindowFrame::Fence { ref session_id }
        | WindowFrame::Resume { ref session_id }
        | WindowFrame::End { ref session_id } => {
            let mut registry = state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?;
            match frame {
                WindowFrame::Fence { .. } => registry.fence(session_id),
                WindowFrame::Resume { .. } => registry.resume(session_id),
                _ => registry.end(session_id),
            }
            .map_err(str::to_owned)?;
        }
        WindowFrame::RequestClose { label } => {
            let mut registry = state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?;
            let request = registry
                .request_close(&label)
                .map_err(str::to_owned)?
                .or_else(|| registry.pending_close(&label));
            return Ok(json!(request));
        }
        WindowFrame::FinishClose {
            label,
            request_id,
            saved,
        } => {
            let outcome = state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?
                .finish_close(&label, request_id, saved)
                .map_err(str::to_owned)?;
            if outcome == CloseOutcome::Approved {
                app.get_webview_window(&label)
                    .ok_or("Related window is unavailable")?
                    .destroy()
                    .map_err(|error| error.to_string())?;
            }
        }
        WindowFrame::Focus { ref label }
        | WindowFrame::Drag { ref label }
        | WindowFrame::Zoom { ref label } => {
            if state
                .0
                .lock()
                .map_err(|_| "Workspace windows are unavailable")?
                .window_session(label)
                .is_none()
            {
                return Err("Related window is unavailable".into());
            }
            let target = app
                .get_webview_window(label)
                .ok_or("Related window is unavailable")?;
            match frame {
                WindowFrame::Focus { .. } => target
                    .show()
                    .and_then(|()| target.unminimize())
                    .and_then(|()| target.set_focus())
                    .and_then(|()| target.as_ref().set_focus()),
                WindowFrame::Drag { .. } => target.start_dragging(),
                _ => {
                    if target.is_maximized().map_err(|error| error.to_string())? {
                        target.unmaximize()
                    } else {
                        target.maximize()
                    }
                }
            }
            .map_err(|error| error.to_string())?;
        }
        WindowFrame::Begin { .. } => unreachable!(),
    }
    Ok(Value::Null)
}

pub fn request_close(app: &AppHandle, label: &str) -> Result<(), String> {
    let state = app.state::<NativeWorkspaceWindows>();
    let request = state
        .0
        .lock()
        .map_err(|_| "Workspace windows are unavailable")?
        .request_close(label)
        .map_err(str::to_owned)?;
    if let Some(request) = request
        && let Err(error) = app.emit_to("main", "lapis-popup-close", &request)
    {
        let _ = state
            .0
            .lock()
            .map(|mut registry| registry.finish_close(label, request.request_id(), false));
        return Err(error.to_string());
    }
    Ok(())
}

pub fn destroyed(app: &AppHandle, label: &str) {
    if !label.starts_with("workspace-popup-") {
        return;
    }
    if let Ok(mut registry) = app.state::<NativeWorkspaceWindows>().0.lock() {
        registry.retire(label);
    }
    let _ = app.emit_to("main", "lapis-popup-retired", label);
}

pub fn close_vault(app: &AppHandle, session: &str) -> Result<(), std::io::Error> {
    let state = app.state::<NativeWorkspaceWindows>();
    let mut registry = state
        .0
        .lock()
        .map_err(|_| std::io::Error::other("Workspace windows are unavailable"))?;
    if registry.session_id() != Some(session) {
        return Ok(());
    }
    if registry.has_windows() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::WouldBlock,
            "Save and close the related workspace windows first",
        ));
    }
    registry
        .fence(session)
        .and_then(|()| registry.end(session))
        .map_err(std::io::Error::other)
}
