use lapis_app_core::{
    embedding::host::NativeEmbeddingHost,
    services::{DatabaseStorage, Runtime},
};
use lapis_app_protocol::{database::call::DatabaseCall, indexing::IndexingCommand};
use lapis_desktop::database::{IndexingRequest, MetadataOwner, NativeDatabases};
use serde_json::json;
use std::{io, sync::Arc, time::Duration};
use uuid::Uuid;

#[test]
fn metadata_selection_is_explicit_and_indexing_frames_have_no_extra_authority() {
    for value in [None, Some("renderer")] {
        let owner = MetadataOwner::parse(value).unwrap();
        assert!(!owner.is_core());
        assert!(owner.authorize("main").is_err());
    }
    let owner = MetadataOwner::parse(Some("core")).unwrap();
    assert!(owner.is_core());
    owner.authorize("main").unwrap();
    owner
        .authorize_command(&IndexingCommand::Status {})
        .unwrap();
    owner
        .authorize_command(&IndexingCommand::SelectMetadata {})
        .unwrap();
    assert!(
        owner
            .authorize_command(&IndexingCommand::DisableSearch {})
            .is_err()
    );
    let search = serde_json::from_value(json!({"kind":"select_search","selection":{"providers":[],"chunking":{"targetChars":1000,"breakpointWindowChars":100,"breakpointDecay":0.5}}})).unwrap();
    assert!(owner.authorize_command(&search).is_err());
    for window in ["popup", "", "remote"] {
        assert!(owner.authorize(window).is_err());
    }
    for value in ["", "CORE", "auto", "native"] {
        assert!(MetadataOwner::parse(Some(value)).is_err());
    }
    for value in [
        json!({"sessionId":"s","connectionId":"c","command":{"kind":"status"},"path":"/tmp/other"}),
        json!({"sessionId":"s","connectionId":"c","command":{"kind":"status","sql":"SELECT 1"}}),
        json!({"sessionId":"s","connectionId":"c","command":{"kind":"callback","callback":"run"}}),
    ] {
        assert!(serde_json::from_value::<IndexingRequest>(value).is_err());
    }
}

#[tokio::test]
async fn indexing_uses_the_scoped_database_attachment_and_view_close_preserves_native_work() {
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    std::fs::write(root.path().join("Note.md"), "# Initial\n").unwrap();
    let runtime = Arc::new(Runtime::with_database(
        DatabaseStorage::new(profile.path(), NativeEmbeddingHost::default()).unwrap(),
    ));
    let vault_id = Uuid::new_v4();
    let vault = runtime.admit(vault_id, root.path()).unwrap();
    let mut registry = NativeDatabases::default();
    let (id, connection) = registry
        .open("session", Arc::new(vault.attach().unwrap()))
        .unwrap();
    let changes = connection.subscribe().await.unwrap();
    connection.observe(changes, |_| true).await.unwrap();
    assert!(registry.get("foreign", &id).is_err());
    assert!(registry.get("session", "unknown").is_err());
    connection
        .indexing(IndexingCommand::SelectMetadata {})
        .await
        .unwrap();
    let refreshed = connection
        .indexing(IndexingCommand::Refresh { rebuild: false })
        .await
        .unwrap();
    assert!(refreshed.status.unwrap().passes > 0);
    let forbidden: DatabaseCall = serde_json::from_value(
        json!({"method":"deleteIndexedFile","args":[{"kind":"value","value":"Note.md"}]}),
    )
    .unwrap();
    assert!(connection.call(forbidden).await.is_err());
    connection.close().await;
    assert!(
        connection
            .indexing(IndexingCommand::Status {})
            .await
            .is_err()
    );
    registry.remove("session", &id).unwrap();
    drop(connection);
    let previous = vault.indexing_status().unwrap().passes;
    std::fs::write(root.path().join("Note.md"), "# After detach\n#tag\n").unwrap();
    std::fs::write(root.path().join("Created.md"), "# Created\n").unwrap();
    tokio::time::timeout(Duration::from_secs(10), async {
        loop {
            let status = vault.indexing_status().unwrap();
            if status.passes > previous && !status.active && status.pending == 0 {
                break;
            }
            tokio::time::sleep(Duration::from_millis(25)).await;
        }
    })
    .await
    .unwrap();
    let (reopened, next) = registry
        .open("session", Arc::new(vault.attach().unwrap()))
        .unwrap();
    assert_ne!(reopened, id);
    let status = next
        .indexing(IndexingCommand::Refresh { rebuild: true })
        .await
        .unwrap()
        .status
        .unwrap();
    assert!(status.error.is_none());
    assert!(!status.active);
    next.close().await;
    registry.remove("session", &reopened).unwrap();
    tokio::task::spawn_blocking(move || runtime.shutdown())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(
        std::fs::read_to_string(root.path().join("Note.md")).unwrap(),
        "# After detach\n#tag\n"
    );
}

#[tokio::test]
async fn indexing_revalidates_the_admitted_physical_root() {
    let profile = tempfile::tempdir().unwrap();
    let parent = tempfile::tempdir().unwrap();
    let root = parent.path().join("vault");
    std::fs::create_dir(&root).unwrap();
    let runtime = Arc::new(Runtime::with_database(
        DatabaseStorage::new(profile.path(), NativeEmbeddingHost::default()).unwrap(),
    ));
    let vault = runtime.admit(Uuid::new_v4(), &root).unwrap();
    let (_, connection) = NativeDatabases::default()
        .open("session", Arc::new(vault.attach().unwrap()))
        .unwrap();
    std::fs::rename(&root, parent.path().join("retired")).unwrap();
    std::fs::create_dir(&root).unwrap();
    let error = connection
        .indexing(IndexingCommand::SelectMetadata {})
        .await
        .unwrap_err();
    assert!(matches!(
        error.kind(),
        io::ErrorKind::Other | io::ErrorKind::PermissionDenied
    ));
    assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
    connection.close().await;
    tokio::task::spawn_blocking(move || runtime.shutdown())
        .await
        .unwrap()
        .unwrap();
}
