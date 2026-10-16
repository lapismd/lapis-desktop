use tauri::Manager;

pub fn run() -> tauri::Result<()> {
    let state = tauri_plugin_window_state::Builder::default();
    #[cfg(feature = "e2e")]
    let state = {
        let path = std::env::var("LAPIS_DESKTOP_ACCEPTANCE_STATE")
            .expect("the e2e feature requires an isolated acceptance state file");
        assert!(std::path::Path::new(&path).is_absolute());
        state.with_filename(path)
    };
    let builder = tauri::Builder::default()
        .manage(commands_state())
        .manage(crate::lifecycle::NativeLifecycle::default())
        .plugin(tauri_plugin_dialog::init())
        .register_uri_scheme_protocol("lapis-vault", |context, request| {
            if context.webview_label() != "main" {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::new())
                    .unwrap();
            }
            let host = context
                .app_handle()
                .state::<crate::native_host::NativeHost>();
            match host.0.lock() {
                Ok(services) => lapis_desktop::resources::response(&services.vaults, &request),
                Err(_) => tauri::http::Response::builder()
                    .status(503)
                    .body(Vec::new())
                    .unwrap(),
            }
        })
        .plugin(state.build());
    #[cfg(feature = "e2e")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());
    builder
        .invoke_handler(tauri::generate_handler![
            crate::commands::shell_info,
            crate::commands::shell_ready,
            crate::lifecycle::lifecycle_reload,
            crate::lifecycle::lifecycle_quit,
            crate::lifecycle::lifecycle_result,
            crate::vault_commands::vault_recents,
            crate::vault_commands::vault_restore,
            crate::vault_commands::vault_remember_notes,
            crate::vault_commands::vault_select,
            crate::vault_commands::vault_open_recent,
            crate::vault_commands::vault_close,
            crate::vault_commands::vault_fs,
            crate::database_commands::vault_db_open,
            crate::database_commands::vault_db_execute,
            crate::database_commands::vault_db_close
        ])
        .setup(|app| {
            crate::native_host::initialize(app.handle())?;
            app.set_menu(tauri::menu::Menu::default(app.handle())?)?;
            crate::window::build(app.handle())?;
            Ok(())
        })
        .build(tauri::generate_context!())?
        .run(crate::lifecycle::on_event);
    Ok(())
}

fn commands_state() -> crate::commands::ShellState {
    crate::commands::ShellState::default()
}
