#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::{sync::account::owner::AccountCommand, vault::VaultRoot};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::sync::{Arc, atomic::Ordering};
use support::{Custody, snapshot};

#[test]
fn detached_quit_requires_original_registry_and_no_reattachment_before_collecting() {
    for reattach in [false, true] {
        let profile = tempfile::tempdir().unwrap();
        let folder = tempfile::tempdir().unwrap();
        let root = VaultRoot::open(profile.path()).unwrap();
        let mut vaults = VaultManager::new(profile.path()).unwrap();
        let first = vaults
            .select(Some(folder.path().into()), None)
            .unwrap()
            .unwrap();
        let mut owner = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
        let other = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
        let handle = owner
            .admit(&vaults, "main", &first.session_id, "https://sync.example")
            .unwrap();
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let original = snapshot(&runtime, &mut owner, &vaults, "main", handle);
        let proof = runtime.block_on(async {
            let prepared = owner
                .prepare_session_close(&vaults, &first.session_id, true)
                .unwrap()
                .wait()
                .await
                .unwrap();
            tokio::task::spawn_blocking(move || prepared.commit())
                .await
                .unwrap()
                .unwrap()
        });
        owner.finish_session_close(&vaults, proof).unwrap();
        vaults.close(&first.session_id).unwrap();
        let prepared = runtime.block_on(async {
            owner
                .prepare_detached_close()
                .unwrap()
                .wait()
                .await
                .unwrap()
        });
        assert!(other.validate_detached_close(&prepared).is_err());
        assert!(owner.validate_detached_close(&prepared).is_ok());
        let mut prepared = Some(prepared);
        if !reattach {
            assert_eq!(
                owner
                    .commit_detached_close(prepared.take().unwrap())
                    .unwrap(),
                1
            );
        }
        let reopened = vaults.open_recent(&first.profile_id).unwrap();
        let handle = owner
            .admit(
                &vaults,
                "main",
                &reopened.session_id,
                "https://sync.example",
            )
            .unwrap();
        if reattach {
            assert!(
                owner
                    .commit_detached_close(prepared.take().unwrap())
                    .is_err()
            );
        }
        assert_eq!(
            snapshot(&runtime, &mut owner, &vaults, "main", handle),
            original
        );
    }
}

#[test]
fn detached_quit_refuses_uncertain_custody_and_retains_original_recoverable_work() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let first = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let custody = Arc::new(Custody::default());
    let mut owner = AccountServices::new(&root, custody.clone()).unwrap();
    let handle = owner
        .admit(&vaults, "main", &first.session_id, "https://sync.example")
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut owner, &vaults, "main", handle);
    custody.1.store(true, Ordering::SeqCst);
    runtime.block_on(async {
        assert!(
            owner
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
        let prepared = owner
            .prepare_session_close(&vaults, &first.session_id, true)
            .unwrap()
            .wait()
            .await
            .unwrap();
        let proof = tokio::task::spawn_blocking(move || prepared.commit())
            .await
            .unwrap()
            .unwrap();
        owner.finish_session_close(&vaults, proof).unwrap();
    });
    vaults.close(&first.session_id).unwrap();
    runtime.block_on(async {
        assert!(
            owner
                .prepare_detached_close()
                .unwrap()
                .wait()
                .await
                .is_err()
        );
    });
    assert_eq!(owner.collect_closed(), 0);
    let reopened = vaults.open_recent(&first.profile_id).unwrap();
    let handle = owner
        .admit(
            &vaults,
            "main",
            &reopened.session_id,
            "https://sync.example",
        )
        .unwrap();
    runtime.block_on(async {
        owner
            .submit(&vaults, "main", handle, AccountCommand::RetryCustody)
            .unwrap()
            .wait()
            .await
            .unwrap();
    });
    let recovered = snapshot(&runtime, &mut owner, &vaults, "main", handle);
    assert_eq!(recovered.client_id, original.client_id);
    assert_eq!(
        recovered.phase,
        lapis_app_core::sync::account::session::AccountPhase::Prepared
    );
}
