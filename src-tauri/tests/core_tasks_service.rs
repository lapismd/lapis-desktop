use lapis_app_protocol::{ErrorCode, native_tasks::*};
use lapis_desktop::vault::{VaultManager, services::VaultServices, tasks::TasksOwner};
use serde_json::json;
use std::{fs, sync::Arc};

const NOTE: &str = "---\ntype: task\nid: read\ntask:\n  status: open\n  inbox: false\n  start: anytime\n---\n\n# Read\n";

fn configuration() -> NativeTaskConfiguration {
    serde_json::from_value(json!({
        "day_parts": {"afternoonStartsAt":"12:00", "eveningStartsAt":"17:00"},
        "daily": {"folder":"daily", "date_format":"yyyy-LL-dd"},
        "format": {"locale":"en-GB", "firstDay":1, "minimalDays":4},
        "provider": {"kind":"default"}
    }))
    .unwrap()
}

#[test]
fn tasks_are_explicit_local_and_require_native_metadata_and_editing() {
    for value in [None, Some("renderer")] {
        let owner = TasksOwner::parse(value).unwrap();
        owner.validate(false, false).unwrap();
        assert!(owner.authorize("main").is_err());
    }
    let owner = TasksOwner::parse(Some("core")).unwrap();
    owner.validate(true, true).unwrap();
    owner.authorize("main").unwrap();
    for (metadata, editing) in [(false, false), (true, false), (false, true)] {
        assert!(
            owner
                .validate(metadata, editing)
                .unwrap_err()
                .to_string()
                .contains("LAPIS_DESKTOP_")
        );
    }
    for window in ["", "popup", "related", "remote"] {
        assert!(owner.authorize(window).is_err());
    }
    for value in ["", "CORE", "auto", "native"] {
        assert!(TasksOwner::parse(Some(value)).is_err());
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn tasks_use_existing_client_and_writer_guards_with_private_profile_storage() {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let root = base.join("notes");
    let profile = base.join("profile");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("Task.md"), NOTE).unwrap();
    let mut vaults = VaultManager::new(&profile).unwrap();
    let selected = vaults.select(Some(root.clone()), None).unwrap().unwrap();
    let mut services = VaultServices::new(&profile)
        .unwrap()
        .with_tasks(&profile)
        .unwrap();
    assert!(profile.join("tasks").is_dir());
    assert!(!root.join("tasks").exists());
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(profile.join("tasks"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o700
        );
    }
    let client = services.client(&vaults, &selected.session_id).unwrap();
    assert!(Arc::ptr_eq(
        &client,
        &services.client(&vaults, &selected.session_id).unwrap()
    ));
    let NativeTaskValue::Status { status } = client
        .control_tasks(NativeTaskCommand::Status {})
        .await
        .unwrap()
    else {
        panic!("status")
    };
    assert!(
        !status.enabled,
        "selecting native storage must not configure a Task provider"
    );
    client
        .control_tasks(NativeTaskCommand::Configure {
            configuration: configuration(),
        })
        .await
        .unwrap();
    let before = client.read_text("Task.md").unwrap();
    let editor = client.open_editor("Task.md").unwrap();
    client.mark_dirty(editor, 1).unwrap();
    let command = NativeTaskCommand::Mutate {
        path: "Task.md".into(),
        expected_version: before.version.clone(),
        mutation: NativeTaskMutation::Cancel {
            at: "2026-10-26T12:00:00Z".into(),
        },
    };
    assert!(
        matches!(client.control_tasks(command.clone()).await.unwrap(), NativeTaskValue::Failure { failure } if failure.code.as_deref() == Some("BUSY"))
    );
    assert_eq!(fs::read_to_string(root.join("Task.md")).unwrap(), NOTE);
    client.discard_editor(editor).unwrap();
    assert!(matches!(
        client.control_tasks(command.clone()).await.unwrap(),
        NativeTaskValue::Snapshot { .. }
    ));
    assert!(
        matches!(client.control_tasks(command).await.unwrap(), NativeTaskValue::Failure { failure } if failure.code.as_deref() == Some("CONFLICT"))
    );
    let saved = fs::read_to_string(root.join("Task.md")).unwrap();
    assert!(saved.contains("canceled"));
    client
        .control_tasks(NativeTaskCommand::Disable {})
        .await
        .unwrap();
    assert_eq!(
        client
            .control_tasks(NativeTaskCommand::Retry {
                request_id: uuid::Uuid::new_v4()
            })
            .await
            .unwrap_err()
            .code(),
        ErrorCode::Unsupported
    );
    assert_eq!(fs::read_to_string(root.join("Task.md")).unwrap(), saved);
    drop(client);
    tokio::task::spawn_blocking(move || services.shutdown())
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn tasks_remain_unavailable_without_selection_and_reject_replaced_roots() {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let root = base.join("notes");
    let profile = base.join("profile");
    fs::create_dir(&root).unwrap();
    let mut vaults = VaultManager::new(&profile).unwrap();
    let selected = vaults.select(Some(root.clone()), None).unwrap().unwrap();
    let mut renderer = VaultServices::new(&profile).unwrap();
    let client = renderer.client(&vaults, &selected.session_id).unwrap();
    assert_eq!(
        client
            .control_tasks(NativeTaskCommand::Status {})
            .await
            .unwrap_err()
            .code(),
        ErrorCode::Unsupported
    );
    assert!(!profile.join("tasks").exists());
    drop(client);
    tokio::task::spawn_blocking(move || renderer.shutdown())
        .await
        .unwrap()
        .unwrap();
    let mut native = VaultServices::new(&profile)
        .unwrap()
        .with_tasks(&profile)
        .unwrap();
    let client = native.client(&vaults, &selected.session_id).unwrap();
    fs::rename(&root, base.join("retained")).unwrap();
    fs::create_dir(&root).unwrap();
    assert!(
        client
            .control_tasks(NativeTaskCommand::Status {})
            .await
            .is_err()
    );
    assert!(native.client(&vaults, &selected.session_id).is_err());
    fs::remove_dir(&root).unwrap();
    fs::rename(base.join("retained"), &root).unwrap();
    drop(client);
    tokio::task::spawn_blocking(move || native.shutdown())
        .await
        .unwrap()
        .unwrap();
}

#[test]
fn tasks_cannot_receive_paths_authority_or_complete_through_the_single_file_route() {
    let valid = json!({"kind":"inspect", "request_id":uuid::Uuid::new_v4()});
    assert!(serde_json::from_value::<NativeTaskCommand>(valid.clone()).is_ok());
    for key in [
        "root",
        "profile",
        "journal",
        "client",
        "generation",
        "window",
    ] {
        let mut invalid = valid.clone();
        invalid[key] = json!("outside");
        assert!(serde_json::from_value::<NativeTaskCommand>(invalid).is_err());
    }
    assert!(serde_json::from_value::<NativeTaskCommand>(json!({"kind":"mutate", "path":"Task.md", "expected_version":"v", "mutation":{"type":"complete", "at":"today", "localDate":"2026-10-26"}})).is_err());
}
