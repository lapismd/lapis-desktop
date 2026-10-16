fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "shell_info",
            "shell_ready",
            "lifecycle_reload",
            "lifecycle_quit",
            "lifecycle_result",
            "vault_recents",
            "vault_restore",
            "vault_remember_notes",
            "vault_select",
            "vault_open_recent",
            "vault_close",
            "vault_fs",
            "vault_db_open",
            "vault_db_execute",
            "vault_db_close",
        ]),
    ))
    .expect("Tauri build metadata and command permissions must be generated");
}
