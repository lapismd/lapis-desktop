use super::*;
use serde_json::{Value, json};
use std::time::Duration;
use tauri_plugin_lapis_ai::runtime::ProcessLimits;
#[derive(Debug)]
pub(super) struct Rejected(pub tauri_plugin_lapis_ai::runtime::ComputeFailure);
impl std::fmt::Display for Rejected {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0.message)
    }
}
impl std::error::Error for Rejected {}

pub(super) async fn run(
    owner: &Compute,
    command: &Command,
    mut plan: PreparedLaunch,
) -> io::Result<()> {
    owner.check()?;
    let store = owner.store.clone();
    let saved = tokio::task::spawn_blocking(move || store.read())
        .await
        .map_err(|_| unavailable())?
        .map_err(|_| {
            io::Error::other(Rejected(
                tauri_plugin_lapis_ai::runtime::ComputeFailure::from_code(
                    "compute_storage_unavailable",
                ),
            ))
        })?;
    let settings = match &command.action {
        Action::Configure { settings } => settings.clone(),
        _ => saved.settings,
    };
    let mut client = owner.runtime.client.lock().await;
    if matches!(command.action, Action::Configure { .. }) && client.is_none() {
        return Ok(());
    }
    if client.is_none() {
        let secrets = owner.secrets.clone();
        let directory = plan.directory.clone();
        let identity = tokio::task::spawn_blocking(move || {
            use std::os::unix::fs::PermissionsExt;
            std::fs::create_dir_all(&directory)?;
            std::fs::set_permissions(&directory, std::fs::Permissions::from_mode(0o700))?;
            match secrets.get("compute-identity") {
                Ok(identity) => Ok(identity.to_string()),
                Err(error) if error.kind() == io::ErrorKind::NotFound => {
                    let identity = format!(
                        "{}{}",
                        uuid::Uuid::new_v4().simple(),
                        uuid::Uuid::new_v4().simple()
                    );
                    secrets.set("compute-identity", &identity)?;
                    Ok::<_, io::Error>(identity)
                }
                Err(error) => Err(error),
            }
        })
        .await
        .map_err(|_| unavailable())?
        .map_err(|_| {
            io::Error::other(Rejected(
                tauri_plugin_lapis_ai::runtime::ComputeFailure::from_code("identity_unavailable"),
            ))
        })?;
        plan.environment.0.extend([
            ("JJ_STORE_COMPUTE_IDENTITY".into(), identity),
            (
                "JJ_STORE_COMPUTE_TOKEN".into(),
                format!(
                    "{}{}",
                    uuid::Uuid::new_v4().simple(),
                    uuid::Uuid::new_v4().simple()
                ),
            ),
            (
                "LAPIS_AI_COMPUTE_CONFIG".into(),
                settings.wire().to_string(),
            ),
        ]);
        owner.runtime.view.lock().map_err(|_| unavailable())?.state = "starting".into();
        let active = ComputeClient::start_prepared(plan, ProcessLimits::default())
            .await
            .map_err(|_| {
                io::Error::other(Rejected(
                    tauri_plugin_lapis_ai::runtime::ComputeFailure::from_code("helper_unavailable"),
                ))
            })?;
        *owner.runtime.commands.lock().map_err(|_| unavailable())? = Some(active.commands());
        *owner.runtime.connection.lock().map_err(|_| unavailable())? =
            Some(active.connection().clone());
        *client = Some(active);
    }
    let active = client.as_mut().ok_or_else(unavailable)?;
    let id = command.request_id.to_string();
    exchange(
        owner,
        active,
        &json!({"action":"configure","requestId":format!("{id}-config"),"config":settings.wire()}),
    )
    .await?;
    let frame = match &command.action {
        Action::Configure { .. } => return Ok(()),
        Action::Prepare => json!({"action":"prepare","requestId":id}),
        Action::Download => json!({"action":"download","requestId":id}),
        Action::Start => json!({"action":"start","requestId":id}),
        Action::Import { path } => json!({"action":"import","requestId":id,"path":path}),
        Action::Remove { model } => {
            if owner.runtime.view.lock().map_err(|_| unavailable())?.state == "serving" {
                return Err(io::Error::other(Rejected(
                    tauri_plugin_lapis_ai::runtime::ComputeFailure::from_code("compute_busy"),
                )));
            }
            json!({"action":"remove","requestId":id,"model":model})
        }
        Action::Stop { .. } => return Err(unavailable()),
    };
    owner
        .runtime
        .view
        .lock()
        .map_err(|_| unavailable())?
        .progress = Some(types::Progress {
        action: frame["action"].as_str().unwrap_or("download").into(),
        ..Default::default()
    });
    exchange(owner, active, &frame).await?;
    {
        let mut view = owner.runtime.view.lock().map_err(|_| unavailable())?;
        if !matches!(command.action, Action::Start) && view.state != "serving" {
            view.state = "ready".into();
        }
        if matches!(command.action, Action::Start) {
            view.active_model = settings.model;
        }
    }
    owner
        .runtime
        .view
        .lock()
        .map_err(|_| unavailable())?
        .progress = None;
    Ok(())
}
async fn exchange(owner: &Compute, client: &mut ComputeClient, frame: &Value) -> io::Result<()> {
    owner.check()?;
    client
        .commands()
        .send_frame(frame)
        .await
        .map_err(|_| unavailable())?;
    let deadline = tokio::time::Instant::now() + Duration::from_secs(3600);
    loop {
        let event = client
            .next_event(deadline.saturating_duration_since(tokio::time::Instant::now()))
            .await
            .map_err(|_| unavailable())?;
        {
            let mut view = owner.runtime.view.lock().map_err(|_| unavailable())?;
            match event["type"].as_str() {
                Some("ready") => {
                    view.state = "ready".into();
                    view.invitation = event.get("invitation").cloned();
                }
                Some("serving") => view.state = "serving".into(),
                Some("imported") => {
                    view.imported_model = event["model"].as_str().map(str::to_owned)
                }
                Some("download_progress" | "progress")
                    if event["requestId"].is_null() || event["requestId"] == frame["requestId"] =>
                {
                    view.progress = Some(types::Progress::from_event(&event))
                }
                _ => {}
            }
        }
        if event["requestId"] == frame["requestId"]
            && matches!(
                event["type"].as_str(),
                Some("configured" | "completed" | "error")
            )
        {
            return if event["type"] == "error" {
                Err(io::Error::other(Rejected(
                    tauri_plugin_lapis_ai::runtime::ComputeFailure::from_code(
                        event["code"].as_str().unwrap_or("compute_operation_failed"),
                    ),
                )))
            } else {
                Ok(())
            };
        }
    }
}
