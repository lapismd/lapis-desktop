use lapis_app_core::{
    database::Database,
    embedding::host::NativeEmbeddingHost,
    services::{DatabaseStorage, Runtime},
};
use lapis_app_protocol::database::call::{DatabaseCall, DatabaseValue};
use lapis_desktop::database::{DatabaseConnection, NativeDatabases};
use serde_json::{Value, json};
use std::{path::Path, sync::Arc};
use uuid::Uuid;

fn selected(profile: &Path, root: &Path) -> (Arc<Runtime>, Uuid, Arc<DatabaseConnection>) {
    let runtime = Arc::new(Runtime::with_database(
        DatabaseStorage::new(profile, NativeEmbeddingHost::default()).unwrap(),
    ));
    let id = Uuid::new_v4();
    let client = Arc::new(runtime.admit(id, root).unwrap().attach().unwrap());
    let (_, connection) = NativeDatabases::default().open("owner", client).unwrap();
    (runtime, id, connection)
}
fn call(method: &str, args: Vec<Value>) -> DatabaseCall {
    serde_json::from_value(json!({"method":method,"args":args.into_iter().map(|value|json!({"kind":"value","value":value})).collect::<Vec<_>>()})).unwrap()
}
fn value(value: DatabaseValue) -> Value {
    serde_json::to_value(value).unwrap()
}

#[tokio::test]
async fn high_level_values_preserve_unicode_null_and_committed_restart_data() {
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let (runtime, id, connection) = selected(profile.path(), root.path());
    connection.subscribe().await.unwrap();
    let stored = json!({"text":"café 🪨\0","real":1.25,"bytes":[0,255,128],"empty":null});
    assert_eq!(
        value(
            connection
                .call(call("setMeta", vec![json!("stored"), stored.clone()]))
                .await
                .unwrap()
        ),
        json!({"kind":"undefined"})
    );
    assert_eq!(
        value(
            connection
                .call(call("getMeta", vec![json!("stored")]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":stored})
    );
    assert_eq!(
        value(
            connection
                .call(call("getMeta", vec![json!("missing")]))
                .await
                .unwrap()
        ),
        json!({"kind":"undefined"})
    );
    connection
        .call(call("setMeta", vec![json!("null"), Value::Null]))
        .await
        .unwrap();
    assert_eq!(
        value(
            connection
                .call(call("getMeta", vec![json!("null")]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":null})
    );
    connection.close().await;
    assert!(
        connection
            .call(call("getMeta", vec![json!("stored")]))
            .await
            .is_err()
    );
    tokio::task::spawn_blocking(move || runtime.close_vault(id))
        .await
        .unwrap()
        .unwrap();
    let reopened = Database::open(profile.path(), id).await.unwrap();
    assert_eq!(reopened.get_meta("stored").await.unwrap(), Some(stored));
    reopened.close().await.unwrap();
}

#[tokio::test]
async fn conditional_transactions_reject_failed_writes_and_publish_one_atomic_commit() {
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let (runtime, _, connection) = selected(profile.path(), root.path());
    let mut changes = connection.subscribe().await.unwrap();
    connection
        .call(call("setMeta", vec![json!("counter"), json!(0)]))
        .await
        .unwrap();
    assert_eq!(changes.recv().await.unwrap().revision, 1);
    let transaction = |expected| json!({"checks":[{"key":"counter","value":expected}],"mutations":[{"key":"counter","value":1},{"key":"other","value":2}]});
    assert_eq!(
        value(
            connection
                .call(call("transactMeta", vec![transaction(99)]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":{"applied":false}})
    );
    assert!(changes.try_recv().is_err());
    assert_eq!(
        value(
            connection
                .call(call("transactMeta", vec![transaction(0)]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":{"applied":true}})
    );
    assert_eq!(changes.recv().await.unwrap().revision, 2);
    assert!(
        connection
            .call(call(
                "transactMeta",
                vec![json!({"mutations":[{"key":"counter","value":3},{"value":4}]})]
            ))
            .await
            .is_err()
    );
    assert_eq!(
        value(
            connection
                .call(call("getMeta", vec![json!("counter")]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":1})
    );
    assert_eq!(
        value(
            connection
                .call(call("getMeta", vec![json!("other")]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":2})
    );
    assert_eq!(
        value(
            connection
                .call(call("getChangeRevision", vec![]))
                .await
                .unwrap()
        ),
        json!({"kind":"value","value":2})
    );
    assert!(changes.try_recv().is_err());
    connection.close().await;
    tokio::task::spawn_blocking(move || runtime.shutdown())
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test]
async fn raw_sql_paths_unknown_methods_and_oversized_argument_lists_have_no_authority() {
    for request in [
        json!({"operation":"exec","sql":"ATTACH DATABASE '/tmp/outside' AS outside"}),
        json!({"method":"exec","args":[]}),
        json!({"method":"getMeta","args":[],"path":"/tmp/outside.db"}),
        json!({"method":"getMeta","args":[{"kind":"undefined","sql":"SELECT readfile('/etc/passwd')"}]}),
    ] {
        assert!(serde_json::from_value::<DatabaseCall>(request).is_err());
    }
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let (runtime, _, connection) = selected(profile.path(), root.path());
    let too_many = serde_json::from_value(
        json!({"method":"getMeta","args":vec![json!({"kind":"undefined"});5]}),
    )
    .unwrap();
    assert!(connection.call(too_many).await.is_err());
    connection.close().await;
    tokio::task::spawn_blocking(move || runtime.shutdown())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(std::fs::read_dir(root.path()).unwrap().count(), 0);
}
