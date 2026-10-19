pub(crate) mod ai;
pub(crate) mod database;
pub(crate) mod integration;
pub(crate) mod lifecycle;
pub(crate) mod repository;
pub(crate) mod shell;
pub(crate) mod state;
pub(crate) mod terminal;
pub(crate) mod vault;
pub(crate) mod windows;

use tauri::Manager;
use tauri_plugin_lapis_ai::AiExt;

pub fn run() -> tauri::Result<()> {
    let state = tauri_plugin_window_state::Builder::default();
    #[cfg(feature = "e2e")]
    let state = {
        let path = std::env::var("LAPIS_DESKTOP_ACCEPTANCE_STATE")
            .expect("the e2e feature requires an isolated acceptance state file");
        assert!(std::path::Path::new(&path).is_absolute());
        state.with_filename(path)
    };
    let terminal = crate::host::terminal::DesktopTerminalPolicy::default();
    let ai = crate::host::ai::policy::DesktopAiPolicy::default();
    let builder = tauri::Builder::default()
        .manage(ai.clone())
        .manage(terminal.clone())
        .plugin(tauri_plugin_lapis_terminal::Builder::new(terminal).build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            crate::host::integration::arguments(app, args);
            crate::host::integration::raise(app);
        }))
        .manage(crate::host::integration::IntegrationState::default())
        .manage(commands_state())
        .manage(crate::host::lifecycle::NativeLifecycle::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .register_uri_scheme_protocol("lapis-vault", |context, request| {
            if context.webview_label() != "main" {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::new())
                    .unwrap();
            }
            let host = context
                .app_handle()
                .state::<crate::host::state::NativeHost>();
            match host.0.lock() {
                Ok(services) => {
                    lapis_desktop::vault::resources::response(&services.vaults, &request)
                }
                Err(_) => tauri::http::Response::builder()
                    .status(503)
                    .body(Vec::new())
                    .unwrap(),
            }
        })
        .plugin(state.build());
    #[cfg(not(feature = "e2e"))]
    let builder = builder.plugin(tauri_plugin_lapis_ai::Builder::new(ai.clone()).build());
    #[cfg(feature = "e2e")]
    let builder = {
        let builder = if crate::acceptance::background::native_ai_policy() {
            builder.plugin(tauri_plugin_lapis_ai::Builder::new(ai.clone()).build())
        } else {
            let policy = crate::acceptance::acp::Policy::default();
            builder
                .manage(policy.clone())
                .plugin(tauri_plugin_lapis_ai::Builder::new(policy).build())
        };
        let builder = builder.plugin(tauri_plugin_wdio::init());
        // The embedded driver's WKUIDelegate replaces Wry's popup callback.
        // This dedicated proof uses console receipts and retains the real delegate.
        if crate::acceptance::popouts::mode().is_some() {
            builder
        } else {
            builder.plugin(tauri_plugin_wdio_webdriver::init())
        }
    };
    builder
        .invoke_handler(tauri::generate_handler![
            #[cfg(feature = "e2e")]
            crate::acceptance::acp::acp_acceptance_control,
            crate::host::terminal::desktop_terminal_admit,
            crate::host::terminal::desktop_terminal_release,
            crate::host::ai::user_commands::desktop_ai_user_commands,
            crate::host::ai::admission::desktop_ai_admit,
            crate::host::ai::imports::commands::desktop_ai_imports,
            crate::host::ai::admission::desktop_ai_release,
            crate::host::ai::backends::commands::desktop_ai_backends,
            crate::host::ai::tools::desktop_ai_tools,
            crate::host::repository::commands::desktop_repository_admit,
            crate::host::repository::commands::desktop_repository_release,
            crate::host::repository::working_copy::desktop_repository_working_copy,
            crate::host::shell::shell_info,
            crate::host::shell::shell_ready,
            crate::host::integration::services::desktop_clipboard_read,
            crate::host::integration::services::desktop_clipboard_write,
            crate::host::integration::services::desktop_external_open,
            crate::host::integration::services::desktop_notify,
            crate::host::integration::desktop_url_next,
            crate::host::integration::desktop_url_ack,
            crate::host::integration::desktop_url_enqueue,
            crate::host::lifecycle::lifecycle_reload,
            crate::host::lifecycle::lifecycle_quit,
            crate::host::lifecycle::lifecycle_result,
            crate::host::vault::vault_recents,
            crate::host::vault::vault_restore,
            crate::host::vault::vault_remember_notes,
            crate::host::vault::vault_select,
            crate::host::vault::vault_open_recent,
            crate::host::vault::vault_close,
            crate::host::vault::files::vault_fs,
            crate::host::vault::watch::vault_watch_start,
            crate::host::vault::watch::vault_watch_stop,
            crate::host::database::vault_db_open,
            crate::host::database::vault_db_execute,
            crate::host::database::vault_db_close
        ])
        .setup(move |app| {
            #[cfg(all(feature = "e2e", target_os = "macos"))]
            if crate::acceptance::background::enabled() {
                app.set_activation_policy(tauri::ActivationPolicy::Prohibited);
            }
            crate::host::state::initialize(app.handle())?;
            crate::host::repository::initialize(app.handle())?;
            #[cfg(not(feature = "e2e"))]
            let ai_config = app.path().app_data_dir()?.join("ai-runtime.json");
            #[cfg(feature = "e2e")]
            let ai_config =
                std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?)
                    .join("profile/ai-runtime.json");
            ai.configure_file_profile(ai_config, app.path().home_dir()?)?;
            ai.initialize(
                app.state::<crate::host::state::NativeHost>()
                    .inner()
                    .clone(),
                &app.ai(),
                app.state::<std::sync::Arc<crate::host::ai::backends::NativeBackends>>()
                    .inner()
                    .clone(),
            )?;
            app.set_menu(crate::host::integration::menu::build(app.handle())?)?;
            crate::host::windows::build(app.handle())?;
            crate::host::integration::arguments(app.handle(), std::env::args().skip(1));
            Ok(())
        })
        .on_menu_event(|app, event| {
            crate::host::integration::menu::dispatch(app, event.id().as_ref())
        })
        .build(tauri::generate_context!())?
        .run(crate::host::lifecycle::on_event);
    Ok(())
}

fn commands_state() -> crate::host::shell::ShellState {
    crate::host::shell::ShellState::default()
}
