use crate::vault::{VaultManager, invalid};
use lapis_app_core::plugins::assets::PluginAsset;
use percent_encoding::percent_decode_str;
use std::io;
use tauri::http::{Method, Request, Response};

pub const PREFIX: &str = "/__lapis/plugins/";

pub fn read(manager: &VaultManager, uri: &str) -> io::Result<PluginAsset> {
    let parsed: tauri::http::Uri = uri.parse().map_err(|_| invalid("Invalid plugin URL"))?;
    if !matches!(
        (
            parsed.scheme_str(),
            parsed.authority().map(|value| value.as_str())
        ),
        (Some("tauri"), Some("localhost")) | (Some("http"), Some("tauri.localhost"))
    ) || parsed.query().is_some()
    {
        return Err(invalid("Plugin asset origin is unavailable"));
    }
    let raw = parsed
        .path()
        .strip_prefix(PREFIX)
        .ok_or_else(|| invalid("Invalid plugin route"))?;
    let parts = raw
        .splitn(5, '/')
        .map(|part| {
            percent_decode_str(part)
                .decode_utf8()
                .map(|value| value.into_owned())
                .map_err(|_| invalid("Invalid plugin URL encoding"))
        })
        .collect::<io::Result<Vec<_>>>()?;
    let [token, plugin, version, requested_fingerprint, path] = parts.as_slice() else {
        return Err(invalid("Incomplete plugin asset URL"));
    };
    let root = manager.resource(token)?;
    lapis_app_core::plugins::assets::read(root, plugin, version, requested_fingerprint, path)
}

pub fn response(manager: &VaultManager, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let origin_allowed = request.headers().get("Origin").is_none_or(|origin| {
        matches!(
            origin.to_str(),
            Ok("tauri://localhost" | "http://tauri.localhost")
        )
    });
    let asset = if origin_allowed && matches!(*request.method(), Method::GET | Method::HEAD) {
        read(manager, &request.uri().to_string())
    } else {
        Err(invalid("Plugin asset request is unavailable"))
    };
    let mut builder = Response::builder()
        .header("Cache-Control", "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .header("Cross-Origin-Resource-Policy", "same-origin");
    let body = match asset {
        Ok(asset) => {
            builder = builder
                .status(200)
                .header("Content-Type", asset.content_type)
                .header("Content-Length", asset.bytes.len())
                .header("X-Lapis-Plugin-Asset-Sha256", asset.sha256);
            if request.method() == Method::HEAD {
                Vec::new()
            } else {
                asset.bytes
            }
        }
        Err(_) => {
            builder = builder
                .status(404)
                .header("Content-Type", "text/plain; charset=utf-8");
            if request.method() == Method::HEAD {
                Vec::new()
            } else {
                b"Plugin asset unavailable".to_vec()
            }
        }
    };
    builder
        .body(body)
        .expect("Static plugin asset response headers are valid")
}
