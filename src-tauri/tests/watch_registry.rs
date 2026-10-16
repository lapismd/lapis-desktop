use lapis_desktop::{vault::VaultRoot, watch::WatchRegistry};
use std::{
    fs,
    sync::{Arc, Mutex, mpsc},
    time::Duration,
};
use tempfile::tempdir;

#[test]
fn registry_checks_ownership_and_retires_all_session_workers() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let mut registry = WatchRegistry::default();
    let gate = Arc::new(Mutex::new(()));
    let (send, receive) = mpsc::channel();
    let id = registry
        .start("first", &root, "", true, gate.clone(), move |batch| {
            send.send(batch).is_ok()
        })
        .unwrap();
    assert_eq!(
        registry.close("other", &id).unwrap_err().kind(),
        std::io::ErrorKind::PermissionDenied
    );
    registry.close_session("other").unwrap();
    fs::write(directory.path().join("before.md"), b"live").unwrap();
    receive.recv_timeout(Duration::from_secs(5)).unwrap();
    registry.close_session("first").unwrap();
    while receive.try_recv().is_ok() {}
    fs::write(directory.path().join("after.md"), b"retired").unwrap();
    assert!(receive.recv_timeout(Duration::from_millis(150)).is_err());
    registry.close("first", &id).unwrap();
    let next = registry
        .start("second", &root, "", true, gate, |_| true)
        .unwrap();
    assert_ne!(id, next);
    registry.close("second", &next).unwrap();
}

#[test]
fn registry_bounds_subscriptions_and_releases_capacity_after_close() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let mut registry = WatchRegistry::default();
    let gate = Arc::new(Mutex::new(()));
    for _ in 0..16 {
        registry
            .start("first", &root, "", false, gate.clone(), |_| true)
            .unwrap();
    }
    assert_eq!(
        registry
            .start("first", &root, "", false, gate.clone(), |_| true)
            .unwrap_err()
            .kind(),
        std::io::ErrorKind::WouldBlock
    );
    registry.close_session("first").unwrap();
    registry
        .start("first", &root, "", true, gate, |_| true)
        .unwrap();
    registry.close_session("first").unwrap();
}
