use lapis_ai_app_tools::{ToolCall, ToolError, ToolHandler};
use lapis_desktop::ai::tools::{Binding, Client, Event, Limits, Outcome, ToolSpec};
use serde_json::json;
use std::{
    io,
    os::unix::fs::PermissionsExt,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::UnixStream,
    sync::{mpsc, watch},
};
use uuid::Uuid;

fn tool() -> ToolSpec {
    ToolSpec {
        name: "notes.read".into(),
        description: "Read an admitted note".into(),
        input_schema: json!({"type":"object"}),
    }
}
fn limits() -> Limits {
    Limits {
        handshake: Duration::from_millis(100),
        call: Duration::from_secs(2),
        drain: Duration::from_millis(100),
    }
}
async fn setup() -> (
    Arc<Binding>,
    mpsc::UnboundedReceiver<Event>,
    Arc<AtomicBool>,
) {
    let (sender, receiver) = mpsc::unbounded_channel();
    let allowed = Arc::new(AtomicBool::new(true));
    let checking = allowed.clone();
    let binding = Binding::open(
        vec![tool()],
        Arc::new(move || {
            if checking.load(Ordering::SeqCst) {
                Ok(())
            } else {
                Err(io::Error::from(io::ErrorKind::PermissionDenied))
            }
        }),
        Arc::new(move |event| {
            sender
                .send(event)
                .map_err(|_| io::Error::from(io::ErrorKind::BrokenPipe))
        }),
        limits(),
    )
    .await
    .unwrap();
    (binding, receiver, allowed)
}
fn launch(binding: &Binding) -> (std::path::PathBuf, String) {
    let (_, environment) = binding.launch().unwrap();
    (
        environment["LAPIS_NOTES_TOOL_SOCKET"].clone().into(),
        environment["LAPIS_NOTES_TOOL_CREDENTIAL"].clone(),
    )
}
async fn client(binding: &Binding) -> Client {
    let (path, credential) = launch(binding);
    Client::connect(path, credential).await.unwrap()
}
fn call() -> ToolCall {
    ToolCall {
        request_id: json!(u64::MAX),
        name: "notes.read".into(),
        arguments: json!({"path":"README.md"}),
    }
}
async fn execute(client: &Client, call: ToolCall) -> Result<serde_json::Value, ToolError> {
    let (_owner, cancelled) = watch::channel(false);
    client.call(call, cancelled).await
}
async fn event(receiver: &mut mpsc::UnboundedReceiver<Event>) -> Event {
    tokio::time::timeout(Duration::from_secs(2), receiver.recv())
        .await
        .unwrap()
        .unwrap()
}
#[tokio::test]
async fn authentication_and_launch_config_do_not_expose_credentials() {
    let (binding, _, _) = setup().await;
    let (path, credential) = launch(&binding);
    let (config, _) = binding.launch().unwrap();
    let contents = std::fs::read_to_string(&config).unwrap();
    assert!(!contents.contains(&credential));
    assert!(contents.contains("env = \"LAPIS_NOTES_TOOL_CREDENTIAL\""));
    assert_eq!(
        std::fs::metadata(config.parent().unwrap())
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        0o700
    );
    assert_eq!(
        std::fs::metadata(&path).unwrap().permissions().mode() & 0o777,
        0o600
    );
    assert_eq!(
        std::fs::metadata(&config).unwrap().permissions().mode() & 0o777,
        0o600
    );
    assert!(
        Client::connect(path.clone(), "foreign".into())
            .await
            .is_err()
    );
    assert_eq!(client(&binding).await.tools().len(), 1);
    binding.close().await.unwrap();
    assert!(!path.exists());
    assert!(!config.exists());
}
#[tokio::test]
async fn listing_is_available_before_arming_but_execution_is_not() {
    let (binding, mut receiver, _) = setup().await;
    let client = client(&binding).await;
    assert!(matches!(
        execute(&client, call()).await,
        Err(ToolError::Unavailable)
    ));
    assert!(receiver.try_recv().is_err());
    binding.close().await.unwrap();
}
#[tokio::test]
async fn exact_turn_and_opaque_invocation_are_retained_without_mcp_numeric_ids() {
    let (binding, mut receiver, _) = setup().await;
    let client = client(&binding).await;
    let turn = Uuid::new_v4();
    binding.arm(turn).unwrap();
    let task = tokio::spawn(async move { execute(&client, call()).await });
    let Event::Call {
        bridge_id,
        invocation_id,
        turn_id,
        name,
        arguments,
    } = event(&mut receiver).await
    else {
        panic!("Expected call")
    };
    assert_eq!(bridge_id, binding.id);
    assert_eq!(turn_id, turn);
    assert_eq!(name, "notes.read");
    assert_eq!(arguments, json!({"path":"README.md"}));
    binding
        .reply(
            invocation_id,
            Outcome::Completed {
                value: json!({"content":[{"type":"text","text":"note"}]}),
            },
        )
        .unwrap();
    assert_eq!(task.await.unwrap().unwrap()["content"][0]["text"], "note");
    assert!(binding.reply(invocation_id, Outcome::Unknown {}).is_err());
    binding
        .reply(
            invocation_id,
            Outcome::Completed {
                value: json!({"content":[{"type":"text","text":"note"}]}),
            },
        )
        .unwrap();
    binding.end(turn).await.unwrap();
    assert!(binding.end(turn).await.is_err());
    binding.close().await.unwrap();
}
#[tokio::test]
async fn stale_scope_and_unlisted_names_refuse_before_dispatch() {
    let (binding, mut receiver, allowed) = setup().await;
    let client = client(&binding).await;
    binding.arm(Uuid::new_v4()).unwrap();
    let mut unlisted = call();
    unlisted.name = "process.exec".into();
    assert!(matches!(
        execute(&client, unlisted).await,
        Err(ToolError::Unavailable)
    ));
    allowed.store(false, Ordering::SeqCst);
    assert!(execute(&client, call()).await.is_err());
    assert!(receiver.try_recv().is_err());
    binding.close().await.unwrap();
}
#[tokio::test]
async fn cancellation_and_failed_drain_retain_actual_execution_until_exact_reply() {
    let (binding, mut receiver, _) = setup().await;
    let client = client(&binding).await;
    binding.arm(Uuid::new_v4()).unwrap();
    let (cancel, cancelled) = watch::channel(false);
    let task = tokio::spawn(async move { client.call(call(), cancelled).await });
    let Event::Call { invocation_id, .. } = event(&mut receiver).await else {
        panic!("Expected call")
    };
    cancel.send_replace(true);
    assert!(matches!(task.await.unwrap(), Err(ToolError::Unknown)));
    let Event::Cancel {
        invocation_id: cancelled,
        ..
    } = event(&mut receiver).await
    else {
        panic!("Expected cancel")
    };
    assert_eq!(invocation_id, cancelled);
    assert!(binding.close().await.is_err());
    assert!(binding.launch().is_err());
    assert!(binding.arm(Uuid::new_v4()).is_err());
    binding.reply(invocation_id, Outcome::Unknown {}).unwrap();
    binding.close().await.unwrap();
}
#[tokio::test]
async fn dropping_a_call_future_cancels_its_original_native_invocation() {
    let (binding, mut receiver, _) = setup().await;
    let client = client(&binding).await;
    binding.arm(Uuid::new_v4()).unwrap();
    let task = tokio::spawn(async move { execute(&client, call()).await });
    let Event::Call { invocation_id, .. } = event(&mut receiver).await else {
        panic!("Expected call")
    };
    task.abort();
    let _ = task.await;
    let Event::Cancel {
        invocation_id: cancelled,
        ..
    } = event(&mut receiver).await
    else {
        panic!("Expected cancel")
    };
    assert_eq!(invocation_id, cancelled);
    binding.reply(invocation_id, Outcome::Unknown {}).unwrap();
    binding.close().await.unwrap();
}
#[tokio::test]
async fn malformed_frames_and_idle_connections_are_bounded() {
    let (binding, mut receiver, _) = setup().await;
    let (path, _) = launch(&binding);
    let mut stream = UnixStream::connect(&path).await.unwrap();
    stream
        .write_all(b"{\"type\":\"snapshot\",\"credential\":\"foreign\",\"path\":\"outside\"}\n")
        .await
        .unwrap();
    let mut line = String::new();
    assert_eq!(
        BufReader::new(stream).read_line(&mut line).await.unwrap(),
        0
    );
    let idle = UnixStream::connect(&path).await.unwrap();
    assert_eq!(
        tokio::time::timeout(
            Duration::from_secs(2),
            BufReader::new(idle).read_line(&mut line)
        )
        .await
        .unwrap()
        .unwrap(),
        0
    );
    assert!(receiver.try_recv().is_err());
    binding.close().await.unwrap();
}
#[tokio::test]
async fn invalid_snapshots_refuse_without_calling_the_application() {
    let (sender, mut receiver) = mpsc::unbounded_channel();
    assert!(
        Binding::open(
            vec![tool(), tool()],
            Arc::new(|| Ok(())),
            Arc::new(move |event| sender.send(event).map_err(|_| io::Error::other("closed"))),
            limits()
        )
        .await
        .is_err()
    );
    assert!(receiver.try_recv().is_err());
}
