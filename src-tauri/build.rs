fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["shell_info", "shell_ready"])),
    )
    .expect("Tauri build metadata and command permissions must be generated");
}
