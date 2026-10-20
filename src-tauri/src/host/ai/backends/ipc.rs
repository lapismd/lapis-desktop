//! Tauri caller extraction; command policy and work ownership stay in dispatch.
use super::{NativeBackends, commands::dispatch, denied};
use crate::host::state::{NativeError, NativeHost};
use std::sync::Arc;
use tauri::{Manager, WebviewWindow};
use tauri_plugin_lapis_ai::AiExt;

#[tauri::command]
pub async fn desktop_ai_backends(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    backends: tauri::State<'_, Arc<NativeBackends>>,
    request: String,
) -> Result<String, NativeError> {
    let context = super::super::policy::caller(&window).map_err(|_| denied())?;
    dispatch(
        backends.inner().clone(),
        host.inner().clone(),
        window.app_handle().ai(),
        context,
        request,
    )
    .await
    .map_err(Into::into)
}
