use lapis_app_core::services::Runtime;
use lapis_desktop::database::NativeDatabases;
use std::sync::Arc;
use uuid::Uuid;

#[tokio::test]
async fn database_view_authority_is_idempotent_and_scoped_to_its_native_client() {
    let root = tempfile::tempdir().unwrap();
    let runtime = Runtime::default();
    let vault = runtime.admit(Uuid::new_v4(), root.path()).unwrap();
    let first = Arc::new(vault.attach().unwrap());
    let other = Arc::new(vault.attach().unwrap());
    let mut registry = NativeDatabases::default();
    let (id, connection) = registry.open("owner", first.clone()).unwrap();
    assert_eq!(registry.open("owner", first.clone()).unwrap().0, id);
    assert!(registry.open("owner", other.clone()).is_err());
    assert!(registry.get("foreign", &id).is_err());
    assert!(registry.get("owner", "unknown").is_err());
    assert!(registry.remove("owner", &id).is_err());
    let (other_id, other_connection) = registry.open("other", other).unwrap();
    assert_ne!(other_id, id);
    assert!(registry.remove("foreign", &id).is_err());
    assert!(registry.has_session("owner"));
    connection.close().await;
    registry.remove("owner", &id).unwrap();
    assert!(!registry.has_session("owner"));
    assert!(registry.get("owner", &id).is_err());
    let (reopened, current) = registry.open("owner", first).unwrap();
    assert_ne!(reopened, id);
    assert!(!current.is_closed());
    current.close().await;
    registry.remove("owner", &reopened).unwrap();
    other_connection.close().await;
    registry.remove("other", &other_id).unwrap();
    runtime.shutdown().unwrap();
}
