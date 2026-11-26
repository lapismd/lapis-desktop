//! On-demand OS acceptance only; no ordinary command or simulated delivery sink.
use serde_json::Value;
#[cfg(target_os = "macos")]
use serde_json::json;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub async fn notification_acceptance(
    window: WebviewWindow,
    action: String,
) -> Result<Value, String> {
    if window.label() != "main"
        || !window
            .app_handle()
            .config()
            .identifier
            .starts_with("com.lapismd.lapis-desktop.acceptance.notifications.")
    {
        return Err("Dedicated notification acceptance bundle required".into());
    }
    #[cfg(target_os = "macos")]
    {
        match action.as_str() {
            "status" => {
                let settings = mac_usernotifications::get_notification_settings()
                    .await
                    .map_err(|error| error.to_string())?;
                let ids = mac_usernotifications::get_delivered_notification_ids().await;
                Ok(
                    json!({"authorization":format!("{:?}",settings.authorization_status),"deliveredIds":ids}),
                )
            }
            "job" => {
                let delivery = crate::host::integration::services::job_delivery()
                    .ok_or("Native job notifications unavailable")?;
                tauri::async_runtime::spawn_blocking(move || {
                    delivery(&lapis_app_protocol::database::state::NotificationRecord {
                        id: "plugin-job-notification-acceptance".into(),
                        title: Some("Lapis background job acceptance".into()),
                        message: "A background service delivered this system notification.".into(),
                        severity: lapis_app_protocol::database::state::NotificationSeverity::Info,
                        source: Some("notification-acceptance".into()),
                        created_at: 0.0,
                        updated_at: 0.0,
                        read: false,
                        cleared: false,
                    })
                })
                .await
                .map_err(|_| "Notification acceptance worker failed")??;
                Ok(json!({"submitted":true}))
            }
            "clear" => {
                // This bundle ID is generated for this build and never belongs to an installed app.
                for id in mac_usernotifications::get_delivered_notification_ids().await {
                    mac_usernotifications::close_delivered(&id).await;
                }
                Ok(Value::Null)
            }
            _ => Err("Unknown notification acceptance action".into()),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = action;
        Err("Notification OS acceptance requires macOS".into())
    }
}
