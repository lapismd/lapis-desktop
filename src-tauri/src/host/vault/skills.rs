//! Local main-window transport; shared Core owns source discovery and all writes.
use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_core::skills::{PackagedSkill, SkillResult};
use std::io;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub async fn vault_skills(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    action: String,
    skill: Option<String>,
) -> Result<Vec<SkillResult>, NativeError> {
    let url = window.url().map_err(io::Error::other)?;
    if window.label() != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
        .into());
    }
    let bundled = window.state::<BundledSkills>().0.clone();
    let client = access(host.inner().clone(), move |services| {
        services.core_vaults.client(&services.vaults, &session_id)
    })
    .await?;
    tauri::async_runtime::spawn_blocking(move || {
        client
            .manage_packaged_skills(&bundled, &action, skill.as_deref())
            .map_err(io::Error::other)
            .map_err(Into::into)
    })
    .await
    .map_err(io::Error::other)?
}

pub struct BundledSkills(pub Vec<PackagedSkill>);
pub fn bundled(app: &tauri::AppHandle) -> io::Result<BundledSkills> {
    let packaged = app
        .path()
        .resource_dir()
        .map_err(io::Error::other)?
        .join("bundled-skills.json");
    let path = if packaged.is_file() {
        packaged
    } else if cfg!(debug_assertions) && !cfg!(feature = "custom-protocol") {
        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/bundled-skills.json")
    } else {
        packaged
    };
    let mut bundles = vec![lapis_app_core::skills::provider::cli_skill()];
    bundles.extend(
        serde_json::from_slice::<Vec<PackagedSkill>>(&std::fs::read(path)?)
            .map_err(io::Error::other)?,
    );
    Ok(BundledSkills(bundles))
}
