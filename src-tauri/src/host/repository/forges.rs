use super::policy;
use crate::host::state::NativeError;
use jj_forge::accounts::{Command, Inventory};
use lapis_desktop::repository::forges::ForgeAccounts;
use serde::Deserialize;
use std::io;
use tauri::{Manager as _, State, WebviewWindow};
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    command: Option<Command>,
}

pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(not(feature = "e2e"))]
    let root = app.path().app_data_dir()?.join("forge-accounts");
    #[cfg(feature = "e2e")]
    let root =
        std::env::temp_dir().join(format!("lapis-desktop-e2e-forges-{}", std::process::id()));
    // Reuse only operator-configured public application identity. Desktop
    // account records and credentials have independent installation ownership.
    if !app.manage(ForgeAccounts::native(root)) {
        return Err(io::Error::other("Forge accounts already initialized").into());
    }
    Ok(())
}
#[tauri::command]
pub async fn desktop_forge_accounts(
    window: WebviewWindow,
    accounts: State<'_, ForgeAccounts>,
    request: Request,
) -> Result<Inventory, NativeError> {
    policy::caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Forge account caller unavailable",
        )
    })?;
    accounts.execute(request.command).await.map_err(Into::into)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn forge_frames_cannot_select_custody_or_caller_authority() {
        let valid = serde_json::json!({"command":null});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        for key in [
            "root",
            "scope",
            "service",
            "window",
            "generation",
            "sessionId",
            "client_id",
        ] {
            let mut frame = valid.clone();
            frame[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(frame).is_err());
        }
    }
}
