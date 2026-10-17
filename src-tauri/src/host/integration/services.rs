use lapis_desktop::integration::policy::{self, Notification};
use tauri::{AppHandle, WebviewWindow};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_opener::OpenerExt;

fn main_window(window: &WebviewWindow) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Desktop services require the main window".into());
    }
    Ok(())
}

#[tauri::command]
pub async fn desktop_clipboard_read(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<String, String> {
    main_window(&window)?;
    let text = app
        .clipboard()
        .read_text()
        .map_err(|error| error.to_string())?;
    policy::bounded(&text, policy::MAX_CLIPBOARD_BYTES, "clipboard text")?;
    Ok(text)
}

#[tauri::command]
pub async fn desktop_clipboard_write(
    app: AppHandle,
    window: WebviewWindow,
    text: String,
) -> Result<(), String> {
    main_window(&window)?;
    policy::bounded(&text, policy::MAX_CLIPBOARD_BYTES, "clipboard text")?;
    app.clipboard()
        .write_text(text)
        .map_err(|error| error.to_string())
}

pub fn open_external(app: &AppHandle, value: &str) -> Result<(), String> {
    let url = policy::external_url(value)?;
    app.opener()
        .open_url(url.as_str(), None::<&str>)
        .map_err(|error| error.to_string())?;
    #[cfg(feature = "e2e")]
    crate::acceptance::integration::record("external", url.as_str());
    Ok(())
}

#[tauri::command]
pub fn desktop_external_open(
    app: AppHandle,
    window: WebviewWindow,
    url: String,
) -> Result<(), String> {
    main_window(&window)?;
    open_external(&app, &url)
}

#[tauri::command]
pub async fn desktop_notify(
    window: WebviewWindow,
    notification: Notification,
) -> Result<(), String> {
    main_window(&window)?;
    notification.validate()?;
    #[cfg(target_os = "macos")]
    {
        use mac_usernotifications::{AuthorizationStatus, get_notification_settings, request_auth};
        let settings = get_notification_settings()
            .await
            .map_err(|error| error.to_string())?;
        let allowed = match settings.authorization_status {
            AuthorizationStatus::Authorized | AuthorizationStatus::Provisional => true,
            AuthorizationStatus::NotDetermined => {
                request_auth().await.map_err(|error| error.to_string())?
            }
            _ => false,
        };
        if !allowed {
            return Err("Notifications are disabled for Lapis Notes. Enable them in System Settings; the in-app notification history remains available.".into());
        }
        mac_usernotifications::Notification::new()
            .title(notification.title.as_deref().unwrap_or("Lapis Notes"))
            .message(&notification.message)
            .send()
            .await
            .map_err(|error| error.to_string())?;
        #[cfg(feature = "e2e")]
        crate::acceptance::integration::record("notification", &notification.id);
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Native notifications are unavailable on this platform".into())
}
