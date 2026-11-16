#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::{sync::account::owner::AccountReply, vault::VaultRoot};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::{io, path::Path, sync::Arc};
use support::{Custody, snapshot};

#[test]
fn only_the_last_native_session_closes_and_reload_keeps_the_same_owner() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let first = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let second = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    assert_eq!(first.profile_id, second.profile_id);
    let custody = Arc::new(Custody::default());
    let mut services = AccountServices::new(&root, custody).unwrap();
    let first_handle = services
        .admit(&vaults, "first", &first.session_id, "https://sync.example")
        .unwrap();
    let second_handle = services
        .admit(
            &vaults,
            "second",
            &second.session_id,
            "https://sync.example",
        )
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut services, &vaults, "first", first_handle);
    runtime.block_on(async {
        assert!(
            services
                .close_session(&vaults, &first.session_id, false)
                .unwrap()
                .is_none()
        );
    });
    vaults.close(&first.session_id).unwrap();
    assert!(services.validate(&vaults, "first", first_handle).is_err());
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "second", second_handle),
        original
    );
    assert!(
        services
            .close_session(&vaults, &second.session_id, true)
            .unwrap()
            .is_none()
    );
    vaults.close(&second.session_id).unwrap();
    let third = vaults.open_recent(&first.profile_id).unwrap();
    let current = services
        .admit(&vaults, "second", &third.session_id, "https://sync.example")
        .unwrap();
    assert_ne!(current, second_handle);
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "second", current),
        original
    );
    let watch = services.subscribe(&vaults, "second", current).unwrap();
    runtime.block_on(async {
        let close = services
            .close_session(&vaults, &third.session_id, false)
            .unwrap()
            .unwrap();
        assert!(matches!(close.wait().await.unwrap(), AccountReply::Closed));
    });
    assert_eq!(services.collect_closed(), 1);
    let replacement = services
        .admit(&vaults, "second", &third.session_id, "https://sync.example")
        .unwrap();
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "second", replacement),
        original
    );
    drop(watch);
}

#[test]
fn retained_account_bound_refuses_new_owners_until_confirmed_close() {
    let profile = tempfile::tempdir().unwrap();
    let base = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let mut services = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let mut first = None;
    for index in 0..16 {
        let folder = base.path().join(index.to_string());
        std::fs::create_dir(&folder).unwrap();
        let selected = vaults.select(Some(folder), None).unwrap().unwrap();
        services
            .admit(
                &vaults,
                "main",
                &selected.session_id,
                "https://sync.example",
            )
            .unwrap();
        assert!(
            services
                .close_session(&vaults, &selected.session_id, true)
                .unwrap()
                .is_none()
        );
        vaults.close(&selected.session_id).unwrap();
        first.get_or_insert(selected.profile_id);
    }
    let folder = base.path().join("seventeenth");
    std::fs::create_dir(&folder).unwrap();
    let selected = vaults.select(Some(folder), None).unwrap().unwrap();
    assert_eq!(
        services
            .admit(
                &vaults,
                "main",
                &selected.session_id,
                "https://sync.example"
            )
            .unwrap_err()
            .kind(),
        io::ErrorKind::WouldBlock
    );
    let previous = vaults.open_recent(first.as_ref().unwrap()).unwrap();
    services
        .admit(
            &vaults,
            "previous",
            &previous.session_id,
            "https://sync.example",
        )
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        let close = services
            .close_session(&vaults, &previous.session_id, false)
            .unwrap()
            .unwrap();
        assert!(matches!(close.wait().await.unwrap(), AccountReply::Closed));
    });
    assert_eq!(services.collect_closed(), 1);
    services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
}

fn cold_snapshot(profile: &Path, folder: &Path) -> String {
    let root = VaultRoot::open(profile).unwrap();
    let mut vaults = VaultManager::new(profile).unwrap();
    let selected = vaults.select(Some(folder.into()), None).unwrap().unwrap();
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
    snapshot(&runtime, &mut services, &vaults, "main", handle)
        .client_id
        .to_string()
}

#[test]
fn native_account_identity_survives_an_actual_cold_process() {
    const PROFILE: &str = "LAPIS_SYNC_ACCOUNT_TEST_PROFILE";
    const VAULT: &str = "LAPIS_SYNC_ACCOUNT_TEST_VAULT";
    const CLIENT: &str = "LAPIS_SYNC_ACCOUNT_TEST_CLIENT";
    if let Some(profile) = std::env::var_os(PROFILE) {
        let folder = std::env::var_os(VAULT).unwrap();
        assert_eq!(
            cold_snapshot(Path::new(&profile), Path::new(&folder)),
            std::env::var(CLIENT).unwrap()
        );
        return;
    }
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let client = cold_snapshot(profile.path(), folder.path());
    let child = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "native_account_identity_survives_an_actual_cold_process",
            "--nocapture",
        ])
        .env(PROFILE, profile.path())
        .env(VAULT, folder.path())
        .env(CLIENT, &client)
        .output()
        .unwrap();
    assert!(
        child.status.success(),
        "cold child: {}",
        String::from_utf8_lossy(&child.stderr)
    );
    assert_eq!(cold_snapshot(profile.path(), folder.path()), client);
}
