use lapis_desktop::{plugins::assets, vault::VaultManager};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use tauri::http::{Method, Request, StatusCode};
use tempfile::{TempDir, tempdir};

fn digest(bytes: impl AsRef<[u8]>) -> String {
    format!("{:x}", Sha256::digest(bytes.as_ref()))
}

struct Fixture {
    _profile: TempDir,
    parent: TempDir,
    manager: VaultManager,
    session: String,
    uri: String,
    state: serde_json::Value,
}

impl Fixture {
    fn new() -> Self {
        let profile = tempdir().unwrap();
        let parent = tempdir().unwrap();
        let root = parent.path().join("vault");
        fs::create_dir_all(root.join(".lapis/plugins/portable")).unwrap();
        let bytes = b"export const marker = 1;";
        fs::write(root.join(".lapis/plugins/portable/main.mjs"), bytes).unwrap();
        let hash = digest(bytes);
        let fingerprint = digest(format!("main.mjs:{}:{hash}", bytes.len()));
        let state = json!({"schemaVersion": 1, "plugins": {"portable": {
            "pluginId": "portable", "installedVersion": "1.0.0",
            "files": [{"path": "main.mjs", "size": bytes.len(), "sha256": hash}]
        }}});
        fs::write(
            root.join(".lapis/installed-plugins.json"),
            state.to_string(),
        )
        .unwrap();
        let mut manager = VaultManager::new(profile.path()).unwrap();
        let selected = manager.select(Some(root), None).unwrap().unwrap();
        Self {
            _profile: profile,
            parent,
            manager,
            session: selected.session_id,
            uri: format!(
                "tauri://localhost/__lapis/plugins/{}/portable/1.0.0/{fingerprint}/main.mjs",
                selected.resource_token
            ),
            state,
        }
    }

    fn request(&self, method: Method, uri: &str) -> tauri::http::Response<Vec<u8>> {
        assets::response(
            &self.manager,
            &Request::builder()
                .method(method)
                .uri(uri)
                .body(Vec::new())
                .unwrap(),
        )
    }

    fn save_state(&self, state: &serde_json::Value) {
        fs::write(
            self.parent
                .path()
                .join("vault/.lapis/installed-plugins.json"),
            state.to_string(),
        )
        .unwrap();
    }
}

#[test]
fn declared_assets_preserve_bytes_mime_and_head_headers() {
    let fixture = Fixture::new();
    let response = fixture.request(Method::GET, &fixture.uri);
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.body(), b"export const marker = 1;");
    assert_eq!(
        response.headers()["Content-Type"],
        "text/javascript; charset=utf-8"
    );
    assert_eq!(response.headers()["Cache-Control"], "no-store");
    assert_eq!(response.headers()["X-Content-Type-Options"], "nosniff");
    assert_eq!(
        response.headers()["Cross-Origin-Resource-Policy"],
        "same-origin"
    );
    let head = fixture.request(Method::HEAD, &fixture.uri);
    assert_eq!(head.status(), StatusCode::OK);
    assert_eq!(
        head.headers()["Content-Length"],
        response.body().len().to_string()
    );
    assert!(head.body().is_empty());
}

#[test]
fn requests_reject_foreign_origins_methods_and_unbound_coordinates() {
    let fixture = Fixture::new();
    for uri in [
        fixture
            .uri
            .replace("tauri://localhost", "https://example.com"),
        fixture.uri.replace("/portable/", "/unknown/"),
        fixture.uri.replace("/1.0.0/", "/2.0.0/"),
        fixture.uri.replace("main.mjs", "missing.mjs"),
        fixture.uri.replace("main.mjs", "unsafe.html"),
        fixture.uri.replace("main.mjs", "%2e%2e/main.mjs"),
        fixture.uri.replace("main.mjs", "%2fetc/passwd.mjs"),
        fixture.uri.replace("main.mjs", "main.mjs?query=yes"),
        fixture.uri.replace("main.mjs", "bad%FF.mjs"),
    ] {
        assert_eq!(
            fixture.request(Method::GET, &uri).status(),
            StatusCode::NOT_FOUND,
            "{uri}"
        );
    }
    assert_eq!(
        fixture.request(Method::POST, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
    let request = Request::builder()
        .uri(&fixture.uri)
        .header("Origin", "https://example.com")
        .body(Vec::new())
        .unwrap();
    assert_eq!(
        assets::response(&fixture.manager, &request).status(),
        StatusCode::NOT_FOUND
    );
}

#[test]
fn stale_metadata_and_changed_same_size_bytes_fail_closed() {
    let fixture = Fixture::new();
    let file = fixture
        .parent
        .path()
        .join("vault/.lapis/plugins/portable/main.mjs");
    fs::write(&file, b"export const marker = 2;").unwrap();
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
    fs::write(&file, b"export const marker = 1;").unwrap();
    let mut state = fixture.state.clone();
    state["plugins"]["portable"]["files"][0]["sha256"] = json!("0".repeat(64));
    fixture.save_state(&state);
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
    state = fixture.state.clone();
    let duplicate = state["plugins"]["portable"]["files"][0].clone();
    state["plugins"]["portable"]["files"]
        .as_array_mut()
        .unwrap()
        .push(duplicate);
    fixture.save_state(&state);
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
    fixture.save_state(&json!({"schemaVersion": 1, "plugins": {}}));
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
}

#[test]
fn closed_and_physically_replaced_admissions_cannot_serve_code() {
    let mut fixture = Fixture::new();
    let root = fixture.parent.path().join("vault");
    fs::rename(&root, fixture.parent.path().join("previous")).unwrap();
    fs::create_dir(&root).unwrap();
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
    fixture.manager.close(&fixture.session).unwrap();
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
}

#[cfg(unix)]
#[test]
fn declared_symlink_assets_cannot_escape_the_admitted_vault() {
    let fixture = Fixture::new();
    let outside = fixture.parent.path().join("outside.mjs");
    fs::write(&outside, b"export const marker = 1;").unwrap();
    let inside = fixture
        .parent
        .path()
        .join("vault/.lapis/plugins/portable/main.mjs");
    fs::remove_file(&inside).unwrap();
    std::os::unix::fs::symlink(outside, inside).unwrap();
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
}

#[test]
fn fingerprint_matches_the_public_utf16_browser_vector() {
    let fixture = Fixture::new();
    let mut state = fixture.state.clone();
    let hash = "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a";
    state["plugins"]["portable"]["files"] = json!(
        ["z.js", "a.js", "A.js", "Z.js", "\u{e000}.js", "😀.js"]
            .map(|path| json!({"path": path, "size": 1, "sha256": hash}))
    );
    fixture.save_state(&state);
    fs::write(
        fixture
            .parent
            .path()
            .join("vault/.lapis/plugins/portable/A.js"),
        [1],
    )
    .unwrap();
    let installation = fixture
        .uri
        .rsplit_once('/')
        .unwrap()
        .0
        .rsplit_once('/')
        .unwrap()
        .0;
    // Independently generated by the public JS contract, with uppercase,
    // lowercase, astral and private-use paths in UTF-16 code-unit order.
    let expected = "19f31e9afb4637cb065a41d52283152f5cd4e0e8cf606a83dee7e9383766e22e";
    let response = fixture.request(Method::GET, &format!("{installation}/{expected}/A.js"));
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.body(), &[1]);
}

#[cfg(unix)]
#[test]
fn asset_links_cannot_read_another_location_inside_the_same_vault() {
    let fixture = Fixture::new();
    let root = fixture.parent.path().join("vault");
    fs::write(root.join("private.mjs"), b"export const marker = 1;").unwrap();
    let inside = root.join(".lapis/plugins/portable/main.mjs");
    fs::remove_file(&inside).unwrap();
    std::os::unix::fs::symlink("../../../private.mjs", inside).unwrap();
    assert_eq!(
        fixture.request(Method::GET, &fixture.uri).status(),
        StatusCode::NOT_FOUND
    );
}
