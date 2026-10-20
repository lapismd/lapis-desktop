//! One-shot response loss after a real restore receipt; absent from ordinary builds.
pub async fn after_apply(
    scope: &'static str,
    request: impl serde::Serialize + Send + 'static,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(root) = std::env::var_os("LAPIS_DESKTOP_ACCEPTANCE_ROOT") else {
            return Ok(());
        };
        let root = std::path::PathBuf::from(root);
        let arm = root.join("restore-response-loss.arm");
        match std::fs::rename(arm, root.join("restore-response-loss.consumed")) {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(error) => return Err(error.to_string()),
            Ok(()) => {}
        }
        let receipt = serde_json::to_vec_pretty(&serde_json::json!({
            "scope": scope,
            "request": request,
        }))
        .map_err(|error| error.to_string())?;
        std::fs::write(root.join("restore-response-loss.receipt.json"), receipt)
            .map_err(|error| error.to_string())?;
        Err("Acceptance restore response lost after native receipt".to_owned())
    })
    .await
    .map_err(|error| error.to_string())?
}
