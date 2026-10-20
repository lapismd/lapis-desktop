//! Debug-only related-WebView proof; no Notes session or native authority is added.
use serde::Serialize;
use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
    webview::{NewWindowFeatures, NewWindowResponse},
};

pub fn mode() -> Option<&'static str> {
    match std::env::var("LAPIS_DESKTOP_POPOUT_PROOF").as_deref() {
        Ok("1") => Some("allow"),
        Ok("deny") => Some("deny"),
        Ok("session") => Some("session"),
        _ => None,
    }
}

pub fn open(
    app: &AppHandle,
    url: &url::Url,
    features: NewWindowFeatures,
) -> Option<NewWindowResponse<tauri::Wry>> {
    let enabled = mode() == Some("allow");
    crate::acceptance::integration::record("popup-request", &format!("{url};enabled={enabled}"));
    if url.as_str() != "about:blank" || !enabled {
        return None;
    }
    #[cfg(target_os = "macos")]
    if !crate::host::windows::macos_chrome::isolate_related_configuration(&features) {
        return Some(NewWindowResponse::Deny);
    }
    let mut configuration = app.config().app.windows[0].clone();
    configuration.label = format!("popout-proof-{}", uuid::Uuid::new_v4());
    configuration.url = WebviewUrl::External(url.clone());
    let size = features.size();
    let result = WebviewWindowBuilder::from_config(app, &configuration).and_then(|builder| {
        builder
            .window_features(features)
            .inner_size(
                size.map_or(720.0, |size| size.width).clamp(640.0, 1600.0),
                size.map_or(480.0, |size| size.height).clamp(480.0, 1200.0),
            )
            .on_navigation(|url| url.as_str() == "about:blank")
            .on_new_window(|_, _| NewWindowResponse::Deny)
            .on_page_load(|window, _| {
                #[cfg(target_os = "macos")]
                crate::host::windows::macos_chrome::align(&window);
            })
            .build()
            .inspect(crate::host::windows::chrome_events)
    });
    Some(match result {
        Ok(window) => NewWindowResponse::Create { window },
        Err(error) => {
            eprintln!("Related native window proof failed: {error}");
            NewWindowResponse::Deny
        }
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProofWindow {
    label: String,
    focused: bool,
    width: u32,
    height: u32,
    #[cfg(target_os = "macos")]
    controls: Result<Vec<[f64; 4]>, String>,
}

pub async fn windows(app: &AppHandle) -> Vec<ProofWindow> {
    let mut result = Vec::new();
    for window in app.webview_windows().into_values() {
        if !window.label().starts_with("popout-proof-")
            && !window.label().starts_with("workspace-popup-")
        {
            continue;
        }
        let Ok(size) = window.inner_size() else {
            continue;
        };
        result.push(ProofWindow {
            label: window.label().to_string(),
            focused: window.is_focused().unwrap_or(false),
            width: size.width,
            height: size.height,
            #[cfg(target_os = "macos")]
            controls: crate::host::windows::macos_chrome::geometry(window).await,
        });
    }
    result
}
