use super::{DatabaseConnection, invalid};
use lapis_app_core::services::Client;
use lapis_app_protocol::database::{
    call::{DatabaseCall, DatabaseMethod, DatabaseValue},
    changes::{ChangeDomain, ChangeSet},
};
use std::{
    io,
    sync::atomic::Ordering,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::broadcast::{self, error::RecvError};

impl DatabaseConnection {
    pub async fn observe(
        &self,
        mut changes: broadcast::Receiver<ChangeSet>,
        mut send: impl FnMut(ChangeSet) -> bool + Send + 'static,
    ) -> io::Result<()> {
        let _guard = self.observer_gate.lock().await;
        self.require_open()?;
        self.stop_observer().await;
        self.require_open()?;
        let client = self.client.clone();
        let closed = self.closed.clone();
        let task = tokio::spawn(async move {
            let mut last_revision = 0;
            loop {
                let change = match changes.recv().await {
                    Ok(change) => change,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => {
                        // Establish the new cursor before querying revision, then
                        // discard any queued events covered by the full reset.
                        changes = changes.resubscribe();
                        match reset(&client).await {
                            Ok(change) => change,
                            Err(_) => break,
                        }
                    }
                };
                if closed.load(Ordering::Acquire) {
                    break;
                }
                if change.revision <= last_revision {
                    continue;
                }
                last_revision = change.revision;
                if !send(change) {
                    break;
                }
            }
        });
        *self
            .observer
            .lock()
            .unwrap_or_else(|error| error.into_inner()) = Some(task);
        Ok(())
    }
}

async fn reset(client: &Client) -> io::Result<ChangeSet> {
    let value = client
        .call_database(DatabaseCall {
            method: DatabaseMethod::GetChangeRevision,
            args: vec![],
        })
        .await
        .map_err(io::Error::other)?;
    let DatabaseValue::Value { value } = value else {
        return Err(invalid("Missing database revision"));
    };
    Ok(ChangeSet {
        revision: value
            .as_u64()
            .ok_or_else(|| invalid("Invalid database revision"))?,
        domains: vec![
            ChangeDomain::Metadata,
            ChangeDomain::Search,
            ChangeDomain::History,
            ChangeDomain::Notification,
            ChangeDomain::Notebook,
            ChangeDomain::Task,
            ChangeDomain::Projection,
            ChangeDomain::Memory,
            ChangeDomain::Meta,
        ],
        paths: vec![],
        renamed: None,
        reset: Some(true),
        committed_at: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
            .try_into()
            .unwrap_or(i64::MAX),
    })
}
