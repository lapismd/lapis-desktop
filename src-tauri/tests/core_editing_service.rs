use lapis_app_protocol::{
    ExpectedVersion,
    editing_intents::{EditingIntentCommand, EditingIntentValue},
    files::{FileCommand, FileOptions},
};
use lapis_desktop::vault::{VaultManager, editing::EditingOwner, services::VaultServices};
use uuid::Uuid;

#[test]
fn native_editing_selection_is_explicit_and_local_main_only() {
    for value in [None, Some("renderer")] {
        assert!(
            EditingOwner::parse(value)
                .unwrap()
                .authorize("main")
                .is_err()
        );
    }
    let owner = EditingOwner::parse(Some("core")).unwrap();
    owner.authorize("main").unwrap();
    for window in ["", "popup", "related", "remote"] {
        assert!(owner.authorize(window).is_err());
    }
    for value in ["", "CORE", "auto", "native"] {
        assert!(EditingOwner::parse(Some(value)).is_err());
    }
}

#[test]
fn intent_and_existing_file_adapter_share_one_client_and_preserve_foreign_fences() {
    let vault = tempfile::tempdir().unwrap();
    let profile = tempfile::tempdir().unwrap();
    std::fs::write(vault.path().join("Note.md"), "original").unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let owner = manager
        .select(Some(vault.path().into()), None)
        .unwrap()
        .unwrap();
    let foreign = manager.open_recent(&owner.profile_id).unwrap();
    let mut services = VaultServices::default();
    let client = services.client(&manager, &owner.session_id).unwrap();
    let editor_id = Uuid::new_v4();
    client
        .editing_intents(EditingIntentCommand::Acquire {
            editor_id,
            path: "Note.md".into(),
        })
        .unwrap();
    let save = |data: &str, expected: &str| FileCommand::WriteTextIfUnchanged {
        path: "Note.md".into(),
        data: data.into(),
        expected: Some(expected.into()),
        options: FileOptions::default(),
    };
    assert!(
        services
            .files(&manager, &foreign.session_id, save("unsafe", "original"))
            .is_err()
    );
    services
        .files(&manager, &owner.session_id, save("saved", "original"))
        .unwrap();
    let snapshot = client.read_text("Note.md").unwrap();
    assert_eq!(snapshot.text, "saved");
    client
        .editing_intents(EditingIntentCommand::Yield {
            editor_id,
            generation: 1,
            revision: 0,
            expected: ExpectedVersion::Version {
                version: snapshot.version,
            },
        })
        .unwrap();
    services
        .files(
            &manager,
            &foreign.session_id,
            save("guarded external change", "saved"),
        )
        .unwrap();
    assert!(
        client
            .editing_intents(EditingIntentCommand::Resume {
                editor_id,
                generation: 1,
            })
            .is_err()
    );
    client
        .editing_intents(EditingIntentCommand::Resume {
            editor_id,
            generation: 2,
        })
        .unwrap();
    assert!(
        services
            .files(
                &manager,
                &foreign.session_id,
                save("unsafe", "guarded external change")
            )
            .is_err()
    );
    assert!(
        matches!(client.editing_intents(EditingIntentCommand::List {}).unwrap(), EditingIntentValue::States { states } if states.len() == 1 && states[0].active && states[0].generation == 2)
    );
    assert_eq!(
        std::fs::read_to_string(vault.path().join("Note.md")).unwrap(),
        "guarded external change"
    );
    client
        .editing_intents(EditingIntentCommand::Yield {
            editor_id,
            generation: 2,
            revision: 0,
            expected: ExpectedVersion::Version {
                version: client.read_text("Note.md").unwrap().version,
            },
        })
        .unwrap();
    client
        .editing_intents(EditingIntentCommand::Retire {
            editor_id,
            generation: 2,
        })
        .unwrap();
    drop(client);
    services.close(&manager, &owner.session_id).unwrap();
    manager.close(&owner.session_id).unwrap();
    assert!(services.client(&manager, &owner.session_id).is_err());
    services.close(&manager, &foreign.session_id).unwrap();
    manager.close(&foreign.session_id).unwrap();
}
