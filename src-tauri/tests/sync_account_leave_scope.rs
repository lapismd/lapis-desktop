#[path = "support/sync_account/mod.rs"]
mod support;
use lapis_app_core::vault::VaultRoot;
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::sync::Arc;
use support::{Custody, snapshot};

#[test]
fn prepared_leave_requires_its_original_registry_and_native_session_before_commit() {
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
    let mut owner = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let other = AccountServices::new(&root, Arc::new(Custody::default())).unwrap();
    let handle = owner
        .admit(&vaults, "main", &first.session_id, "https://sync.example")
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let original = snapshot(&runtime, &mut owner, &vaults, "main", handle);
    let prepared = runtime.block_on(async {
        owner
            .prepare_session_close(&vaults, &first.session_id, false)
            .unwrap()
            .wait()
            .await
            .unwrap()
    });
    assert!(
        owner
            .validate_session_close(&vaults, &first.session_id, &prepared)
            .is_ok()
    );
    assert!(
        owner
            .validate_session_close(&vaults, &second.session_id, &prepared)
            .is_err()
    );
    assert!(
        other
            .validate_session_close(&vaults, &first.session_id, &prepared)
            .is_err()
    );
    drop(prepared);
    owner.validate(&vaults, "main", handle).unwrap();
    assert_eq!(
        snapshot(&runtime, &mut owner, &vaults, "main", handle),
        original
    );
}

#[test]
fn account_reconfiguration_keeps_presentation_revisions_monotonic_for_the_same_window() {
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
    owner.presentation(&vaults, "main", handle).unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    snapshot(&runtime, &mut owner, &vaults, "main", handle);
    let before =
        serde_json::to_value(owner.presentation(&vaults, "main", handle).unwrap()).unwrap();
    let next = owner
        .configure(&vaults, "main", handle, "https://sync.example")
        .unwrap();
    assert_ne!(next, handle);
    assert!(owner.validate(&vaults, "main", handle).is_err());
    let after = serde_json::to_value(owner.presentation(&vaults, "main", next).unwrap()).unwrap();
    assert_eq!(after["snapshot"], before["snapshot"]);
    assert!(
        after["revision"].as_u64().unwrap() >= before["revision"].as_u64().unwrap(),
        "A changed handle must not cause the public App service to reject a stale revision"
    );
}

#[test]
fn refused_first_custody_read_keeps_the_original_unconfigured_scope() {
    use lapis_app_core::sync::account::protected::{HostAccountCustody, HostSecretBytes};
    use std::{
        io,
        sync::atomic::{AtomicBool, Ordering},
    };
    struct ReadCustody(AtomicBool);
    impl HostAccountCustody for ReadCustody {
        fn supported(&self) -> bool {
            true
        }
        fn read(&self, _: &str) -> io::Result<Option<HostSecretBytes>> {
            if self.0.load(Ordering::SeqCst) {
                Err(io::Error::other("synthetic locked custody"))
            } else {
                Ok(None)
            }
        }
        fn write(&self, _: &str, _: &HostSecretBytes) -> io::Result<()> {
            panic!("Disconnected account inspection cannot write a credential")
        }
    }
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let custody = Arc::new(ReadCustody(AtomicBool::new(true)));
    let mut owner = AccountServices::new(&root, custody.clone()).unwrap();
    let handle = owner
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let before =
        serde_json::to_value(owner.presentation(&vaults, "main", handle).unwrap()).unwrap();
    assert!(
        owner
            .configure(&vaults, "main", handle, "https://sync.example")
            .is_err()
    );
    assert_eq!(
        serde_json::to_value(owner.presentation(&vaults, "main", handle).unwrap()).unwrap(),
        before
    );
    custody.0.store(false, Ordering::SeqCst);
    let next = owner
        .configure(&vaults, "main", handle, "https://sync.example")
        .unwrap();
    assert_ne!(handle, next);
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let restored = snapshot(&runtime, &mut owner, &vaults, "main", next);
    assert_eq!(
        restored.phase,
        lapis_app_core::sync::account::session::AccountPhase::Disconnected
    );
}
