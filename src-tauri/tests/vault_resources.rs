use lapis_desktop::{resources, vault::VaultManager};
use std::fs;
use tauri::http::{Request, StatusCode};
use tempfile::tempdir;

#[test]
fn scoped_binary_resources_have_headers_and_are_revoked_on_close() {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    fs::write(root.path().join("café.png"), [0, 255, 128, 42]).unwrap();
    fs::write(root.path().join("unsafe.html"), b"<script>bad()</script>").unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let selected = manager
        .select(Some(root.path().to_owned()), None)
        .unwrap()
        .unwrap();
    let uri = format!(
        "lapis-vault://localhost/{}/caf%C3%A9.png",
        selected.resource_token
    );
    let request = Request::builder()
        .uri(&uri)
        .header("Origin", "tauri://localhost")
        .body(Vec::new())
        .unwrap();
    let response = resources::response(&manager, &request);
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.body(), &[0, 255, 128, 42]);
    assert_eq!(response.headers()["Content-Type"], "image/png");
    assert_eq!(response.headers()["Cache-Control"], "no-store");
    assert_eq!(response.headers()["X-Content-Type-Options"], "nosniff");
    assert_eq!(
        response.headers()["Access-Control-Allow-Origin"],
        "tauri://localhost"
    );
    assert!(
        response.headers()["Content-Security-Policy"]
            .to_str()
            .unwrap()
            .contains("sandbox")
    );
    let head = Request::builder()
        .method("HEAD")
        .uri(&uri)
        .body(Vec::new())
        .unwrap();
    assert!(resources::response(&manager, &head).body().is_empty());
    for path in [
        "../outside.png",
        "%2E%2E/outside.png",
        "a/%2e%2e/outside.png",
        "%2Fetc%2Fsecret.png",
        "unsafe.html",
        "café.png?query=yes",
    ] {
        let uri = format!("lapis-vault://localhost/{}/{path}", selected.resource_token);
        assert!(resources::read(&manager, &uri).is_err(), "admitted {path}");
    }
    let foreign = Request::builder()
        .uri(&uri)
        .header("Origin", "https://example.com")
        .body(Vec::new())
        .unwrap();
    assert_eq!(
        resources::response(&manager, &foreign).status(),
        StatusCode::NOT_FOUND
    );
    assert!(resources::read(&manager, &uri.replace("localhost", "elsewhere")).is_err());
    manager.close(&selected.session_id).unwrap();
    assert_eq!(
        resources::response(&manager, &request).status(),
        StatusCode::NOT_FOUND
    );
}

#[cfg(unix)]
#[test]
fn a_recent_folder_replaced_by_another_physical_directory_requires_reselection() {
    let profile = tempdir().unwrap();
    let parent = tempdir().unwrap();
    fs::create_dir(parent.path().join("notes")).unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let first = manager
        .select(Some(parent.path().join("notes")), None)
        .unwrap()
        .unwrap();
    manager.close(&first.session_id).unwrap();
    fs::rename(parent.path().join("notes"), parent.path().join("old-notes")).unwrap();
    fs::create_dir(parent.path().join("notes")).unwrap();
    assert!(manager.open_recent(&first.profile_id).is_err());
    assert!(
        manager
            .select(Some(parent.path().join("notes")), None)
            .is_ok()
    );
}
