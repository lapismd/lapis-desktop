use lapis_desktop::ai::tools::{Binding, Event, Limits, Outcome, ToolSpec};
use serde_json::{Value, json};
use std::{sync::Arc, time::Duration};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::mpsc,
};
use uuid::Uuid;

async fn post(address: String, authorization: String, origin: bool, body: Value) -> String {
    let mut stream = TcpStream::connect(address.clone()).await.unwrap();
    let text = body.to_string();
    let origin = if origin {
        "Origin: http://evil.invalid\r\n"
    } else {
        ""
    };
    stream.write_all(format!("POST /mcp HTTP/1.1\r\nHost: {address}\r\nAuthorization: {authorization}\r\nContent-Type: application/json\r\nConnection: close\r\n{origin}Content-Length: {}\r\n\r\n{text}", text.len()).as_bytes()).await.unwrap();
    let mut response = String::new();
    tokio::time::timeout(Duration::from_secs(5), stream.read_to_string(&mut response))
        .await
        .unwrap()
        .unwrap();
    response
}
#[tokio::test]
async fn http_is_private_authenticated_and_uses_original_approved_calls_without_replay() {
    let (send, mut events) = mpsc::unbounded_channel();
    let binding = Binding::open(
        vec![ToolSpec {
            name: "notes.read".into(),
            description: "Read a note".into(),
            input_schema: json!({"type":"object"}),
        }],
        Arc::new(|| Ok(())),
        Arc::new(move |event| send.send(event).map_err(std::io::Error::other)),
        Limits::default(),
    )
    .await
    .unwrap();
    let (config, environment) = binding.http_launch().unwrap();
    let text = std::fs::read_to_string(config).unwrap();
    let address = text
        .split("http://")
        .nth(1)
        .unwrap()
        .split("/mcp")
        .next()
        .unwrap()
        .to_owned();
    let auth = environment["LAPIS_NOTES_TOOL_HTTP_AUTH"].clone();
    assert!(!text.contains(&auth));
    let initialize = json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{}});
    assert!(
        post(
            address.clone(),
            "Bearer wrong".into(),
            false,
            initialize.clone()
        )
        .await
        .starts_with("HTTP/1.1 401")
    );
    assert!(
        post(address.clone(), auth.clone(), true, initialize.clone())
            .await
            .starts_with("HTTP/1.1 403")
    );
    assert!(
        post(address.clone(), auth.clone(), false, initialize)
            .await
            .contains("serverInfo")
    );
    let list = json!({"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}});
    assert!(
        post(address.clone(), auth.clone(), false, list)
            .await
            .contains("notes.read")
    );
    assert!(events.try_recv().is_err());
    binding.arm(Uuid::new_v4()).unwrap();
    let call = json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"notes.read","arguments":{"path":"Note.md"}}});
    let task = tokio::spawn(post(address.clone(), auth.clone(), false, call.clone()));
    let event = tokio::time::timeout(Duration::from_secs(5), events.recv())
        .await
        .unwrap()
        .unwrap();
    let Event::Call {
        invocation_id,
        name,
        ..
    } = event
    else {
        panic!("missing original call")
    };
    assert_eq!(name, "notes.read");
    binding
        .reply(
            invocation_id,
            Outcome::Completed {
                value: json!({"content":[{"type":"text","text":"Approved note"}]}),
            },
        )
        .unwrap();
    assert!(task.await.unwrap().contains("Approved note"));
    assert!(
        post(address.clone(), auth.clone(), false, call)
            .await
            .starts_with("HTTP/1.1 409")
    );
    assert!(events.try_recv().is_err());
    let pending = json!({"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"notes.read","arguments":{}}});
    let task = tokio::spawn(post(address.clone(), auth, false, pending));
    let Event::Call { invocation_id, .. } =
        tokio::time::timeout(Duration::from_secs(5), events.recv())
            .await
            .unwrap()
            .unwrap()
    else {
        panic!("missing original call")
    };
    binding.fence().unwrap();
    binding.reply(invocation_id, Outcome::Unknown {}).unwrap();
    assert!(task.await.unwrap().starts_with("HTTP/1.1 503"));
    binding.close().await.unwrap();
    assert!(TcpStream::connect(address).await.is_err());
    assert!(binding.http_launch().is_err());
}
