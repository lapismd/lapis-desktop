//! Tauri authority adapter. Launch and credential material never crosses IPC.
use super::{owner::NativeAiOwner, policy};
use crate::host::state::{NativeError, NativeHost};
use lapis_desktop::ai::tools::{Authorize, Event, EventSink, Outcome, Owner, ToolSpec};
use serde::Deserialize;
use std::{io, sync::Arc};
use tauri::{Emitter, WebviewWindow};
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct Request {
    session_id: String,
    request_id: Uuid,
    operation: Operation,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub(super) enum Operation {
    Open {
        tools: Vec<ToolSpec>,
    },
    #[serde(rename_all = "camelCase")]
    Arm {
        turn_id: Uuid,
    },
    #[serde(rename_all = "camelCase")]
    End {
        turn_id: Uuid,
    },
    #[serde(rename_all = "camelCase")]
    Reply {
        invocation_id: Uuid,
        outcome: Outcome,
    },
    Close {},
}
fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Application tools are unavailable",
    )
}
pub(super) async fn dispatch(
    backends: Arc<NativeAiOwner>,
    host: NativeHost,
    context: HostContext,
    text: String,
    sink: EventSink,
) -> io::Result<()> {
    policy::local(&context).map_err(|_| denied())?;
    if text.len() > 1_048_576 {
        return Err(denied());
    }
    let request: Request = serde_json::from_str(&text).map_err(|_| denied())?;
    // Cleanup and exact execution acknowledgements must remain possible while revoked.
    match request.operation {
        Operation::Close {} => {
            return backends
                .tools
                .close(request.request_id, &context.window, &request.session_id)
                .await;
        }
        Operation::Reply {
            invocation_id,
            outcome,
        } => {
            return backends
                .tools
                .original(request.request_id, &context.window, &request.session_id)?
                .reply(invocation_id, outcome);
        }
        _ => {}
    }
    let checking = backends.clone();
    let calling = context.clone();
    let (lease, host) = tauri::async_runtime::spawn_blocking(move || {
        checking
            .current(&host, &calling.window)
            .map(|lease| (lease, host))
    })
    .await
    .map_err(|_| denied())??;
    if lease.session() != request.session_id {
        return Err(denied());
    }
    let owner = Owner {
        window: context.window.clone(),
        session: lease.session().into(),
        generation: lease.generation().into(),
    };
    match request.operation {
        Operation::Open { tools } => {
            let weak_host = Arc::downgrade(&host.0);
            let weak_backends = Arc::downgrade(&backends);
            let generation = owner.generation.clone();
            let window = owner.window.clone();
            let authorize: Authorize = Arc::new(move || {
                let host = NativeHost(weak_host.upgrade().ok_or_else(denied)?);
                weak_backends
                    .upgrade()
                    .ok_or_else(denied)?
                    .retained(&host, &window, &generation)
                    .map(|_| ())
            });
            backends
                .tools
                .open(request.request_id, owner, tools, authorize, sink)
                .await
        }
        Operation::Arm { turn_id } => backends
            .tools
            .binding(request.request_id, &owner)?
            .arm(turn_id),
        Operation::End { turn_id } => {
            backends
                .tools
                .binding(request.request_id, &owner)?
                .end(turn_id)
                .await
        }
        _ => Err(denied()),
    }
}
#[tauri::command]
pub async fn desktop_ai_tools(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    backends: tauri::State<'_, Arc<NativeAiOwner>>,
    request: String,
) -> Result<(), NativeError> {
    let context = policy::caller(&window).map_err(|_| denied())?;
    let sink: EventSink =
        Arc::new(move |event: Event| window.emit("desktop-ai-tools", event).map_err(|_| denied()));
    dispatch(
        backends.inner().clone(),
        host.inner().clone(),
        context,
        request,
        sink,
    )
    .await
    .map_err(Into::into)
}
