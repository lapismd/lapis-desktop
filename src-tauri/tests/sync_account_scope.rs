use lapis_app_core::{
    sync::account::{
        owner::AccountCommand,
        protected::{HostAccountCustody, HostSecretBytes},
    },
    vault::VaultRoot,
};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::{
    io,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

struct UnaccessedCustody;
impl HostAccountCustody for UnaccessedCustody {
    fn supported(&self) -> bool {
        true
    }
    fn read(&self, _: &str) -> io::Result<Option<HostSecretBytes>> {
        panic!("unconfigured scope cannot read custody")
    }
    fn write(&self, _: &str, _: &HostSecretBytes) -> io::Result<()> {
        panic!("unconfigured scope cannot write custody")
    }
}

struct LockedCustody(AtomicBool);
impl HostAccountCustody for LockedCustody {
    fn supported(&self) -> bool {
        true
    }
    fn read(&self, _: &str) -> io::Result<Option<HostSecretBytes>> {
        if self.0.load(Ordering::SeqCst) {
            Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "private-lock-detail",
            ))
        } else {
            Ok(None)
        }
    }
    fn write(&self, _: &str, _: &HostSecretBytes) -> io::Result<()> {
        panic!("no credential writes for configuration")
    }
}

#[test]
fn configuration_replaces_scope_only_after_success_and_unlock_preserves_identity() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let custody = Arc::new(LockedCustody(AtomicBool::new(true)));
    let mut services = AccountServices::new(&root, custody.clone()).unwrap();
    let handle = services
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let error = services
        .configure(&vaults, "main", handle, "https://sync.example")
        .unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::PermissionDenied);
    assert!(!error.to_string().contains("private-lock-detail"));
    services.validate(&vaults, "main", handle).unwrap();
    assert_eq!(services.observation(&vaults, "main", handle).unwrap(), None);
    custody.0.store(false, Ordering::SeqCst);
    let admitted = services
        .configure(&vaults, "main", handle, "https://sync.example")
        .unwrap();
    assert_ne!(admitted, handle);
    assert!(services.validate(&vaults, "main", handle).is_err());
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let first = runtime.block_on(async {
        match services
            .submit(&vaults, "main", admitted, AccountCommand::Snapshot)
            .unwrap()
            .wait()
            .await
            .unwrap()
        {
            lapis_app_core::sync::account::owner::AccountReply::Snapshot(value) => value.client_id,
            _ => panic!("expected snapshot"),
        }
    });
    drop(services);
    let mut reopened = AccountServices::new(&root, custody).unwrap();
    let scope = reopened
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let current = reopened
        .configure(&vaults, "main", scope, "https://sync.example")
        .unwrap();
    runtime.block_on(async {
        match reopened
            .submit(&vaults, "main", current, AccountCommand::Snapshot)
            .unwrap()
            .wait()
            .await
            .unwrap()
        {
            lapis_app_core::sync::account::owner::AccountReply::Snapshot(value) => {
                assert_eq!(value.client_id, first)
            }
            _ => panic!("expected snapshot"),
        }
    });
}

#[test]
fn unconfigured_native_scope_is_admitted_without_custody_or_an_account() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut services = AccountServices::new(&root, Arc::new(UnaccessedCustody)).unwrap();
    let handle = services
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    services.validate(&vaults, "main", handle).unwrap();
    assert!(services.validate(&vaults, "other", handle).is_err());
    assert_eq!(services.observation(&vaults, "main", handle).unwrap(), None);
    assert_eq!(
        services
            .subscribe(&vaults, "main", handle)
            .err()
            .unwrap()
            .kind(),
        io::ErrorKind::NotConnected
    );
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        assert_eq!(
            services
                .submit(&vaults, "main", handle, AccountCommand::Snapshot)
                .err()
                .unwrap()
                .kind(),
            io::ErrorKind::NotConnected
        );
    });
    assert!(
        !profile.path().join("sync/v1").exists(),
        "no account namespace before configuration"
    );
    let current = services
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    assert_ne!(handle, current);
    assert!(services.validate(&vaults, "main", handle).is_err());
    services.validate(&vaults, "main", current).unwrap();
    services.detach("main");
    assert!(services.validate(&vaults, "main", current).is_err());
}

#[test]
fn completion_refuses_a_replaced_root_without_revoking_the_original_handle() {
    let profile = tempfile::tempdir().unwrap();
    let base = tempfile::tempdir().unwrap();
    let folder = base.path().join("vault");
    std::fs::create_dir(&folder).unwrap();
    let root = VaultRoot::open(profile.path()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults.select(Some(folder.clone()), None).unwrap().unwrap();
    let mut services = AccountServices::new(&root, Arc::new(UnaccessedCustody)).unwrap();
    let handle = services
        .open_scope(&vaults, "main", &selected.session_id)
        .unwrap();
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let proof = runtime.block_on(async {
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
    let retained = base.path().join("retained");
    std::fs::rename(&folder, &retained).unwrap();
    std::fs::create_dir(&folder).unwrap();
    assert!(services.finish_session_close(&vaults, proof).is_err());
    std::fs::remove_dir(&folder).unwrap();
    std::fs::rename(&retained, &folder).unwrap();
    services.validate(&vaults, "main", handle).unwrap();
}
