use lapis_app_core::services::content::ContentGrants;
use std::{io, sync::Arc};
use tokio::{net::TcpListener, sync::oneshot, task::JoinHandle};

pub struct Listener {
    pub origin: String,
    stop: Option<oneshot::Sender<()>>,
    cancellation: tokio_util::sync::CancellationToken,
    worker: JoinHandle<io::Result<()>>,
}
impl Listener {
    pub async fn start(grants: Arc<ContentGrants>) -> io::Result<Self> {
        let socket = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0)).await?;
        let origin = format!("http://{}", socket.local_addr()?);
        let boundary = lapis_content_http::Boundary::new(grants, &origin)?;
        let cancellation = tokio_util::sync::CancellationToken::new();
        let router = lapis_content_http::router_with_boundary(boundary.clone()).merge(
            lapis_content_mcp::router_with_boundary(boundary, cancellation.clone())?,
        );
        let (stop, stopped) = oneshot::channel();
        let worker = tokio::spawn(async move {
            axum::serve(socket, router)
                .with_graceful_shutdown(async {
                    let _ = stopped.await;
                })
                .await
        });
        Ok(Self {
            origin,
            stop: Some(stop),
            cancellation,
            worker,
        })
    }
    pub async fn stop(mut self) -> io::Result<()> {
        self.cancellation.cancel();
        if let Some(stop) = self.stop.take() {
            let _ = stop.send(());
        }
        self.worker.await.map_err(io::Error::other)?
    }
}
