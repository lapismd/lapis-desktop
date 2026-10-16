use lapis_desktop::database::{
    DbReply, DbRequest, NativeDatabase, SqlArgs, SqlStatement, SqlValue,
};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

fn request(value: serde_json::Value) -> DbRequest {
    serde_json::from_value(value).unwrap()
}
fn statement(sql: &str, args: Vec<SqlValue>) -> SqlStatement {
    SqlStatement {
        sql: sql.to_owned(),
        args: SqlArgs::Positional(args),
    }
}

#[test]
fn real_turso_round_trips_typed_values_and_survives_close_and_restart() {
    tauri::async_runtime::block_on(async {
        let root = tempdir().unwrap();
        let profile_id = Uuid::new_v4().to_string();
        let mut database = NativeDatabase::open(root.path(), &profile_id)
            .await
            .unwrap();
        database.execute(request(json!({"operation":"exec","sql":"CREATE TABLE values_test (id INTEGER PRIMARY KEY, text_value TEXT, real_value REAL, int_value INTEGER, bytes BLOB, empty TEXT);"}))).await.unwrap();
        database
            .execute(DbRequest::Run {
                statement: statement(
                    "INSERT INTO values_test VALUES (?, ?, ?, ?, ?, ?)",
                    vec![
                        SqlValue::Integer("1".into()),
                        SqlValue::Text("café 🪨\0".into()),
                        SqlValue::Real(1.25),
                        SqlValue::Integer("9223372036854775807".into()),
                        SqlValue::Blob(vec![0, 255, 128, 42]),
                        SqlValue::Null,
                    ],
                ),
            })
            .await
            .unwrap();
        let reply = database
            .execute(request(
                json!({"operation":"all","statement":{"sql":"SELECT * FROM values_test"}}),
            ))
            .await
            .unwrap();
        let DbReply::Rows { rows } = reply else {
            panic!("Expected rows");
        };
        assert_eq!(rows[0]["text_value"], SqlValue::Text("café 🪨\0".into()));
        assert_eq!(rows[0]["real_value"], SqlValue::Real(1.25));
        assert_eq!(
            rows[0]["int_value"],
            SqlValue::Integer("9223372036854775807".into())
        );
        assert_eq!(rows[0]["bytes"], SqlValue::Blob(vec![0, 255, 128, 42]));
        assert_eq!(rows[0]["empty"], SqlValue::Null);
        database.close().await.unwrap();
        assert!(
            database
                .execute(request(
                    json!({"operation":"all","statement":{"sql":"SELECT 1"}})
                ))
                .await
                .is_err()
        );
        let mut reopened = NativeDatabase::open(root.path(), &profile_id)
            .await
            .unwrap();
        let reply = reopened.execute(request(json!({"operation":"get","statement":{"sql":"SELECT text_value FROM values_test WHERE id = :id","args":{":id":{"type":"integer","value":"1"}}}}))).await.unwrap();
        let DbReply::Rows { rows } = reply else {
            panic!("Expected rows");
        };
        assert_eq!(rows[0]["text_value"], SqlValue::Text("café 🪨\0".into()));
        reopened.close().await.unwrap();
    });
}

#[test]
fn failing_batches_roll_back_and_later_operations_can_commit() {
    tauri::async_runtime::block_on(async {
        let root = tempdir().unwrap();
        let mut database = NativeDatabase::open(root.path(), &Uuid::new_v4().to_string())
            .await
            .unwrap();
        database.execute(request(json!({"operation":"exec","sql":"CREATE TABLE atomic_test (id INTEGER PRIMARY KEY, value TEXT);"}))).await.unwrap();
        assert!(database.execute(request(json!({"operation":"batch","behavior":"immediate","statements":[
            {"sql":"INSERT INTO atomic_test VALUES (1, 'first')"}, {"sql":"INSERT INTO atomic_test VALUES (1, 'collision')"}
        ]}))).await.is_err());
        let reply = database
            .execute(request(
                json!({"operation":"all","statement":{"sql":"SELECT * FROM atomic_test"}}),
            ))
            .await
            .unwrap();
        assert!(matches!(reply, DbReply::Rows { rows } if rows.is_empty()));
        database.execute(request(json!({"operation":"batch","behavior":"immediate","statements":[
            {"sql":"INSERT INTO atomic_test VALUES (1, 'committed')"}, {"sql":"INSERT INTO atomic_test VALUES (2, 'second')"}
        ]}))).await.unwrap();
        let reply = database.execute(request(json!({"operation":"all","statement":{"sql":"SELECT * FROM atomic_test ORDER BY id"}}))).await.unwrap();
        assert!(matches!(reply, DbReply::Rows { rows } if rows.len() == 2));
        database.close().await.unwrap();
    });
}

#[test]
fn unsafe_sql_and_invalid_profile_paths_reject_before_mutating_a_batch() {
    tauri::async_runtime::block_on(async {
        let root = tempdir().unwrap();
        assert!(
            NativeDatabase::open(root.path(), "../outside")
                .await
                .is_err()
        );
        let mut database = NativeDatabase::open(root.path(), &Uuid::new_v4().to_string())
            .await
            .unwrap();
        database
            .execute(request(
                json!({"operation":"exec","sql":"CREATE TABLE safe_test (id INTEGER);"}),
            ))
            .await
            .unwrap();
        for sql in [
            "ATTACH DATABASE '/tmp/escape' AS outside",
            "VACUUM INTO '/tmp/escape'",
            "SELECT load_extension('/tmp/escape')",
            "SELECT \"load_extension\"('/tmp/escape')",
            "SELECT readfile('/etc/passwd')",
            "PRAGMA temp_store_directory='/tmp'",
            "BEGIN",
            "COMMIT",
            "ROLLBACK",
            "SELECT * FROM pragma_database_list",
            "SELECT * FROM pragma_temp_store_directory('/tmp')",
            "CREATE VIRTUAL TABLE x USING fsdir('/etc')",
        ] {
            assert!(database.execute(request(json!({"operation":"batch","statements":[{"sql":"INSERT INTO safe_test VALUES (1)"},{"sql":sql}]}))).await.is_err(), "admitted {sql}");
        }
        let reply = database
            .execute(request(
                json!({"operation":"all","statement":{"sql":"SELECT * FROM safe_test"}}),
            ))
            .await
            .unwrap();
        assert!(matches!(reply, DbReply::Rows { rows } if rows.is_empty()));
        let reply = database.execute(request(json!({"operation":"get","statement":{"sql":"SELECT 'load_extension; ATTACH' AS harmless /* VACUUM */"}}))).await.unwrap();
        assert!(
            matches!(reply, DbReply::Rows { rows } if rows[0]["harmless"] == SqlValue::Text("load_extension; ATTACH".into()))
        );
        database.close().await.unwrap();
    });
}
