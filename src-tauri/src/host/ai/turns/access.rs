//! One admitted client path for turn and queue commands; no execution policy here.
use super::{Retained, TurnOwner};
use crate::host::{
    ai::{owner::NativeAiOwner, policy::caller},
    state::{NativeError, NativeHost},
};
use lapis_app_core::services::Client;
use std::{io, sync::Arc};
use tauri::{Manager, WebviewWindow};

pub(super) async fn call<T, F>(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    operation: F,
) -> Result<T, NativeError>
where
    T: Send + 'static,
    F: FnOnce(Arc<Client>) -> io::Result<T> + Send + 'static,
{
    let context = caller(&window)
        .map_err(|_| io::Error::new(io::ErrorKind::PermissionDenied, "Local caller required"))?;
    if !window.app_handle().state::<TurnOwner>().is_core() {
        return Err(
            io::Error::new(io::ErrorKind::Unsupported, "Native chat is not selected").into(),
        );
    }
    let owner = window
        .app_handle()
        .state::<Arc<NativeAiOwner>>()
        .inner()
        .clone();
    let transition = owner.transitions.clone().lock_owned().await;
    let native = host.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _transition = transition;
        let lease = owner.current(&native, &context.window)?;
        if lease.session() != session_id {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Native vault admission changed",
            ));
        }
        let client = {
            let mut services = native
                .0
                .lock()
                .map_err(|_| io::Error::other("Native owner unavailable"))?;
            let crate::host::state::NativeServices {
                core_vaults,
                vaults,
                ..
            } = &mut *services;
            core_vaults.client(vaults, lease.session())?
        };
        Retained::retain(
            &owner.turns,
            &context.window,
            lease.generation(),
            client.clone(),
        )?;
        operation(client)
    })
    .await
    .map_err(|_| io::Error::other("Native AI command interrupted"))?
    .map_err(Into::into)
}
