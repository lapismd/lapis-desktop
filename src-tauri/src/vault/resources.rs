use crate::vault::{VaultManager, invalid};
use percent_encoding::percent_decode_str;
use std::io;

pub struct VaultResource {
    pub content_type: String,
    pub bytes: Vec<u8>,
}

/// Match the same once-decoded identity as the resource reader and Tauri URLs.
pub fn matches_token(encoded_path: &str, expected: &str) -> bool {
    percent_decode_str(encoded_path)
        .decode_utf8()
        .is_ok_and(|path| {
            path.strip_prefix('/')
                .and_then(|path| path.split_once('/'))
                .is_some_and(|(token, _)| token == expected)
        })
}

pub fn read(manager: &VaultManager, uri: &str) -> io::Result<VaultResource> {
    // Decode before path validation; URL normalization must not erase traversal.
    let parsed: tauri::http::Uri = uri.parse().map_err(|_| invalid("Invalid resource URL"))?;
    let local = matches!(
        (
            parsed.scheme_str(),
            parsed.authority().map(|host| host.as_str())
        ),
        (Some("lapis-vault"), Some("localhost")) | (Some("http"), Some("lapis-vault.localhost"))
    );
    if !local {
        return Err(invalid("Resource origin is unavailable"));
    }
    if parsed.query().is_some() {
        return Err(invalid("Resource queries are unavailable"));
    }
    let decoded = percent_decode_str(parsed.path())
        .decode_utf8()
        .map_err(|_| invalid("Invalid resource encoding"))?;
    let (token, path) = decoded
        .strip_prefix('/')
        .and_then(|path| path.split_once('/'))
        .ok_or_else(|| invalid("Resource admission is missing"))?;
    let root = manager.resource(token)?;
    let content_type = mime_guess::from_path(path)
        .first_raw()
        .ok_or_else(|| invalid("Unsupported attachment type"))?;
    if !(content_type.starts_with("image/")
        || content_type.starts_with("audio/")
        || content_type.starts_with("video/")
        || content_type == "application/pdf")
    {
        return Err(invalid("Unsupported attachment type"));
    }
    Ok(VaultResource {
        content_type: content_type.to_owned(),
        bytes: root.read(path)?,
    })
}

pub fn response(
    manager: &VaultManager,
    request: &tauri::http::Request<Vec<u8>>,
) -> tauri::http::Response<Vec<u8>> {
    let origin = request
        .headers()
        .get("Origin")
        .and_then(|value| value.to_str().ok());
    let origin_allowed = origin.is_none_or(|origin| {
        matches!(
            origin,
            "tauri://localhost" | "http://tauri.localhost" | "http://127.0.0.1:1431"
        )
    });
    let resource = if origin_allowed
        && (request.method() == tauri::http::Method::GET
            || request.method() == tauri::http::Method::HEAD)
    {
        read(manager, &request.uri().to_string())
    } else {
        Err(invalid("Only GET and HEAD are available"))
    };
    let mut builder = tauri::http::Response::builder()
        .header("Cache-Control", "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .header(
            "Content-Security-Policy",
            "sandbox; default-src 'none'; style-src 'unsafe-inline'",
        );
    if let Some(origin) = origin.filter(|_| origin_allowed) {
        builder = builder
            .header("Access-Control-Allow-Origin", origin)
            .header("Vary", "Origin");
    }
    let body = match resource {
        Ok(resource) => {
            builder = builder
                .status(200)
                .header("Content-Type", resource.content_type)
                .header("Content-Length", resource.bytes.len());
            if request.method() == tauri::http::Method::HEAD {
                Vec::new()
            } else {
                resource.bytes
            }
        }
        Err(_) => {
            builder = builder.status(404).header("Content-Type", "text/plain");
            b"Attachment unavailable".to_vec()
        }
    };
    builder
        .body(body)
        .expect("Static attachment response headers are valid")
}
