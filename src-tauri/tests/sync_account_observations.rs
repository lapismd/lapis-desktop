#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::vault::VaultRoot;
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::{io::ErrorKind, sync::Arc, time::Duration};
use support::{Custody, snapshot};

#[test]
fn unconfigured_observation_is_single_flight_and_detach_wakes_without_account_work() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let custody = Arc::new(Custody::default());
    let mut owner = AccountServices::new(&root, custody.clone()).unwrap();
    let handle = owner
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let first = owner.observe(&vaults, "main", handle).unwrap();
    assert_eq!(
        owner.observe(&vaults, "main", handle).err().unwrap().kind(),
        ErrorKind::WouldBlock
    );
    assert!(custody.0.lock().unwrap().is_empty());
    drop(first);
    let mut wait = owner.observe(&vaults, "main", handle).unwrap();
    owner.detach("main");
    let runtime = tokio::runtime::Runtime::new().unwrap();
    assert_eq!(
        runtime.block_on(async {
            tokio::time::timeout(Duration::from_secs(1), wait.changed())
                .await
                .unwrap()
                .unwrap_err()
                .kind()
        }),
        ErrorKind::PermissionDenied
    );
    assert!(owner.validate(&vaults, "main", handle).is_err());
    assert!(custody.0.lock().unwrap().is_empty());
}

#[test]
fn configured_updates_coalesce_and_replacement_wakes_original_observer() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let mut owner = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let handle = owner
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    let mut wait = owner.observe(&vaults, "main", handle).unwrap();
    let before = owner
        .presentation(&vaults, "main", handle)
        .unwrap()
        .revision();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut owner, &vaults, "main", handle);
    runtime.block_on(async {
        tokio::time::timeout(Duration::from_secs(1), wait.changed())
            .await
            .unwrap()
            .unwrap()
    });
    assert!(
        owner
            .presentation(&vaults, "main", handle)
            .unwrap()
            .revision()
            > before
    );
    let next = owner
        .configure(&vaults, "main", handle, "https://sync.example")
        .unwrap();
    runtime.block_on(async {
        assert!(
            tokio::time::timeout(Duration::from_secs(1), wait.changed())
                .await
                .unwrap()
                .is_err()
        )
    });
    assert!(owner.observe(&vaults, "main", handle).is_err());
    assert!(owner.observe(&vaults, "main", next).is_ok());
    assert_eq!(
        snapshot(&runtime, &mut owner, &vaults, "main", next),
        original
    );
}
