use tauri::{AppHandle, WebviewWindow, WebviewWindowBuilder};

pub fn build(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let configuration = &app.config().app.windows[0];
    WebviewWindowBuilder::from_config(app, configuration)?
        .on_navigation(|url| {
            crate::navigation::allowed(
                url,
                cfg!(debug_assertions) && !cfg!(feature = "custom-protocol"),
            )
        })
        .build()
}
