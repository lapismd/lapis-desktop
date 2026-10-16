use lapis_desktop::database::{DbReply, NativeDatabases};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

#[test]
fn connection_authority_is_idempotent_for_its_owner_and_rejects_other_admissions() {
    tauri::async_runtime::block_on(async {
        let root = tempdir().unwrap();
        let mut databases = NativeDatabases::new(root.path().to_owned());
        let profile = Uuid::new_v4().to_string();
        let connection = databases
            .open("owner".into(), profile.clone())
            .await
            .unwrap();
        assert_eq!(
            connection,
            databases
                .open("owner".into(), profile.clone())
                .await
                .unwrap()
        );
        assert!(
            databases
                .open("other".into(), profile.clone())
                .await
                .is_err()
        );
        assert!(
            databases
                .open("owner".into(), Uuid::new_v4().to_string())
                .await
                .is_err()
        );
        let request = || {
            serde_json::from_value(
                json!({"operation":"get","statement":{"sql":"SELECT 1 AS value"}}),
            )
            .unwrap()
        };
        assert!(
            databases
                .execute("other", &connection, request())
                .await
                .is_err()
        );
        assert!(
            databases
                .execute("owner", "unknown", request())
                .await
                .is_err()
        );
        assert!(
            matches!(databases.execute("owner", &connection, request()).await.unwrap(), DbReply::Rows { rows } if rows.len() == 1)
        );
        assert!(databases.close("other", &connection).await.is_err());
        assert!(databases.has_session("owner"));
        databases.close("owner", &connection).await.unwrap();
        assert!(!databases.has_session("owner"));
        assert!(
            databases
                .execute("owner", &connection, request())
                .await
                .is_err()
        );
        let reopened = databases.open("other".into(), profile).await.unwrap();
        assert_ne!(reopened, connection);
        databases.close("other", &reopened).await.unwrap();
    });
}
