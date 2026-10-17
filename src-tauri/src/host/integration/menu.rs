use tauri::{
    AppHandle, Emitter, Manager,
    menu::{AboutMetadata, Menu, MenuItem, PredefinedMenuItem as Native, Submenu},
};

pub const LEARN_MORE: &str = "https://github.com/lapismd/lapis-notes";

pub fn build(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let separator = || Native::separator(app);
    let action =
        |id, text, shortcut: Option<&str>| MenuItem::with_id(app, id, text, true, shortcut);
    let disabled = |text| MenuItem::new(app, text, false, None::<&str>);
    let about = Native::about(
        app,
        Some("About Lapis Notes"),
        Some(AboutMetadata {
            name: Some("Lapis Notes".into()),
            version: Some(app.package_info().version.to_string()),
            authors: Some(vec!["LapisMD".into()]),
            website: Some(LEARN_MORE.into()),
            icon: app.default_window_icon().cloned(),
            ..Default::default()
        }),
    )?;
    let application = Submenu::with_items(
        app,
        "Lapis Notes",
        true,
        &[
            &about,
            &separator()?,
            &Native::services(app, None)?,
            &separator()?,
            &Native::hide(app, None)?,
            &Native::hide_others(app, None)?,
            &Native::show_all(app, None)?,
            &separator()?,
            &Native::quit(app, None)?,
        ],
    )?;
    let file = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &action("open-vault", "Open Vault…", Some("CmdOrCtrl+Shift+O"))?,
            &separator()?,
            &Native::close_window(app, Some("Close Window"))?,
        ],
    )?;
    let edit = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &action("undo", "Undo", Some("CmdOrCtrl+Z"))?,
            &action("redo", "Redo", Some("CmdOrCtrl+Shift+Z"))?,
            &separator()?,
            &Native::cut(app, None)?,
            &Native::copy(app, None)?,
            &Native::paste(app, None)?,
            &disabled("Delete")?,
            &separator()?,
            &Native::select_all(app, None)?,
        ],
    )?;
    let view = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &action("reload", "Reload", Some("CmdOrCtrl+R"))?,
            &disabled("Force Reload")?,
            &action(
                "devtools",
                "Toggle Developer Tools",
                Some("Alt+CmdOrCtrl+I"),
            )?,
            &action("renderer-errors", "Show Renderer Errors…", None)?,
            &separator()?,
            &disabled("Actual Size")?,
            &disabled("Zoom In")?,
            &disabled("Zoom Out")?,
            &separator()?,
            &Native::fullscreen(app, None)?,
        ],
    )?;
    let window = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &Native::minimize(app, None)?,
            &Native::maximize(app, Some("Zoom"))?,
        ],
    )?;
    let help = Submenu::with_items(
        app,
        "Help",
        true,
        &[&action("learn-more", "Learn More", None)?],
    )?;
    Menu::with_items(app, &[&application, &file, &edit, &view, &window, &help])
}

pub fn dispatch(app: &AppHandle, id: &str) {
    #[cfg(feature = "e2e")]
    crate::acceptance::integration::record("menu", id);
    let result = match id {
        "open-vault" | "undo" | "redo" => app
            .emit_to("main", "lapis-menu-action", id)
            .map_err(|error| error.to_string()),
        "reload" => crate::host::lifecycle::lifecycle_reload(app.clone()),
        "learn-more" => crate::host::integration::services::open_external(app, LEARN_MORE),
        "devtools" | "renderer-errors" => {
            if let Some(window) = app.get_webview_window("main") {
                if id == "devtools" && window.is_devtools_open() {
                    window.close_devtools();
                } else {
                    window.open_devtools();
                }
            }
            Ok(())
        }
        _ => Ok(()),
    };
    if let Err(error) = result {
        let _ = app.emit_to("main", "lapis-integration-error", error);
    }
}
