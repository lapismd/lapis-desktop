use lapis_app_core::services::Client;
use lapis_app_protocol::database::{
    call::{DatabaseCall, DatabaseValue},
    changes::ChangeSet,
};
use lapis_app_protocol::indexing::{IndexingCommand, IndexingValue};
use std::{
    io,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use tokio::{sync::broadcast, task::JoinHandle};

/// A scoped view of the vault-owned database, never a second database writer.
pub struct DatabaseConnection {
    pub(super) client: Arc<Client>,
    pub(super) closed: Arc<AtomicBool>,
    pub(super) observer: Mutex<Option<JoinHandle<()>>>,
    pub(super) observer_gate: tokio::sync::Mutex<()>,
}

impl DatabaseConnection {
    pub(super) fn new(client: Arc<Client>) -> Self {
        Self {
            client,
            closed: Arc::new(AtomicBool::new(false)),
            observer: Mutex::new(None),
            observer_gate: tokio::sync::Mutex::new(()),
        }
    }

    pub fn is_closed(&self) -> bool {
        self.closed.load(Ordering::Acquire)
    }

    pub(super) fn require_open(&self) -> io::Result<()> {
        if self.is_closed() {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Database admission is closed",
            ));
        }
        Ok(())
    }

    pub async fn subscribe(&self) -> io::Result<broadcast::Receiver<ChangeSet>> {
        self.require_open()?;
        self.client
            .subscribe_to_database_changes()
            .await
            .map_err(io::Error::other)
    }

    pub async fn call(&self, request: DatabaseCall) -> io::Result<DatabaseValue> {
        self.require_open()?;
        // The core owns accepted calls and drain. Holding a response guard here
        // would let an unpolled reply prevent explicit vault close.
        self.client
            .call_database(request)
            .await
            .map_err(io::Error::other)
    }

    pub async fn indexing(&self, command: IndexingCommand) -> io::Result<IndexingValue> {
        self.require_open()?;
        self.client
            .control_indexing(command)
            .await
            .map_err(io::Error::other)
    }

    pub(super) async fn stop_observer(&self) {
        let previous = self
            .observer
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .take();
        if let Some(previous) = previous {
            previous.abort();
            let _ = previous.await;
        }
    }

    pub async fn close(&self) {
        self.closed.store(true, Ordering::Release);
        let _guard = self.observer_gate.lock().await;
        self.stop_observer().await;
    }
}

impl Drop for DatabaseConnection {
    fn drop(&mut self) {
        self.closed.store(true, Ordering::Release);
        if let Some(observer) = self
            .observer
            .get_mut()
            .unwrap_or_else(|error| error.into_inner())
            .take()
        {
            observer.abort();
        }
    }
}
