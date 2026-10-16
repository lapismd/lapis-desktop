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
        .on_page_load(|window, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Finished {
                #[cfg(target_os = "macos")]
                crate::macos_chrome::align(&window);
            }
        })
        .build()
        .inspect(|window| {
            #[cfg(target_os = "macos")]
            {
                let chrome = window.clone();
                window.on_window_event(move |event| {
                    if matches!(
                        event,
                        tauri::WindowEvent::Focused(_)
                            | tauri::WindowEvent::Resized(_)
                            | tauri::WindowEvent::Moved(_)
                    ) {
                        crate::macos_chrome::align(&chrome);
                    }
                });
            }
        })
}
