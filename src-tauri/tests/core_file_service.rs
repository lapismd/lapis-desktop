use lapis_app_protocol::files::{FileCommand, FileOptions, FileValue};
use lapis_desktop::vault::{VaultManager, services::VaultServices};

#[test]
fn existing_native_admissions_use_one_shared_file_service() {
    let vault = tempfile::tempdir().unwrap();
    let profile = tempfile::tempdir().unwrap();
    std::fs::write(vault.path().join("note.md"), "original").unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let first = manager
        .select(Some(vault.path().into()), None)
        .unwrap()
        .unwrap();
    let second = manager
        .select(Some(vault.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::default();
    let read = FileCommand::ReadText {
        path: "note.md".into(),
    };
    let FileValue::Text { data } = services
        .files(&manager, &first.session_id, read.clone())
        .unwrap()
    else {
        panic!()
    };
    assert_eq!(data, "original");
    services
        .files(
            &manager,
            &second.session_id,
            FileCommand::WriteTextIfUnchanged {
                path: "note.md".into(),
                data: "saved".into(),
                expected: Some(data),
                options: FileOptions::default(),
            },
        )
        .unwrap();
    let FileValue::Text { data } = services.files(&manager, &first.session_id, read).unwrap()
    else {
        panic!()
    };
    assert_eq!(data, "saved");
    services.close(&manager, &first.session_id).unwrap();
    manager.close(&first.session_id).unwrap();
    assert!(
        services
            .files(
                &manager,
                &first.session_id,
                FileCommand::Exists {
                    path: "note.md".into()
                }
            )
            .is_err()
    );
    assert!(
        services
            .files(
                &manager,
                &second.session_id,
                FileCommand::Exists {
                    path: "note.md".into()
                }
            )
            .is_ok()
    );
    services.close(&manager, &second.session_id).unwrap();
    manager.close(&second.session_id).unwrap();
    let reopened = manager.open_recent(&first.profile_id).unwrap();
    assert!(
        services
            .files(
                &manager,
                &reopened.session_id,
                FileCommand::Exists {
                    path: "note.md".into()
                }
            )
            .is_ok()
    );
}

#[test]
fn service_adapter_rejects_replaced_roots_and_unknown_admissions() {
    let parent = tempfile::tempdir().unwrap();
    let path = parent.path().join("vault");
    std::fs::create_dir(&path).unwrap();
    let profile = tempfile::tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let admission = manager.select(Some(path.clone()), None).unwrap().unwrap();
    let mut services = VaultServices::default();
    assert!(
        services
            .files(
                &manager,
                "foreign",
                FileCommand::Exists {
                    path: "note.md".into()
                }
            )
            .is_err()
    );
    std::fs::rename(&path, parent.path().join("original")).unwrap();
    std::fs::create_dir(&path).unwrap();
    assert!(
        services
            .files(
                &manager,
                &admission.session_id,
                FileCommand::WriteText {
                    path: "note.md".into(),
                    data: "unsafe".into(),
                    options: FileOptions::default()
                }
            )
            .is_err()
    );
    assert!(!path.join("note.md").exists());
}
