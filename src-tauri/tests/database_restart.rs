use lapis_desktop::database::{DbReply, NativeDatabase, SqlValue};
use serde_json::json;
use std::{
    io::{self, BufRead, Read, Write},
    process::{Command, Stdio},
};
use tempfile::tempdir;
use uuid::Uuid;

#[test]
fn committed_database_state_survives_a_killed_process_and_native_restart() {
    let root = tempdir().unwrap();
    let profile = Uuid::new_v4().to_string();
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args([
            "--ignored",
            "--exact",
            "database_process_helper",
            "--nocapture",
        ])
        .env("LAPIS_DATABASE_TEST_ROOT", root.path())
        .env("LAPIS_DATABASE_TEST_PROFILE", &profile)
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    let mut committed = false;
    for line in io::BufReader::new(child.stdout.take().unwrap()).lines() {
        if line.unwrap().contains("DATABASE_COMMITTED") {
            committed = true;
            break;
        }
    }
    if !committed {
        let _ = child.kill();
    }
    assert!(
        committed,
        "Native writer must acknowledge the committed transaction"
    );
    child.kill().unwrap();
    assert!(!child.wait().unwrap().success());
    tauri::async_runtime::block_on(async {
        let mut reopened = NativeDatabase::open(root.path(), &profile).await.unwrap();
        let request = serde_json::from_value(json!({"operation":"get","statement":{"sql":"SELECT value FROM restart_test WHERE id = 1"}})).unwrap();
        let DbReply::Rows { rows } = reopened.execute(request).await.unwrap() else {
            panic!("Expected persisted row");
        };
        assert_eq!(rows[0]["value"], SqlValue::Text("committed café".into()));
        reopened.close().await.unwrap();
    });
}

#[test]
#[ignore = "subprocess helper invoked by the real restart test"]
fn database_process_helper() {
    tauri::async_runtime::block_on(async {
        let root = std::env::var_os("LAPIS_DATABASE_TEST_ROOT").unwrap();
        let profile = std::env::var("LAPIS_DATABASE_TEST_PROFILE").unwrap();
        let mut database = NativeDatabase::open(std::path::Path::new(&root), &profile)
            .await
            .unwrap();
        database.execute(serde_json::from_value(json!({"operation":"exec","sql":"CREATE TABLE restart_test (id INTEGER PRIMARY KEY, value TEXT);"})).unwrap()).await.unwrap();
        database.execute(serde_json::from_value(json!({"operation":"batch","behavior":"immediate","statements":[{"sql":"INSERT INTO restart_test VALUES (1, 'committed café')"}]})).unwrap()).await.unwrap();
        println!("DATABASE_COMMITTED");
        io::stdout().flush().unwrap();
        io::stdin().read_exact(&mut [0]).unwrap();
    });
}
