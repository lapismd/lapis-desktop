use cap_std::{ambient_authority, fs::Dir};
use jj_store_model::RequestId;
use lapis_desktop::{
    ai::backend::{Backend, BackendProfiles},
    vault::{VaultManager, admission::VaultAdmissions},
};
use std::sync::{Arc, Mutex};
mod backend_cases;

#[test]
fn backend_choice_is_explicit_persistent_and_locked_for_its_native_owner() {
    let root = tempfile::tempdir().unwrap();
    let vault = root.path().join("vault");
    std::fs::create_dir(&vault).unwrap();
    let path = root.path().join("profile");
    let mut vaults = VaultManager::new(&path).unwrap();
    let session = vaults
        .select(Some(vault), None)
        .unwrap()
        .unwrap()
        .session_id;
    let mut ai = VaultAdmissions::default();
    let plan = ai.prepare(&vaults, "main", &session).unwrap();
    ai.complete(&vaults, &plan).unwrap();
    let state = Arc::new(Mutex::new((vaults, ai)));
    let host = state.clone();
    let profile = Dir::open_ambient_dir(&path, ambient_authority()).unwrap();
    let profiles = BackendProfiles::new(
        profile,
        Arc::new(move || {
            let mut state = host.lock().unwrap();
            let (vaults, ai) = &mut *state;
            ai.authorize(vaults, "main").map_err(|e| e.error)
        }),
    )
    .unwrap();
    assert_eq!(profiles.read().unwrap().backend, Backend::VaultFiles);
    assert_eq!(profiles.read().unwrap().revision, 0);
    let request = RequestId::new([1; 16]);
    let receipt = profiles.select(request, 0, Backend::VaultFiles).unwrap();
    assert_eq!(
        profiles.select(request, 0, Backend::VaultFiles).unwrap(),
        receipt
    );
    assert_eq!(profiles.status(request).unwrap(), Some(receipt));
    let owner = profiles.open_scope().unwrap();
    assert!(
        profiles
            .select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
            .is_err()
    );
    tauri::async_runtime::block_on(owner.drain()).unwrap();
    drop(owner);
    assert_eq!(
        profiles
            .select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
            .unwrap()
            .selection
            .revision,
        2
    );
    state.lock().unwrap().1.leave("main", false);
    assert!(profiles.read().is_err());
}
