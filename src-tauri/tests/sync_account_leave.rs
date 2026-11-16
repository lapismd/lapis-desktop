#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::{sync::account::owner::AccountCommand, vault::VaultRoot};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::sync::Arc;
use support::{Custody, snapshot};

#[test]
fn refused_native_leave_retains_the_original_window_handle_and_account_owner() {
    const PROFILE: &str = "LAPIS_SYNC_LEAVE_TEST_PROFILE";
    const FOLDER: &str = "LAPIS_SYNC_LEAVE_TEST_FOLDER";
    const CLIENT: &str = "LAPIS_SYNC_LEAVE_TEST_CLIENT";
    if let Some(profile) = std::env::var_os(PROFILE) {
        let root = VaultRoot::open(std::path::Path::new(&profile)).unwrap();
        let mut vaults = VaultManager::new(std::path::Path::new(&profile)).unwrap();
        let selected = vaults
            .select(Some(std::env::var_os(FOLDER).unwrap().into()), None)
            .unwrap()
            .unwrap();
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
        assert_eq!(
            snapshot(&runtime, &mut services, &vaults, "main", handle)
                .client_id
                .to_string(),
            std::env::var(CLIENT).unwrap()
        );
        return;
    }
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
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
    let original = snapshot(&runtime, &mut services, &vaults, "main", handle);
    runtime.block_on(async {
        let prepared = services
            .prepare_session_close(&vaults, &selected.session_id, false)
            .unwrap()
            .wait()
            .await
            .unwrap();
        assert!(
            services
                .submit(&vaults, "main", handle, AccountCommand::Snapshot)
                .is_err()
        );
        // An unrelated native owner refuses leave. The original window and account survive.
        drop(prepared);
    });
    services.validate(&vaults, "main", handle).unwrap();
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "main", handle),
        original
    );
    let closed = runtime.block_on(async {
        let prepared = services
            .prepare_session_close(&vaults, &selected.session_id, false)
            .unwrap()
            .wait()
            .await
            .unwrap();
        tokio::task::spawn_blocking(move || prepared.commit())
            .await
            .unwrap()
            .unwrap()
    });
    services.finish_session_close(&vaults, closed).unwrap();
    assert!(services.validate(&vaults, "main", handle).is_err());
    assert_eq!(services.collect_closed(), 1);
    let child = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "refused_native_leave_retains_the_original_window_handle_and_account_owner",
            "--nocapture",
        ])
        .env(PROFILE, profile.path())
        .env(FOLDER, folder.path())
        .env(CLIENT, original.client_id.to_string())
        .output()
        .unwrap();
    assert!(
        child.status.success(),
        "cold child: {}",
        String::from_utf8_lossy(&child.stderr)
    );
    let next = services
        .admit(
            &vaults,
            "main",
            &selected.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "main", next),
        original
    );
}

#[test]
fn unconfigured_leave_completion_cannot_revoke_another_native_registry() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let mut first = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let mut other = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let original = first
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let foreign = other
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let proof = runtime.block_on(async {
        let prepared = first
            .prepare_session_close(&vaults, &selected.session_id, true)
            .unwrap()
            .wait()
            .await
            .unwrap();
        tokio::task::spawn_blocking(move || prepared.commit())
            .await
            .unwrap()
            .unwrap()
    });
    assert!(other.finish_session_close(&vaults, proof).is_err());
    first.validate(&vaults, "main", original).unwrap();
    other.validate(&vaults, "main", foreign).unwrap();
}

#[test]
fn failed_custody_preparation_preserves_the_handle_for_explicit_recovery() {
    use std::sync::atomic::Ordering;
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
        assert!(
            services
                .submit(
                    &vaults,
                    "main",
                    handle,
                    AccountCommand::Begin {
                        name: "Desktop".into(),
                        now: 1,
                    }
                )
                .unwrap()
                .wait()
                .await
                .is_err()
        );
        assert!(
            services
                .prepare_session_close(&vaults, &selected.session_id, false)
                .unwrap()
                .wait()
                .await
                .is_err()
        );
        services.validate(&vaults, "main", handle).unwrap();
        assert_eq!(services.collect_closed(), 0);
        services
            .submit(&vaults, "main", handle, AccountCommand::RetryCustody)
            .unwrap()
            .wait()
            .await
            .unwrap();
    });
    let recovered = snapshot(&runtime, &mut services, &vaults, "main", handle);
    assert_eq!(recovered.client_id, original.client_id);
    assert_eq!(recovered.origin, original.origin);
    assert_eq!(
        recovered.phase,
        lapis_app_core::sync::account::session::AccountPhase::Prepared
    );
}

#[test]
fn reload_and_other_native_sessions_keep_the_same_owner() {
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
    let mut services = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
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
    for (session, reload) in [(&first.session_id, false), (&second.session_id, true)] {
        let prepared = runtime.block_on(async {
            services
                .prepare_session_close(&vaults, session, reload)
                .unwrap()
                .wait()
                .await
                .unwrap()
        });
        // Non-final close and reload never fence the shared account owner.
        assert_eq!(
            snapshot(&runtime, &mut services, &vaults, "second", second_handle),
            original
        );
        let proof = runtime.block_on(async {
            tokio::task::spawn_blocking(move || prepared.commit())
                .await
                .unwrap()
                .unwrap()
        });
        services.finish_session_close(&vaults, proof).unwrap();
        vaults.close(session).unwrap();
    }
    assert!(services.validate(&vaults, "first", first_handle).is_err());
    assert!(services.validate(&vaults, "second", second_handle).is_err());
    assert_eq!(services.collect_closed(), 0);
    let reopened = vaults.open_recent(&first.profile_id).unwrap();
    let handle = services
        .admit(
            &vaults,
            "main",
            &reopened.session_id,
            "https://sync.example",
        )
        .unwrap();
    assert_eq!(
        snapshot(&runtime, &mut services, &vaults, "main", handle),
        original
    );
}
