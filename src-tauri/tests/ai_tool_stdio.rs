use lapis_desktop::ai::tools::{Binding, Event, Limits, Outcome, ToolSpec};
use serde_json::{Value, json};
use std::{io, process::Stdio, sync::Arc, time::Duration};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    process::Command,
    sync::mpsc,
};
use uuid::Uuid;

async fn line(reader: &mut BufReader<tokio::process::ChildStdout>) -> Value {
    let mut line = String::new();
    tokio::time::timeout(Duration::from_secs(5), reader.read_line(&mut line))
        .await
        .unwrap()
        .unwrap();
    serde_json::from_str(&line).expect("Only protocol frames appear on stdout")
}
#[tokio::test]
async fn cold_bundled_stdio_role_authenticates_lists_and_calls_without_starting_tauri() {
    let (sender, mut events) = mpsc::unbounded_channel();
    let binding = Binding::open(
        vec![ToolSpec {
            name: "notes.read".into(),
            description: "Read".into(),
            input_schema: json!({"type":"object"}),
        }],
        Arc::new(|| Ok(())),
        Arc::new(move |event| sender.send(event).map_err(|_| io::Error::other("closed"))),
        Limits::default(),
    )
    .await
    .unwrap();
    let (config, environment) = binding.launch().unwrap();
    let mut child = Command::new(env!("CARGO_BIN_EXE_lapis-desktop"))
        .arg("--app-tools-stdio")
        .env_clear()
        .envs(environment)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .unwrap();
    let mut input = child.stdin.take().unwrap();
    let mut output = BufReader::new(child.stdout.take().unwrap());
    input
        .write_all(b"{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\"}\n")
        .await
        .unwrap();
    assert_eq!(
        line(&mut output).await["result"]["serverInfo"]["name"],
        "lapis-tools"
    );
    input.write_all(b"{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}\n").await.unwrap();
    assert_eq!(
        line(&mut output).await["result"]["tools"][0]["name"],
        "notes.read"
    );
    let turn = Uuid::new_v4();
    binding.arm(turn).unwrap();
    input.write_all(b"{\"jsonrpc\":\"2.0\",\"id\":18446744073709551615,\"method\":\"tools/call\",\"params\":{\"name\":\"notes.read\",\"arguments\":{\"path\":\"README.md\"}}}\n").await.unwrap();
    let Event::Call {
        invocation_id,
        turn_id,
        ..
    } = tokio::time::timeout(Duration::from_secs(5), events.recv())
        .await
        .unwrap()
        .unwrap()
    else {
        panic!("Expected call");
    };
    assert_eq!(turn_id, turn);
    binding
        .reply(
            invocation_id,
            Outcome::Completed {
                value: json!({"content":[{"type":"text","text":"native result"}]}),
            },
        )
        .unwrap();
    let result = line(&mut output).await;
    assert_eq!(result["id"], json!(u64::MAX));
    assert_eq!(result["result"]["content"][0]["text"], "native result");
    drop(input);
    assert!(
        tokio::time::timeout(Duration::from_secs(5), child.wait())
            .await
            .unwrap()
            .unwrap()
            .success()
    );
    binding.end(turn).await.unwrap();
    binding.close().await.unwrap();
    assert!(!config.exists());
}
#[tokio::test]
async fn stdio_role_rejects_missing_credentials_and_extra_arguments_without_gui_startup() {
    for args in [
        vec!["--app-tools-stdio"],
        vec!["--app-tools-stdio", "extra"],
    ] {
        let child = Command::new(env!("CARGO_BIN_EXE_lapis-desktop"))
            .args(args)
            .env_clear()
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .unwrap();
        let result = tokio::time::timeout(Duration::from_secs(5), child.wait_with_output())
            .await
            .unwrap()
            .unwrap();
        assert!(!result.status.success());
        assert!(result.stdout.is_empty());
        assert_eq!(
            String::from_utf8(result.stderr).unwrap().trim(),
            "Application tools are unavailable"
        );
    }
}
