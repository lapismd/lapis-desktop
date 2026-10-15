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
        .plugin(state.build());
    #[cfg(feature = "e2e")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());
    builder
        .invoke_handler(tauri::generate_handler![
            crate::commands::shell_info,
            crate::commands::shell_ready
        ])
        .setup(|app| {
            app.set_menu(tauri::menu::Menu::default(app.handle())?)?;
            crate::window::build(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
}

fn commands_state() -> crate::commands::ShellState {
    crate::commands::ShellState::default()
}
