#![cfg(unix)]
use lapis_desktop::cli::discovery;
use std::{
    fs,
    os::unix::fs::{MetadataExt, symlink},
};

#[test]
fn discovery_is_private_atomic_secret_free_and_retired() {
    let home = tempfile::tempdir().unwrap();
    let token = home.path().join("credential");
    discovery::publish(home.path(), "http://127.0.0.1:1234", &token).unwrap();
    let path = home.path().join(".local/state/lapis/desktop.json");
    assert_eq!(fs::metadata(&path).unwrap().mode() & 0o777, 0o600);
    let record: serde_json::Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    assert_eq!(record["token_file"], token.to_str().unwrap());
    assert!(record.get("token").is_none());
    discovery::publish(home.path(), "http://127.0.0.1:5678", &token).unwrap();
    assert!(fs::read_to_string(&path).unwrap().contains(":5678"));
    discovery::retire(home.path()).unwrap();
    assert!(!path.exists());
}
#[test]
fn discovery_refuses_symlinked_directories() {
    let home = tempfile::tempdir().unwrap();
    let elsewhere = tempfile::tempdir().unwrap();
    symlink(elsewhere.path(), home.path().join(".local")).unwrap();
    assert!(
        discovery::publish(
            home.path(),
            "http://127.0.0.1:1",
            &home.path().join("token")
        )
        .is_err()
    );
    assert_eq!(fs::read_dir(elsewhere.path()).unwrap().count(), 0);
}
