use tauri::{
    AppHandle, Emitter, Manager, WebviewWindow, WebviewWindowBuilder, webview::NewWindowResponse,
};

fn route_link(app: &AppHandle, url: &url::Url) {
    if lapis_desktop::integration_urls::supported_scheme(url.scheme()) {
        crate::integration::enqueue(app, url.to_string());
    } else if matches!(url.scheme(), "http" | "https")
        && let Err(error) = crate::desktop_services::open_external(app, url.as_str())
    {
        let _ = app.emit_to("main", "lapis-integration-error", error);
    }
}

pub fn build(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let configuration = &app.config().app.windows[0];
    let navigation = app.clone();
    let popup = app.clone();
    let resources = app.clone();
    WebviewWindowBuilder::from_config(app, configuration)?
        .on_web_resource_request(move |request, response| {
            if request
                .uri()
                .path()
                .starts_with(lapis_desktop::plugin_assets::PREFIX)
            {
                let host = resources.state::<crate::native_host::NativeHost>();
                let result = match host.0.lock() {
                    Ok(services) => {
                        lapis_desktop::plugin_assets::response(&services.vaults, &request)
                    }
                    Err(_) => tauri::http::Response::builder()
                        .status(503)
                        .body(Vec::new())
                        .unwrap(),
                };
                *response = result.map(std::borrow::Cow::Owned);
            }
        })
        .on_navigation(move |url| {
            #[cfg(feature = "e2e")]
            if std::env::var("LAPIS_DESKTOP_POPOUT_PROOF").as_deref() == Ok("1") {
                crate::integration_acceptance::record("proof-navigation", url.as_str());
            }
            let allowed = crate::navigation::allowed(
                url,
                cfg!(debug_assertions) && !cfg!(feature = "custom-protocol"),
            );
            if !allowed {
                route_link(&navigation, url);
            }
            allowed
        })
        .on_new_window(move |url, _features| {
            #[cfg(feature = "e2e")]
            if let Some(response) = crate::popout_acceptance::open(&popup, &url, _features) {
                return response;
            }
            route_link(&popup, &url);
            NewWindowResponse::Deny
        })
        .on_page_load(|window, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Finished {
                #[cfg(target_os = "macos")]
                crate::macos_chrome::align(&window);
            }
        })
        .build()
        .inspect(chrome_events)
}

pub fn chrome_events(window: &WebviewWindow) {
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
        crate::macos_chrome::align(window);
    }
}
