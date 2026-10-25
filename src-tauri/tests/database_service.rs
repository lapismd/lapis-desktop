use lapis_app_core::database::Database;
use lapis_app_protocol::{
    ErrorCode,
    database::call::{DatabaseCall, DatabaseValue},
    files::{FileCommand, FileValue},
};
use lapis_desktop::{
    database::NativeDatabases,
    vault::{VaultManager, services::VaultServices},
};
use serde_json::json;
use std::{future::Future, task::Poll, time::Duration};
use uuid::Uuid;

fn call(method: &str, args: serde_json::Value) -> DatabaseCall {
    serde_json::from_value(json!({"method":method,"args":args})).unwrap()
}
fn set() -> DatabaseCall {
    call(
        "setMeta",
        json!([
            {"kind":"value","value":"saved"},
            {"kind":"value","value":"café 🪨"}
        ]),
    )
}
fn get() -> DatabaseCall {
    call("getMeta", json!([{"kind":"value","value":"saved"}]))
}

#[tokio::test]
async fn database_views_and_file_calls_share_the_admitted_vault_owner() {
    let root = tempfile::tempdir().unwrap();
    let profile = tempfile::tempdir().unwrap();
    std::fs::write(root.path().join("note.md"), "original").unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let a = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let b = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::new(profile.path()).unwrap();
    let first = services.client(&vaults, &a.session_id).unwrap();
    let second = services.client(&vaults, &b.session_id).unwrap();
    assert_eq!(
        first.descriptor().generation,
        second.descriptor().generation
    );
    assert!(
        matches!(services.files(&vaults,&a.session_id,FileCommand::ReadText { path: "note.md".into() }).unwrap(),FileValue::Text{data} if data=="original")
    );
    let mut views = NativeDatabases::default();
    let (id, view) = views.open(&a.session_id, first).unwrap();
    let mut changes = view.subscribe().await.unwrap();
    let (other_id, other) = views.open(&b.session_id, second).unwrap();
    view.call(set()).await.unwrap();
    assert_eq!(changes.recv().await.unwrap().revision, 1);
    assert!(
        matches!(other.call(get()).await.unwrap(),DatabaseValue::Value{value} if value=="café 🪨")
    );
    view.close().await;
    views.remove(&a.session_id, &id).unwrap();
    services.close(&vaults, &a.session_id).unwrap();
    vaults.close(&a.session_id).unwrap();
    assert_eq!(
        Database::open(
            &profile.path().join("databases"),
            Uuid::parse_str(&b.profile_id).unwrap()
        )
        .await
        .err()
        .unwrap()
        .code(),
        ErrorCode::Busy
    );
    assert!(other.call(get()).await.is_ok());
    other.close().await;
    views.remove(&b.session_id, &other_id).unwrap();
    tokio::task::spawn_blocking(move || services.close(&vaults, &b.session_id))
        .await
        .unwrap()
        .unwrap();
    assert_eq!(
        changes.recv().await.unwrap_err(),
        tokio::sync::broadcast::error::RecvError::Closed
    );
    assert!(other.call(get()).await.is_err());
}

#[tokio::test]
async fn closing_a_view_and_vault_does_not_wait_for_a_parked_database_reply() {
    let root = tempfile::tempdir().unwrap();
    let profile = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::new(profile.path()).unwrap();
    let client = services.client(&vaults, &selected.session_id).unwrap();
    let mut views = NativeDatabases::default();
    let (id, view) = views.open(&selected.session_id, client).unwrap();
    view.subscribe().await.unwrap();
    let mut reply = Box::pin(view.call(set()));
    std::future::poll_fn(|context| {
        assert!(reply.as_mut().poll(context).is_pending());
        Poll::Ready(())
    })
    .await;
    assert!(
        matches!(view.call(get()).await.unwrap(),DatabaseValue::Value{value} if value=="café 🪨")
    );
    view.close().await;
    views.remove(&selected.session_id, &id).unwrap();
    tokio::time::timeout(
        Duration::from_secs(5),
        tokio::task::spawn_blocking(move || services.close(&vaults, &selected.session_id)),
    )
    .await
    .expect("response consumption cannot own native close")
    .unwrap()
    .unwrap();
    reply.await.unwrap();
}

#[test]
fn native_profile_cache_and_database_storage_cannot_be_vault_content() {
    let profile = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let mut services = VaultServices::new(profile.path()).unwrap();
    for path in [
        profile.path().to_owned(),
        profile.path().join("models"),
        profile.path().join("databases"),
    ] {
        let selected = vaults.select(Some(path), None).unwrap().unwrap();
        assert!(services.client(&vaults, &selected.session_id).is_err());
        vaults.close(&selected.session_id).unwrap();
    }
}
