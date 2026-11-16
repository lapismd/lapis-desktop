//! Bounded account actions; Core owns accepted work and protected state.
use super::{caller, selected};
use crate::host::state::{NativeError, NativeHost, NativeServices, access};
use lapis_app_core::sync::account::owner::AccountWork;
use lapis_desktop::sync::{
    account::presentation::Presentation,
    commands::{NativeSyncCommand, SyncAction},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    io,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Manager, State, WebviewWindow};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CallRequest {
    handle: Uuid,
    command: NativeSyncCommand,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reply {
    provider: &'static str,
    request_id: String,
    value: Value,
}

#[derive(Serialize)]
pub struct Completed {
    handle: Uuid,
    reply: Reply,
    observation: Presentation,
}

enum Admission {
    Configured,
    Work(AccountWork),
}

#[tauri::command]
pub async fn desktop_sync_call(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: CallRequest,
) -> Result<Completed, NativeError> {
    let owner = caller(&window)?;
    let repository = window
        .app_handle()
        .state::<crate::host::repository::RepositoryHost>();
    let transition = repository.transitions.lock().await;
    let request_id = request.command.request_id().to_owned();
    let now = i64::try_from(
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| invalid())?
            .as_millis(),
    )
    .map_err(|_| invalid())?;
    let action = request.command.action(now)?;
    let admitting = owner.clone();
    let (handle, admission) = access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        let sync = selected(sync)?;
        sync.validate(vaults, &admitting, request.handle)?;
        match action {
            SyncAction::Configure { origin } => {
                let handle = sync.configure(vaults, &admitting, request.handle, &origin)?;
                Ok((handle, Admission::Configured))
            }
            SyncAction::Account(command) => Ok((
                request.handle,
                Admission::Work(sync.submit(vaults, &admitting, request.handle, command)?),
            )),
            SyncAction::OpenApproval => Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Native Sync approval handoff is not available",
            )),
        }
    })
    .await?;
    // The retained native account owns work; close can now fence and drain it.
    drop(transition);
    let outcome = match admission {
        Admission::Configured => Ok(Value::Null),
        Admission::Work(work) => work.wait().await.and_then(super::reply::value),
    };
    caller(&window)?;
    access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        let observation = selected(sync)?.presentation(vaults, &owner, handle)?;
        Ok(Completed {
            handle,
            reply: Reply {
                provider: "lapis-server",
                request_id,
                value: outcome?,
            },
            observation,
        })
    })
    .await
}

fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidInput,
        "Native Sync account call is unavailable",
    )
}
