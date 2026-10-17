use super::DesktopAiPolicy;
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::{
    database::NativeDatabases, vault::VaultManager, vault::admission::VaultAdmissions,
    watch::WatchRegistry,
};
use std::sync::{Arc, Mutex};
use tauri_plugin_lapis_ai::{AcpHost, Config, HostContext, HostPolicy};
use tempfile::{TempDir, tempdir};

struct Fixture {
    _profile: TempDir,
    root: TempDir,
    host: NativeHost,
    policy: DesktopAiPolicy,
    workers: Arc<AcpHost>,
    session: String,
}
fn fixture() -> Fixture {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let session = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let host = NativeHost(Arc::new(Mutex::new(NativeServices {
        ai: VaultAdmissions::default(),
        vaults,
        databases: NativeDatabases::new(profile.path().join("databases")),
        watches: WatchRegistry::default(),
        fs_gate: Arc::new(Mutex::new(())),
    })));
    let policy = DesktopAiPolicy::default();
    let workers = Arc::new(AcpHost::new(Arc::new(policy.clone()), Config::default()).unwrap());
    policy.initialize(host.clone(), &workers).unwrap();
    Fixture {
        _profile: profile,
        root,
        host,
        policy,
        workers,
        session,
    }
}
fn caller() -> HostContext {
    HostContext {
        window: "main".into(),
        url: "tauri://localhost/index.html".into(),
    }
}
fn activate(fixture: &Fixture) -> String {
    let mut services = fixture.host.0.lock().unwrap();
    let NativeServices { ai, vaults, .. } = &mut *services;
    let plan = ai.prepare(vaults, "main", &fixture.session).unwrap();
    ai.complete(vaults, &plan).unwrap().generation().to_owned()
}

#[test]
fn native_ai_policy_is_lazy_and_remains_without_execution_targets() {
    let fixture = fixture();
    assert!(fixture.policy.authorize(&caller()).is_err());
    let generation = activate(&fixture);
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), generation);
    assert!(fixture.workers.targets(&caller()).unwrap().is_empty());
    assert!(fixture.workers.list(&caller()).unwrap().is_empty());
    for resume in [None, Some("old-controller-session")] {
        assert_eq!(
            fixture
                .policy
                .resolve(&caller(), "arbitrary-program", resume)
                .err()
                .unwrap()
                .0,
            "agent_not_admitted"
        );
        let error = tauri::async_runtime::block_on(fixture.workers.open(
            &caller(),
            "no-program-probe",
            "arbitrary-program",
            resume.map(str::to_owned),
        ))
        .err()
        .unwrap();
        assert_eq!(error.0, "agent_not_admitted");
    }
    assert!(fixture.workers.list(&caller()).unwrap().is_empty());
}

#[test]
fn native_ai_policy_rejects_other_windows_and_remote_or_credential_origins() {
    let fixture = fixture();
    let generation = activate(&fixture);
    let mut context = caller();
    context.window = "other".into();
    assert!(fixture.policy.authorize(&context).is_err());
    for url in [
        "https://example.com",
        "file:///etc/passwd",
        "tauri://user@localhost",
        "http://127.0.0.1:1432/",
    ] {
        context = caller();
        context.url = url.into();
        assert!(fixture.policy.authorize(&context).is_err());
    }
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), generation);
}

#[test]
fn revoked_native_root_cannot_recover_an_old_generation() {
    let mut fixture = fixture();
    let old = activate(&fixture);
    {
        let mut services = fixture.host.0.lock().unwrap();
        services.vaults.close(&fixture.session).unwrap();
    }
    assert!(fixture.policy.authorize(&caller()).is_err());
    fixture.session = fixture
        .host
        .0
        .lock()
        .unwrap()
        .vaults
        .select(Some(fixture.root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let new = activate(&fixture);
    assert_ne!(old, new);
    tauri::async_runtime::block_on(fixture.workers.revoke("main", Some(&old))).unwrap();
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), new);
}

#[test]
fn native_ai_policy_owner_cannot_be_rebound_to_another_host() {
    let first = fixture();
    let second = fixture();
    let generation = activate(&first);
    assert!(
        first
            .policy
            .initialize(second.host, &first.workers)
            .is_err()
    );
    assert_eq!(first.policy.authorize(&caller()).unwrap(), generation);
}
