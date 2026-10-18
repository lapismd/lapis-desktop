use lapis_desktop::vault::VaultManager;
use std::fs;

#[test]
fn recent_eviction_and_cold_reopen_preserve_durable_vault_id() {
    let temp = tempfile::tempdir().unwrap();
    let profile = temp.path().join("profile");
    let first = temp.path().join("first");
    fs::create_dir(&first).unwrap();
    let mut manager = VaultManager::new(&profile).unwrap();
    let original = manager.select(Some(first.clone()), None).unwrap().unwrap();
    manager.close(&original.session_id).unwrap();
    for index in 0..25 {
        let path = temp.path().join(format!("other-{index}"));
        fs::create_dir(&path).unwrap();
        let selected = manager.select(Some(path), None).unwrap().unwrap();
        manager.close(&selected.session_id).unwrap();
    }
    assert_eq!(manager.recents().len(), 20);
    assert!(
        !manager
            .recents()
            .iter()
            .any(|v| v.id == original.profile_id)
    );
    drop(manager);
    let mut reopened = VaultManager::new(&profile).unwrap();
    let selected = reopened.open_recent(&original.profile_id).unwrap();
    assert_eq!(selected.profile_id, original.profile_id);
    reopened.close(&selected.session_id).unwrap();
    let selected = reopened.select(Some(first), None).unwrap().unwrap();
    assert_eq!(selected.profile_id, original.profile_id);
}

#[test]
fn moving_a_physical_vault_retains_identity_but_replacement_creates_a_new_one() {
    let temp = tempfile::tempdir().unwrap();
    let profile = temp.path().join("profile");
    let original = temp.path().join("notes");
    let moved = temp.path().join("moved");
    fs::create_dir(&original).unwrap();
    let mut manager = VaultManager::new(&profile).unwrap();
    let before = manager
        .select(Some(original.clone()), None)
        .unwrap()
        .unwrap();
    manager.close(&before.session_id).unwrap();
    fs::rename(&original, &moved).unwrap();
    let after = manager.select(Some(moved), None).unwrap().unwrap();
    assert_eq!(after.profile_id, before.profile_id);
    manager.close(&after.session_id).unwrap();
    fs::create_dir(&original).unwrap();
    let replacement = manager.select(Some(original), None).unwrap().unwrap();
    assert_ne!(replacement.profile_id, before.profile_id);
}
