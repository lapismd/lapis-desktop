#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::{
    sync::account::owner::{AccountCommand, AccountReply},
    vault::VaultRoot,
};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::{
    io,
    sync::{Arc, atomic::Ordering},
};
use support::{Custody, snapshot};
use uuid::Uuid;

#[test]
fn detached_replies_and_replaced_roots_cannot_recover_presentation_authority() {
    let profile = tempfile::tempdir().unwrap();
    let base = tempfile::tempdir().unwrap();
    let path = base.path().join("vault");
    std::fs::create_dir(&path).unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults.select(Some(path.clone()), None).unwrap().unwrap();
    let mut services = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let handle = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        let work = services
            .submit(&vaults, "main", handle, AccountCommand::Snapshot)
            .unwrap();
        services.detach("main");
        assert!(matches!(
            work.wait().await.unwrap(),
            AccountReply::Snapshot(_)
        ));
        assert!(services.validate(&vaults, "main", handle).is_err());
    });
    let current = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert!(
        services
            .admit(
                &vaults,
                "main",
                &selected.session_id,
                "https://other.example"
            )
            .is_err()
    );
    assert!(
        services
            .admit(&vaults, "main", &selected.session_id, "http://sync.example")
            .is_err()
    );
    assert!(
        services
            .admit(&vaults, "main", &selected.session_id, "http://127.0.0.1")
            .is_err()
    );
    services.validate(&vaults, "main", current).unwrap();
    let claim = profile.path().join(".lapis-sync-profile.identity");
    let before = std::fs::read(&claim).unwrap();
    std::fs::write(&claim, Uuid::new_v4().as_bytes()).unwrap();
    assert!(services.validate(&vaults, "main", current).is_err());
    std::fs::write(&claim, before).unwrap();
    services.validate(&vaults, "main", current).unwrap();
    std::fs::rename(&path, base.path().join("retained")).unwrap();
    std::fs::create_dir(&path).unwrap();
    assert!(services.validate(&vaults, "main", current).is_err());
    assert!(
        services
            .admit(
                &vaults,
                "main",
                &selected.session_id,
                "https://sync.example"
            )
            .is_err()
    );
}

#[test]
fn failed_native_close_retains_the_same_custody_owner_until_explicit_recovery() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let custody = Arc::new(Custody::default());
    let mut services = AccountServices::new(&root, custody.clone()).unwrap();
    let handle = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut services, &vaults, "main", handle);
    custody.1.store(true, Ordering::SeqCst);
    runtime.block_on(async {
        let work = services
            .submit(
                &vaults,
                "main",
                handle,
                AccountCommand::Begin {
                    name: "Desktop".into(),
                    now: 1,
                },
            )
            .unwrap();
        assert!(work.wait().await.is_err());
        let close = services
            .close_session(&vaults, &selected.session_id, false)
            .unwrap()
            .unwrap();
        assert!(close.wait().await.is_err());
    });
    assert_eq!(services.collect_closed(), 0);
    assert!(services.validate(&vaults, "main", handle).is_err());
    let recovered = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    runtime.block_on(async {
        let repair = services
            .submit(&vaults, "main", recovered, AccountCommand::RetryCustody)
            .unwrap();
        assert!(matches!(
            repair.wait().await.unwrap(),
            AccountReply::Snapshot(_)
        ));
        let close = services
            .close_session(&vaults, &selected.session_id, false)
            .unwrap()
            .unwrap();
        assert!(matches!(close.wait().await.unwrap(), AccountReply::Closed));
    });
    assert!(
        services
            .admit(
                &vaults,
                "main",
                &selected.session_id,
                "https://sync.example"
            )
            .is_err()
    );
    assert_eq!(services.collect_closed(), 1);
    let restored = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "main", restored).client_id,
        original.client_id
    );
    assert_eq!(custody.0.lock().unwrap().len(), 1);
}

#[test]
fn account_windows_share_retained_owner_and_reject_cross_window_handles() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let first = services
        .admit(
            &vaults,
            "first",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    let second = services
        .admit(
            &vaults,
            "second",
            &selected.session_id,
            "https://SYNC.example:443/",
        )
        .unwrap();
    assert_ne!(first, second);
    assert!(services.validate(&vaults, "first", second).is_err());
    assert!(services.validate(&vaults, "second", first).is_err());
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut services, &vaults, "first", first);
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "second", second),
        original
    );
    let observation = services.subscribe(&vaults, "first", first).unwrap();
    services.detach("first");
    assert!(services.validate(&vaults, "first", first).is_err());
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "second", second),
        original
    );
    let fresh = services
        .admit(
            &vaults,
            "first",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert_ne!(fresh, first);
    assert!(services.validate(&vaults, "first", first).is_err());
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "first", fresh),
        original
    );
    runtime.block_on(async {
        assert_eq!(
            services
                .submit(&vaults, "first", fresh, AccountCommand::Close)
                .err()
                .unwrap()
                .kind(),
            io::ErrorKind::PermissionDenied
        );
    });
    services.detach("first");
    services.detach("second");
    drop(services);
    // Passive observations cannot retain custody or prevent native restoration.
    let mut reopened = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let restored = reopened
        .admit(
            &vaults,
            "restored",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert_eq!(
        snapshot(&runtime, &mut reopened, &vaults, "restored", restored),
        original
    );
    drop(observation);
}
