use super::*;
use lapis_desktop::{
    database::NativeDatabases,
    repository::RepositoryAdmissions,
    vault::{VaultManager, admission::VaultAdmissions},
    watch::WatchRegistry,
};
use std::{process::Command, sync::Mutex};
fn fixture() -> (tempfile::TempDir, Policy, String) {
    let root = tempfile::tempdir().unwrap();
    let vault = root.path().join("Vault");
    std::fs::create_dir(&vault).unwrap();
    let executable = std::env::var_os("JJ_STORE_TEST_STOCK_JJ").unwrap_or_else(|| "jj".into());
    let output = Command::new(executable)
        .current_dir(&vault)
        .args(["--no-pager", "git", "init", "--colocate"])
        .env("JJ_CONFIG", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .output()
        .unwrap();
    assert!(output.status.success());
    let mut vaults = VaultManager::new(&root.path().join("profile")).unwrap();
    let session = vaults
        .select(Some(vault), None)
        .unwrap()
        .unwrap()
        .session_id;
    let host = NativeHost(Arc::new(Mutex::new(NativeServices {
        core_vaults: lapis_desktop::vault::services::VaultServices::default(),
        imports: VaultAdmissions::default(),
        ai: VaultAdmissions::default(),
        repository: RepositoryAdmissions::default(),
        vaults,
        databases: NativeDatabases::default(),
        watches: WatchRegistry::default(),
        fs_gate: Arc::new(Mutex::new(())),
    })));
    (root, Policy(host), session)
}
fn context() -> Context {
    Context {
        window: "main".into(),
        url: "tauri://localhost/index.html".into(),
    }
}
fn activate(policy: &Policy, session: &str) {
    let mut services = policy.0.0.lock().unwrap();
    let NativeServices {
        repository, vaults, ..
    } = &mut *services;
    let plan = repository.prepare(vaults, "main", session).unwrap();
    repository.complete(vaults, &plan).unwrap();
}
#[test]
fn native_repository_policy_rechecks_window_session_origin_and_retained_grant() {
    tauri::async_runtime::block_on(async {
        let (_root, policy, session) = fixture();
        assert!(policy.admit(&context(), &session).await.is_err());
        activate(&policy, &session);
        let access = policy.admit(&context(), &session).await.unwrap();
        access.authorize().await.unwrap();
        for caller in [
            Context {
                window: "popup".into(),
                ..context()
            },
            Context {
                url: "https://outside.invalid/".into(),
                ..context()
            },
        ] {
            assert!(policy.admit(&caller, &session).await.is_err());
        }
        assert!(policy.admit(&context(), "other vault").await.is_err());
        policy.0.0.lock().unwrap().repository.leave("main", false);
        assert!(access.authorize().await.is_err());
        activate(&policy, &session);
        assert!(access.authorize().await.is_err());
        assert!(policy.admit(&context(), &session).await.is_ok());
    });
}
