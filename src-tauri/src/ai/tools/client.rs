use super::{
    files, framing,
    protocol::{Outcome, Request, Response},
    unavailable, unknown,
};
use lapis_ai_app_tools::{Config, Tool, ToolCall, ToolError, ToolFuture, ToolHandler};
use std::{io, path::PathBuf, time::Duration};
use tokio::{io::BufReader, net::UnixStream, sync::watch};
use zeroize::Zeroizing;

pub struct Client {
    path: PathBuf,
    credential: Zeroizing<String>,
    tools: Vec<Tool>,
}
impl Client {
    pub async fn connect(path: PathBuf, credential: String) -> io::Result<Self> {
        let mut client = Self {
            path,
            credential: Zeroizing::new(credential),
            tools: vec![],
        };
        let response = client
            .exchange(Request::Snapshot {
                credential: client.credential.to_string(),
            })
            .await?;
        let Response::Snapshot { tools } = response else {
            return Err(unavailable());
        };
        client.tools = tools.into_iter().map(Into::into).collect();
        Config::default()
            .validate(&client.tools)
            .map_err(|_| unavailable())?;
        Ok(client)
    }
    async fn exchange(&self, request: Request) -> io::Result<Response> {
        tokio::time::timeout(Duration::from_secs(60), async {
            let stream = UnixStream::connect(&self.path).await?;
            let (read, mut write) = stream.into_split();
            framing::write(&mut write, &request).await?;
            framing::read(&mut BufReader::new(read)).await
        })
        .await
        .map_err(|_| unknown())?
    }
}
impl ToolHandler for Client {
    fn tools(&self) -> Vec<Tool> {
        self.tools.clone()
    }
    fn call(&self, call: ToolCall, mut cancelled: watch::Receiver<bool>) -> ToolFuture<'_> {
        Box::pin(async move {
            if *cancelled.borrow() {
                return Err(ToolError::Unavailable);
            }
            let response = tokio::select! {
                biased;
                _ = cancelled.changed() => return Err(ToolError::Unknown),
                response = self.exchange(Request::Call { credential: self.credential.to_string(), name: call.name, arguments: call.arguments }) => response.map_err(|_| ToolError::Unknown)?,
            };
            match response {
                Response::Result {
                    outcome: Outcome::Completed { value },
                } => Ok(value),
                Response::Result {
                    outcome: Outcome::Rejected {},
                } => Err(ToolError::Unavailable),
                Response::Result {
                    outcome: Outcome::Invalid {},
                } => Err(ToolError::InvalidInput),
                _ => Err(ToolError::Unknown),
            }
        })
    }
}
/// Dedicated child role; initialize no WebView, vault, plugin or desktop runtime.
pub async fn stdio() -> io::Result<()> {
    let path = std::env::var_os(files::SOCKET_ENV).ok_or_else(unavailable)?;
    let credential = std::env::var(files::CREDENTIAL_ENV).map_err(|_| unavailable())?;
    let client = Client::connect(PathBuf::from(path), credential).await?;
    lapis_ai_app_tools::serve(
        BufReader::new(tokio::io::stdin()),
        tokio::io::stdout(),
        std::sync::Arc::new(client),
        Config::default(),
    )
    .await
    .map_err(|_| unknown())
}
