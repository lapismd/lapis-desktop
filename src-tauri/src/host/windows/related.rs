use super::popups::NativeWorkspaceWindows;
use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
    webview::{NewWindowFeatures, NewWindowResponse},
};

pub fn open(
    app: &AppHandle,
    url: &url::Url,
    features: NewWindowFeatures,
) -> NewWindowResponse<tauri::Wry> {
    #[cfg(feature = "e2e")]
    if crate::acceptance::background::enabled() {
        return NewWindowResponse::Deny;
    }
    let state = app.state::<NativeWorkspaceWindows>();
    let ticket = match state
        .0
        .lock()
        .ok()
        .and_then(|mut registry| registry.claim("main", url.as_str()).ok())
    {
        Some(ticket) => ticket,
        None => return NewWindowResponse::Deny,
    };
    #[cfg(target_os = "macos")]
    if !super::macos_chrome::isolate_related_configuration(&features) {
        if let Ok(mut registry) = state.0.lock() {
            registry.retire(ticket.label());
        }
        return NewWindowResponse::Deny;
    }
    let mut configuration = app.config().app.windows[0].clone();
    configuration.label = ticket.label().into();
    configuration.url = WebviewUrl::External(url.clone());
    let resources = app.clone();
    let resource_window = ticket.label().to_owned();
    let admitted_url = ticket.url();
    let size = features.size();
    let result = WebviewWindowBuilder::from_config(app, &configuration).and_then(|builder| {
        builder
            .window_features(features)
            .focused(true)
            .inner_size(
                size.map_or(900.0, |size| size.width).clamp(480.0, 2400.0),
                size.map_or(640.0, |size| size.height).clamp(320.0, 1600.0),
            )
            .on_navigation(move |url| url.as_str() == admitted_url)
            .on_new_window(|_, _| NewWindowResponse::Deny)
            .on_page_load(move |_window, payload| {
                if payload.event() == tauri::webview::PageLoadEvent::Finished {
                    #[cfg(target_os = "macos")]
                    super::macos_chrome::align(&_window);
                }
            })
            .on_web_resource_request(move |request, response| {
                if request
                    .uri()
                    .path()
                    .starts_with(lapis_desktop::plugins::assets::PREFIX)
                {
                    let host = resources.state::<crate::host::state::NativeHost>();
                    let result = match host.0.lock() {
                        Ok(services) => {
                            let path = request
                                .uri()
                                .path()
                                .trim_start_matches(lapis_desktop::plugins::assets::PREFIX);
                            if resource_allowed(
                                &resources,
                                &resource_window,
                                &format!("/{path}"),
                                &services.vaults,
                            ) {
                                lapis_desktop::plugins::assets::response(&services.vaults, &request)
                            } else {
                                tauri::http::Response::builder()
                                    .status(403)
                                    .body(Vec::new())
                                    .unwrap()
                            }
                        }
                        Err(_) => tauri::http::Response::builder()
                            .status(503)
                            .body(Vec::new())
                            .unwrap(),
                    };
                    *response = result.map(std::borrow::Cow::Owned);
                }
            })
            .build()
    });
    match result {
        Ok(window) => {
            let committed = state
                .0
                .lock()
                .map(|mut registry| registry.commit(&ticket).is_ok())
                .unwrap_or(false);
            if committed {
                super::chrome_events(&window);
                NewWindowResponse::Create { window }
            } else {
                let _ = window.destroy();
                if let Ok(mut registry) = state.0.lock() {
                    registry.retire(ticket.label());
                }
                NewWindowResponse::Deny
            }
        }
        Err(_) => {
            if let Ok(mut registry) = state.0.lock() {
                registry.retire(ticket.label());
            }
            NewWindowResponse::Deny
        }
    }
}

pub fn resource_allowed(
    app: &AppHandle,
    window: &str,
    path: &str,
    manager: &lapis_desktop::vault::VaultManager,
) -> bool {
    let state = app.state::<NativeWorkspaceWindows>();
    let Ok(registry) = state.0.lock() else {
        return false;
    };
    let Some(session) = registry.resource_session(window) else {
        return window == "main" && registry.session_id().is_none();
    };
    let Ok(descriptor) = manager.descriptor(session) else {
        return false;
    };
    lapis_desktop::vault::resources::matches_token(path, &descriptor.resource_token)
}
