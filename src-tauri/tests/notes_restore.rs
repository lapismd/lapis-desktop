use lapis_desktop::vault::VaultManager;
use std::fs;
use tempfile::tempdir;

#[test]
fn notes_restoration_tracks_ready_sessions_instead_of_recent_folder_order() {
    let profile = tempdir().unwrap();
    let first = tempdir().unwrap();
    let second = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let notes = manager
        .select(Some(first.path().into()), None)
        .unwrap()
        .unwrap();
    manager.remember_notes(Some(&notes.session_id)).unwrap();
    manager.select(Some(second.path().into()), None).unwrap();
    drop(manager);
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let restored = manager.restore_notes().unwrap().unwrap();
    assert_eq!(restored.profile_id, notes.profile_id);
    assert_ne!(restored.session_id, notes.session_id);
    manager.remember_notes(None).unwrap();
    assert!(manager.restore_notes().unwrap().is_none());
}

#[test]
fn missing_or_replaced_notes_roots_report_failure_without_losing_the_preference() {
    let profile = tempdir().unwrap();
    let parent = tempdir().unwrap();
    let root = parent.path().join("notes");
    fs::create_dir(&root).unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let selected = manager.select(Some(root.clone()), None).unwrap().unwrap();
    manager.remember_notes(Some(&selected.session_id)).unwrap();
    manager.close(&selected.session_id).unwrap();
    fs::rename(&root, parent.path().join("moved")).unwrap();
    assert!(manager.restore_notes().is_err());
    assert!(profile.path().join("last-notes.json").exists());
    fs::create_dir(&root).unwrap();
    assert!(manager.restore_notes().is_err());
    fs::remove_dir(&root).unwrap();
    fs::rename(parent.path().join("moved"), &root).unwrap();
    assert_eq!(
        manager.restore_notes().unwrap().unwrap().profile_id,
        selected.profile_id
    );
}

#[test]
fn notes_preference_rejects_closed_admissions_and_corrupt_records() {
    let profile = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    assert!(manager.restore_notes().unwrap().is_none());
    assert!(manager.remember_notes(Some("unknown")).is_err());
    fs::write(profile.path().join("last-notes.json"), b"not json").unwrap();
    assert!(manager.restore_notes().is_err());
    manager.remember_notes(None).unwrap();
    assert!(manager.restore_notes().unwrap().is_none());
}
