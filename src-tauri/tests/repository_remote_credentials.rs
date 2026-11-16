use jj_forge::accounts::store::SecretStore;
use lapis_app_core::services::RemoteTokenStore;
use lapis_app_protocol::repository_remotes::*;
use lapis_desktop::repository::credentials::DesktopTokens;
use std::os::unix::fs::PermissionsExt as _;
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};

#[derive(Default)]
struct Secrets {
    records: Mutex<HashMap<String, String>>,
    locked: AtomicBool,
}
impl SecretStore for Secrets {
    fn get(&self, id: &str) -> jj_forge::Result<Option<String>> {
        if self.locked.load(Ordering::SeqCst) {
            return Err(jj_forge::Error::State);
        }
        Ok(self.records.lock().unwrap().get(id).cloned())
    }
    fn set(&self, id: &str, value: &str) -> jj_forge::Result<()> {
        if self.locked.load(Ordering::SeqCst) {
            return Err(jj_forge::Error::State);
        }
        self.records.lock().unwrap().insert(id.into(), value.into());
        Ok(())
    }
    fn remove(&self, id: &str) -> jj_forge::Result<()> {
        if self.locked.load(Ordering::SeqCst) {
            return Err(jj_forge::Error::State);
        }
        self.records.lock().unwrap().remove(id);
        Ok(())
    }
}
fn input() -> RemoteCredentialInput {
    RemoteCredentialInput {
        provider: RemoteCredentialProvider::Https,
        label: "Work".into(),
        host: "git.example.test".into(),
        username: "alice".into(),
        token: "fixture-token-private".into(),
        replace: None,
    }
}
fn connection(id: &str) -> RemoteConnection {
    RemoteConnection {
        name: "origin".into(),
        url: "https://git.example.test/team/notes.git".into(),
        branch: "main".into(),
        bookmark: "main".into(),
        authentication: RemoteAuthentication::Token,
        credential: id.into(),
    }
}
#[test]
fn tokens_survive_reopen_with_no_secret_in_metadata_and_are_endpoint_scoped() {
    let root = tempfile::tempdir().unwrap();
    std::fs::set_permissions(root.path(), std::fs::Permissions::from_mode(0o700)).unwrap();
    let secrets = Arc::new(Secrets::default());
    let store = DesktopTokens::open(root.path(), secrets.clone()).unwrap();
    store.save(&input()).unwrap();
    let inventory = store.inventory().unwrap();
    assert_eq!(inventory.len(), 1);
    assert!(inventory[0].available);
    let id = inventory[0].id.clone();
    let bytes = std::fs::read(root.path().join("tokens.json")).unwrap();
    assert!(!String::from_utf8_lossy(&bytes).contains("fixture-token-private"));
    drop(store);
    let store = DesktopTokens::open(root.path(), secrets.clone()).unwrap();
    assert_eq!(store.inventory().unwrap()[0].id, id);
    store.resolve(&connection(&id)).unwrap();
    for url in [
        "https://different.example.test/team/notes.git",
        "http://git.example.test/team/notes.git",
        "https://git.example.test:9443/team/notes.git",
        "https://secret@git.example.test/team/notes.git",
    ] {
        let mut selected = connection(&id);
        selected.url = url.into();
        assert!(store.resolve(&selected).is_err());
    }
    // Editing public metadata must not widen the scope of the OS-held record.
    let mut metadata: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    metadata[0]["host"] = "different.example.test".into();
    std::fs::write(
        root.path().join("tokens.json"),
        serde_json::to_vec(&metadata).unwrap(),
    )
    .unwrap();
    let mut selected = connection(&id);
    selected.url = "https://different.example.test/team/notes.git".into();
    assert!(store.resolve(&selected).is_err());
}
#[test]
fn replacement_and_forgetting_keep_identity_and_locked_storage_never_uses_plaintext() {
    let root = tempfile::tempdir().unwrap();
    std::fs::set_permissions(root.path(), std::fs::Permissions::from_mode(0o700)).unwrap();
    let secrets = Arc::new(Secrets::default());
    let store = DesktopTokens::open(root.path(), secrets.clone()).unwrap();
    store.save(&input()).unwrap();
    let id = store.inventory().unwrap()[0].id.clone();
    let mut replacement = input();
    replacement.replace = Some(id.clone());
    replacement.token = "replacement-private".into();
    store.save(&replacement).unwrap();
    assert_eq!(store.inventory().unwrap()[0].id, id);
    let held = secrets.records.lock().unwrap();
    assert!(held.values().any(|v| v.contains("replacement-private")));
    assert!(held.values().all(|v| !v.contains("fixture-token-private")));
    drop(held);
    replacement.host = "different.example.test".into();
    assert!(store.save(&replacement).is_err());
    let before = std::fs::read(root.path().join("tokens.json")).unwrap();
    secrets.locked.store(true, Ordering::SeqCst);
    assert!(matches!(store.state(), RemoteStorageState::Locked));
    assert!(store.save(&input()).is_err());
    assert!(store.resolve(&connection(&id)).is_err());
    assert!(store.forget(&id).is_err());
    assert_eq!(
        std::fs::read(root.path().join("tokens.json")).unwrap(),
        before
    );
    secrets.locked.store(false, Ordering::SeqCst);
    store.forget(&id).unwrap();
    assert!(store.inventory().unwrap().is_empty());
    assert!(store.resolve(&connection(&id)).is_err());
    assert!(secrets.records.lock().unwrap().is_empty());
}

#[test]
fn retired_native_clients_cannot_receive_late_repository_responses() {
    use lapis_desktop::vault::{VaultManager, services::VaultServices};
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::default();
    let first = services.client(&vaults, &selected.session_id).unwrap();
    services
        .verify_client(&vaults, &selected.session_id, &first)
        .unwrap();
    services.detach(&vaults, &selected.session_id).unwrap();
    assert!(
        services
            .verify_client(&vaults, &selected.session_id, &first)
            .is_err()
    );
    let next = services.client(&vaults, &selected.session_id).unwrap();
    services
        .verify_client(&vaults, &selected.session_id, &next)
        .unwrap();
    assert!(
        services
            .verify_client(&vaults, &selected.session_id, &first)
            .is_err()
    );
}
