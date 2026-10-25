use lapis_app_protocol::database::call::DatabaseValue;
use lapis_desktop::{
    database::NativeDatabases,
    vault::{VaultManager, services::VaultServices},
};
use serde_json::json;
use std::{
    io::{self, BufRead, Read, Write},
    process::{Command, Stdio},
};

#[test]
fn committed_database_state_survives_a_killed_process_and_native_restart() {
    let root = tempfile::tempdir().unwrap();
    let vault = root.path().join("vault");
    let profile = root.path().join("profile");
    std::fs::create_dir(&vault).unwrap();
    let mut manager = VaultManager::new(&profile).unwrap();
    let selected = manager.select(Some(vault), None).unwrap().unwrap();
    let id = selected.profile_id;
    drop(manager);
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args([
            "--ignored",
            "--exact",
            "database_process_helper",
            "--nocapture",
        ])
        .env("LAPIS_DATABASE_TEST_ROOT", root.path())
        .env("LAPIS_DATABASE_TEST_PROFILE", &id)
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
        let mut manager = VaultManager::new(&profile).unwrap();
        let selected = manager.open_recent(&id).unwrap();
        let mut services = VaultServices::new(&profile).unwrap();
        let client = services.client(&manager, &selected.session_id).unwrap();
        let mut views = NativeDatabases::default();
        let (connection_id, connection) = views.open(&selected.session_id, client).unwrap();
        let call = serde_json::from_value(
            json!({"method":"getMeta","args":[{"kind":"value","value":"restart"}]}),
        )
        .unwrap();
        assert!(
            matches!(connection.call(call).await.unwrap(),DatabaseValue::Value{value} if value=="committed café")
        );
        connection.close().await;
        views.remove(&selected.session_id, &connection_id).unwrap();
        tokio::task::spawn_blocking(move || services.close(&manager, &selected.session_id))
            .await
            .unwrap()
            .unwrap();
    });
}

#[test]
#[ignore = "subprocess helper invoked by the real restart test"]
fn database_process_helper() {
    tauri::async_runtime::block_on(async {
        let root = std::path::PathBuf::from(std::env::var_os("LAPIS_DATABASE_TEST_ROOT").unwrap());
        let id = std::env::var("LAPIS_DATABASE_TEST_PROFILE").unwrap();
        let mut manager = VaultManager::new(&root.join("profile")).unwrap();
        let selected = manager.open_recent(&id).unwrap();
        let mut services = VaultServices::new(&root.join("profile")).unwrap();
        let client = services.client(&manager, &selected.session_id).unwrap();
        let (_, connection) = NativeDatabases::default()
            .open(&selected.session_id, client)
            .unwrap();
        let call = serde_json::from_value(json!({"method":"setMeta","args":[{"kind":"value","value":"restart"},{"kind":"value","value":"committed café"}]})).unwrap();
        connection.call(call).await.unwrap();
        println!("DATABASE_COMMITTED");
        io::stdout().flush().unwrap();
        io::stdin().read_exact(&mut [0]).unwrap();
    });
}
