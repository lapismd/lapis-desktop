use crate::vault::{VaultManager, invalid};
use lapis_app_core::vault::MAX_FILE_BYTES;
use percent_encoding::percent_decode_str;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    io::{self, Read},
};
use tauri::http::{Method, Request, Response};

pub const PREFIX: &str = "/__lapis/plugins/";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InstalledState {
    schema_version: u32,
    plugins: HashMap<String, InstalledPlugin>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InstalledPlugin {
    plugin_id: String,
    installed_version: String,
    files: Vec<InstalledFile>,
}

#[derive(Deserialize)]
struct InstalledFile {
    path: String,
    size: u64,
    sha256: String,
}

pub struct PluginAsset {
    pub bytes: Vec<u8>,
    pub content_type: &'static str,
    pub sha256: String,
}

fn digest(bytes: impl AsRef<[u8]>) -> String {
    format!("{:x}", Sha256::digest(bytes.as_ref()))
}

fn hash(value: &str) -> io::Result<String> {
    if value.len() != 64 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(invalid("Invalid plugin asset digest"));
    }
    Ok(value.to_ascii_lowercase())
}

fn safe_path(path: &str) -> io::Result<()> {
    if path.len() > 4096
        || path.contains(['\\', '\0', ':', '?', '#'])
        || path.split('/').any(|part| matches!(part, "" | "." | ".."))
    {
        return Err(invalid("Invalid plugin asset path"));
    }
    Ok(())
}

fn content_type(path: &str) -> Option<&'static str> {
    match path.rsplit('.').next()?.to_ascii_lowercase().as_str() {
        "mjs" | "js" | "cjs" => Some("text/javascript; charset=utf-8"),
        "css" => Some("text/css; charset=utf-8"),
        "json" => Some("application/json; charset=utf-8"),
        "wasm" => Some("application/wasm"),
        "svg" => Some("image/svg+xml"),
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "gif" => Some("image/gif"),
        _ => None,
    }
}

fn fingerprint(files: &[InstalledFile]) -> io::Result<String> {
    if files.is_empty() || files.len() > 4096 {
        return Err(invalid("Invalid installed plugin file count"));
    }
    let mut paths = std::collections::HashSet::new();
    let mut supported = Vec::new();
    for file in files {
        safe_path(&file.path)?;
        if file.size > MAX_FILE_BYTES || !paths.insert(&file.path) {
            return Err(invalid("Invalid installed plugin file metadata"));
        }
        let sha256 = hash(&file.sha256)?;
        if content_type(&file.path).is_some() {
            supported.push((&file.path, file.size, sha256));
        }
    }
    // Match the public browser contract, including astral Unicode paths.
    supported.sort_by(|a, b| a.0.encode_utf16().cmp(b.0.encode_utf16()));
    let payload = supported
        .into_iter()
        .map(|(path, size, sha256)| format!("{path}:{size}:{sha256}"))
        .collect::<Vec<_>>()
        .join("|");
    Ok(digest(payload))
}

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
    if plugin.is_empty()
        || plugin.len() > 128
        || !plugin
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        || version.is_empty()
        || version.len() > 128
        || !version
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b".-+".contains(&byte))
    {
        return Err(invalid("Invalid plugin coordinates"));
    }
    safe_path(path)?;
    let mime = content_type(path).ok_or_else(|| invalid("Unsupported plugin asset type"))?;
    let root = manager.resource(token)?;
    root.verify_physical_root()?;
    let metadata = root.read(".lapis/installed-plugins.json")?;
    if metadata.len() > 4 * 1024 * 1024 {
        return Err(invalid("Installed plugin metadata is too large"));
    }
    let state: InstalledState = serde_json::from_slice(&metadata)
        .map_err(|_| invalid("Installed plugin metadata is invalid"))?;
    let record = state
        .plugins
        .get(plugin)
        .ok_or_else(|| invalid("Plugin is not installed"))?;
    if state.schema_version != 1
        || record.plugin_id != *plugin
        || record.installed_version != *version
        || fingerprint(&record.files)? != hash(requested_fingerprint)?
    {
        return Err(invalid("Plugin installation identity changed"));
    }
    let file = record
        .files
        .iter()
        .find(|file| file.path == *path)
        .ok_or_else(|| invalid("Plugin asset is not declared"))?;
    let directory = root.open_directory(&format!(".lapis/plugins/{plugin}"))?;
    let handle = directory.open(path)?;
    if handle.metadata()?.len() > MAX_FILE_BYTES {
        return Err(invalid("Plugin asset is too large"));
    }
    let mut bytes = Vec::new();
    handle.take(MAX_FILE_BYTES + 1).read_to_end(&mut bytes)?;
    let sha256 = digest(&bytes);
    if bytes.len() as u64 != file.size || sha256 != hash(&file.sha256)? {
        return Err(invalid("Plugin asset bytes changed"));
    }
    Ok(PluginAsset {
        bytes,
        content_type: mime,
        sha256,
    })
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
