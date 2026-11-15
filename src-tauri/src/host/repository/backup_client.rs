//! Native command/status client; the shared vault service owns the coordinator.
use jj_vault::{
    AdoptionRequest, AiHistoryRequest, AiHistoryResponse, Capture, Checkpoint, RestorePreview,
    RestoreRequest, Status, VaultRestorePreview, VaultRestoreRequest,
};
use lapis_app_core::services::Client;
use std::sync::Arc;
use tokio::sync::watch::Receiver;

pub(super) struct BackupClient {
    client: Arc<Client>,
    status: Receiver<Status>,
}
impl BackupClient {
    pub async fn start(client: Arc<Client>) -> Result<Self, String> {
        let status = client
            .start_backup()
            .await
            .map_err(|error| error.to_string())?;
        Ok(Self { client, status })
    }
    pub fn subscribe(&self) -> Receiver<Status> {
        self.status.clone()
    }
    pub async fn try_close(&mut self) -> Result<(), String> {
        self.client
            .stop_backup()
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn capture(&self) -> Result<Capture, String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.capture().await }))
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn ai_history(&self, request: AiHistoryRequest) -> Result<AiHistoryResponse, String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.ai_history(request).await }))
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn adopt_history(&self, request: AdoptionRequest) -> Result<Checkpoint, String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.adopt_history(request).await }))
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn stop_adoption(&self, id: String) -> Result<(), String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.stop_adoption(id).await }))
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn preview_vault_restore(
        &self,
        checkpoint: String,
    ) -> Result<VaultRestorePreview, String> {
        self.client
            .with_backup(move |engine| {
                Box::pin(async move { engine.preview_vault_restore(checkpoint).await })
            })
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn restore_vault(&self, request: VaultRestoreRequest) -> Result<Capture, String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.restore_vault(request).await }))
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn preview_restore(
        &self,
        checkpoint: String,
        path: String,
    ) -> Result<RestorePreview, String> {
        self.client
            .with_backup(move |engine| {
                Box::pin(async move { engine.preview_restore(checkpoint, path).await })
            })
            .await
            .map_err(|error| error.to_string())
    }
    pub async fn restore(&self, request: RestoreRequest) -> Result<Capture, String> {
        self.client
            .with_backup(move |engine| Box::pin(async move { engine.restore(request).await }))
            .await
            .map_err(|error| error.to_string())
    }
}
