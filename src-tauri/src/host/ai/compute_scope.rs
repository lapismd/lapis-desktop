//! Compute admission shares vault generations without preparing ACP providers.
use super::owner::{NativeAiOwner, revoke};
use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::vault::admission::VaultLease;
use std::sync::Arc;
use tauri::{Manager, WebviewWindow};
use tauri_plugin_lapis_ai::AiExt;

/// The caller holds the AI transition lock throughout admission and dispatch.
pub(super) async fn admit(
    window: &WebviewWindow,
    host: &NativeHost,
    owner: &Arc<NativeAiOwner>,
    session: &str,
) -> Result<VaultLease, NativeError> {
    let checking = owner.clone();
    let label = window.label().to_owned();
    let session = session.to_owned();
    let plan = access(host.clone(), move |services| {
        checking.ensure_live()?;
        services.ai.prepare(&services.vaults, &label, &session)
    })
    .await?;
    if !plan.preserves_workers() {
        revoke(&window.app_handle().ai(), owner, window.label(), None).await?;
    }
    let checking = owner.clone();
    access(host.clone(), move |services| {
        checking.ensure_live()?;
        services.ai.complete(&services.vaults, &plan)
    })
    .await
}
