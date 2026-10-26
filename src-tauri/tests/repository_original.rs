mod repository_original {
    pub mod fixture;
}
use lapis_app_core::services::HistoryMethod;
use lapis_app_protocol::{ExpectedVersion, repository_sources::RepositorySourcesCommand};
use lapis_desktop::{database::NativeDatabases, repository::readers::Readers, vault::VaultManager};
use repository_original::fixture::{bytes, heads, services, source, stock};
use serde_json::json;
use std::fs;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn original_and_managed_reads_share_one_client_without_initializing_original_history() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let notes = source(&root, "notes");
    fs::write(notes.join("Note.md"), "Unsnapshotted disk edit\n").unwrap();
    let before = bytes(&notes.join(".jj"));
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let selected = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
    let mut native = services(&root);
    let app = native.client(&vaults, &selected.session_id).unwrap();
    let service = native.service(&vaults, &selected.session_id).unwrap();
    let discovered = app
        .repository_sources(RepositorySourcesCommand::Discover {})
        .await
        .unwrap();
    assert!(discovered.original);
    assert!(discovered.token.is_none());
    assert!(!root.join("history").join(&selected.profile_id).exists());
    let readers = Readers::default();
    let reader = readers
        .attach("main", &selected.session_id, &service)
        .unwrap();
    let original = reader
        .client()
        .repository_sources(RepositorySourcesCommand::OpenOriginal {})
        .await
        .unwrap();
    let token = original.token.unwrap();
    assert!(
        vaults.get(&token).is_err(),
        "read token is not file-write authority"
    );
    let original_heads = heads(reader.client(), &token).await;
    assert!(
        !original_heads["data"]["heads"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    app.start_backup().await.unwrap();
    let managed_heads = heads(reader.client(), &selected.profile_id).await;
    assert_ne!(
        managed_heads["data"]["repository"],
        original_heads["data"]["repository"]
    );
    assert_eq!(bytes(&notes.join(".jj")), before);
    assert_eq!(
        fs::read_to_string(notes.join("Note.md")).unwrap(),
        "Unsnapshotted disk edit\n"
    );
    assert!(readers.require("other", &selected.session_id).is_err());
    assert!(readers.require("main", "foreign-session").is_err());
    readers.retire(&reader).unwrap();
    assert!(
        reader
            .client()
            .repository_sources(RepositorySourcesCommand::OpenOriginal {})
            .await
            .is_err()
    );
    app.stop_backup().await.unwrap();
    tokio::task::spawn_blocking(move || native.close(&vaults, &selected.session_id))
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn reader_retirement_preserves_the_app_editing_and_database_client() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let notes = source(&root, "notes");
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let selected = vaults.select(Some(notes), None).unwrap().unwrap();
    let mut native = services(&root);
    let app = native.client(&vaults, &selected.session_id).unwrap();
    let service = native.service(&vaults, &selected.session_id).unwrap();
    let mut views = NativeDatabases::default();
    let (id, view) = views.open(&selected.session_id, app.clone()).unwrap();
    let set = serde_json::from_value(json!({"method":"setMeta","args":[{"kind":"value","value":"reader-proof"},{"kind":"value","value":"retained"}]})).unwrap();
    view.call(set).await.unwrap();
    let readers = Readers::default();
    let reader = readers
        .attach("main", &selected.session_id, &service)
        .unwrap();
    let retained = reader.clone();
    assert_ne!(
        reader.client().descriptor().client_id,
        app.descriptor().client_id
    );
    assert_eq!(service.status().unwrap().clients, 2);
    readers.retire(&reader).unwrap();
    assert!(retained.client().read_text("Note.md").is_err());
    let snapshot = app.read_text("Note.md").unwrap();
    app.write_text(
        "Note.md",
        "App remains admitted\n",
        &ExpectedVersion::Version {
            version: snapshot.version,
        },
    )
    .unwrap();
    let get = serde_json::from_value(
        json!({"method":"getMeta","args":[{"kind":"value","value":"reader-proof"}]}),
    )
    .unwrap();
    assert!(view.call(get).await.is_ok());
    assert_eq!(service.status().unwrap().clients, 1);
    view.close().await;
    views.remove(&selected.session_id, &id).unwrap();
    tokio::task::spawn_blocking(move || native.close(&vaults, &selected.session_id))
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn replaced_original_cannot_revive_its_grant_or_revoke_independent_managed_reads() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let notes = source(&root, "notes");
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let selected = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
    let mut native = services(&root);
    let app = native.client(&vaults, &selected.session_id).unwrap();
    app.start_backup().await.unwrap();
    app.stop_backup().await.unwrap();
    let service = native.service(&vaults, &selected.session_id).unwrap();
    let readers = Readers::default();
    let reader = readers
        .attach("main", &selected.session_id, &service)
        .unwrap();
    let token = reader
        .client()
        .repository_sources(RepositorySourcesCommand::OpenOriginal {})
        .await
        .unwrap()
        .token
        .unwrap();
    let before = heads(reader.client(), &token).await;
    fs::rename(notes.join(".jj"), root.join("old-original")).unwrap();
    stock(&notes, &["git", "init", "--no-colocate", "."]);
    let request = json!({"version":1,"data":{"vault":token}}).to_string();
    assert!(
        reader
            .client()
            .read_history(HistoryMethod::Heads, request.clone())
            .await
            .is_err()
    );
    assert!(
        !heads(reader.client(), &selected.profile_id).await["data"]["heads"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    fs::remove_dir_all(notes.join(".jj")).unwrap();
    fs::rename(root.join("old-original"), notes.join(".jj")).unwrap();
    assert!(
        reader
            .client()
            .read_history(HistoryMethod::Heads, request)
            .await
            .is_err()
    );
    assert!(
        reader
            .client()
            .repository_sources(RepositorySourcesCommand::OpenOriginal {})
            .await
            .is_err()
    );
    readers.retire(&reader).unwrap();
    let fresh = readers
        .attach("main", &selected.session_id, &service)
        .unwrap();
    let fresh_token = fresh
        .client()
        .repository_sources(RepositorySourcesCommand::OpenOriginal {})
        .await
        .unwrap()
        .token
        .unwrap();
    assert_ne!(token, fresh_token);
    assert_eq!(
        heads(fresh.client(), &fresh_token).await["data"]["heads"],
        before["data"]["heads"]
    );
    readers.retire(&fresh).unwrap();
    tokio::task::spawn_blocking(move || native.close(&vaults, &selected.session_id))
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn delayed_old_scope_cleanup_does_not_retire_a_replacement_reader() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let a = vaults
        .select(Some(source(&root, "first")), None)
        .unwrap()
        .unwrap();
    let b = vaults
        .select(Some(source(&root, "second")), None)
        .unwrap()
        .unwrap();
    let mut native = services(&root);
    let service_a = native.service(&vaults, &a.session_id).unwrap();
    let service_b = native.service(&vaults, &b.session_id).unwrap();
    let readers = Readers::default();
    let old = readers.attach("main", &a.session_id, &service_a).unwrap();
    readers.retire(&old).unwrap();
    let current = readers.attach("main", &b.session_id, &service_b).unwrap();
    readers.retire(&old).unwrap();
    readers.check(&current).unwrap();
    assert!(readers.for_session(&a.session_id).unwrap().is_empty());
    assert_eq!(readers.for_session(&b.session_id).unwrap().len(), 1);
    readers.retire(&current).unwrap();
    tokio::task::spawn_blocking(move || {
        native.close(&vaults, &a.session_id).unwrap();
        native.close(&vaults, &b.session_id).unwrap();
    })
    .await
    .unwrap();
}
