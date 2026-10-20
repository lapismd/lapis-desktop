//! Private stateless HTTP MCP adapter for Cursor; execution stays in AppToolHost.
use super::{Binding, Client, unavailable};
use axum::{
    Router,
    body::Bytes,
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode, Uri},
    response::IntoResponse,
    routing::post,
};
use serde_json::{Value, json};
use std::{
    collections::{BTreeMap, BTreeSet},
    io,
    sync::{Arc, Mutex, Weak},
    time::Duration,
};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    sync::watch,
};

struct Http {
    binding: Weak<Binding>,
    host: String,
    requests: Mutex<Requests>,
}
#[derive(Default)]
struct Requests {
    seen: BTreeSet<String>,
    active: BTreeMap<String, watch::Sender<bool>>,
}
pub(super) async fn start(
    binding: &Arc<Binding>,
) -> io::Result<tokio::task::JoinHandle<io::Result<()>>> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let host = listener.local_addr()?.to_string();
    let config = binding.http_launch()?.0;
    let text = format!(
        "[[tools]]\ntype = \"http\"\nname = \"lapis-tools\"\nurl = \"http://{host}/mcp\"\n[[tools.headers]]\nname = \"Authorization\"\nenv = \"LAPIS_NOTES_TOOL_HTTP_AUTH\"\n"
    );
    tokio::task::spawn_blocking(move || {
        use std::{io::Write, os::unix::fs::OpenOptionsExt};
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .open(config)?;
        file.write_all(text.as_bytes())?;
        file.sync_all()
    })
    .await
    .map_err(|_| unavailable())??;
    let state = Arc::new(Http {
        binding: Arc::downgrade(binding),
        host,
        requests: Mutex::default(),
    });
    let app = Router::new()
        .route("/mcp", post(request))
        .layer(DefaultBodyLimit::max(1_048_576))
        .with_state(state);
    let mut stop = binding.stop.subscribe();
    Ok(tokio::spawn(async move {
        axum::serve(super::http_listener::Listener::new(listener), app)
            .with_graceful_shutdown(async move {
                if !*stop.borrow() {
                    let _ = stop.changed().await;
                }
            })
            .await
    }))
}
async fn request(
    State(state): State<Arc<Http>>,
    uri: Uri,
    headers: HeaderMap,
    body: Bytes,
) -> axum::response::Response {
    let Some(binding) = state.binding.upgrade() else {
        return StatusCode::GONE.into_response();
    };
    if uri.query().is_some()
        || headers.contains_key("origin")
        || headers.get("host").and_then(|v| v.to_str().ok()) != Some(&state.host)
    {
        return StatusCode::FORBIDDEN.into_response();
    }
    let credential = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));
    if credential.is_none_or(|s| binding.authenticate(s).is_err()) {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    let Ok(frame) = serde_json::from_slice::<Value>(&body) else {
        return StatusCode::BAD_REQUEST.into_response();
    };
    if frame["jsonrpc"] != "2.0" || !frame["method"].is_string() {
        return StatusCode::BAD_REQUEST.into_response();
    }
    let Some(id) = frame.get("id") else {
        if frame["method"] == "notifications/cancelled"
            && let Ok(requests) = state.requests.lock()
            && let Some(cancel) = requests
                .active
                .get(&frame["params"]["requestId"].to_string())
        {
            cancel.send_replace(true);
        }
        return StatusCode::ACCEPTED.into_response();
    };
    if !(id.is_string() || id.is_i64() || id.is_u64()) || id.to_string().len() > 256 {
        return StatusCode::BAD_REQUEST.into_response();
    }
    let key = id.to_string();
    let (cancel, cancelled) = watch::channel(false);
    {
        let Ok(mut requests) = state.requests.lock() else {
            return StatusCode::SERVICE_UNAVAILABLE.into_response();
        };
        if requests.active.len() >= 8 || requests.seen.len() >= 4096 {
            return StatusCode::TOO_MANY_REQUESTS.into_response();
        }
        if !requests.seen.insert(key.clone()) {
            return StatusCode::CONFLICT.into_response();
        }
        requests.active.insert(key.clone(), cancel);
    }
    let result = exchange(binding, frame, cancelled).await;
    if let Ok(mut requests) = state.requests.lock() {
        requests.active.remove(&key);
    }
    match result {
        Ok(response) => axum::Json(response).into_response(),
        Err(_) => StatusCode::SERVICE_UNAVAILABLE.into_response(),
    }
}
async fn exchange(
    binding: Arc<Binding>,
    frame: Value,
    mut cancelled: watch::Receiver<bool>,
) -> io::Result<Value> {
    let (path, credential) = {
        let files = binding.files.lock().map_err(|_| unavailable())?;
        let files = files.as_ref().ok_or_else(unavailable)?;
        (files.path.clone(), files.credential.to_string())
    };
    let client = Arc::new(Client::connect(path, credential).await?);
    let (mut input, engine_input) = tokio::io::duplex(1_048_578);
    let (engine_output, output) = tokio::io::duplex(1_048_578);
    let task = tokio::spawn(lapis_ai_app_tools::serve(
        engine_input,
        engine_output,
        client,
        Default::default(),
    ));
    struct Abort(tokio::task::JoinHandle<Result<(), lapis_ai_app_tools::Error>>);
    impl Drop for Abort {
        fn drop(&mut self) {
            self.0.abort();
        }
    }
    let _task = Abort(task);
    let mut output = BufReader::new(output);
    let mut stop = binding.stop.subscribe();
    let work = async {
        if frame["method"] != "initialize" {
            let seed = json!({"jsonrpc":"2.0","id":format!("native-{}",uuid::Uuid::new_v4()),"method":"initialize","params":{}});
            input.write_all(format!("{seed}\n").as_bytes()).await?;
            let mut ignored = String::new();
            output.read_line(&mut ignored).await?;
        }
        input.write_all(format!("{frame}\n").as_bytes()).await?;
        let mut response = String::new();
        output.read_line(&mut response).await?;
        serde_json::from_str(&response).map_err(|_| unavailable())
    };
    tokio::select! {
        biased;
        _ = stop.changed() => Err(unavailable()),
        _ = cancelled.changed() => Err(unavailable()),
        result = tokio::time::timeout(Duration::from_secs(65), work) => result.map_err(|_| unavailable())?,
    }
}
