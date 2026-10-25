use super::backup::Backups;
use crate::host::state::{NativeError, NativeHost};

impl Backups {
    pub async fn close_window(&self, host: NativeHost, window: &str) -> Result<(), NativeError> {
        let sessions: Vec<_> = self
            .entries
            .lock()
            .await
            .iter()
            .filter(|(_, owner)| owner.window == window)
            .map(|(session, _)| session.clone())
            .collect();
        let mut failure = None;
        for session in sessions {
            if let Err(error) = self.close(host.clone(), &session).await {
                failure.get_or_insert(error);
            }
        }
        match failure {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }
    pub async fn close(&self, _host: NativeHost, session: &str) -> Result<(), NativeError> {
        let mut entries = self.entries.lock().await;
        let Some(owner) = entries.get_mut(session) else {
            return Ok(());
        };
        // The service keeps failed workers and their native watch for retry.
        owner
            .backup
            .try_close()
            .await
            .map_err(super::backup::error)?;
        let owner = entries.remove(session).unwrap();
        if let Some(events) = owner.events {
            events.abort();
        }
        Ok(())
    }
    pub async fn detach(&self, session: &str) {
        if let Some(owner) = self.entries.lock().await.remove(session)
            && let Some(events) = owner.events
        {
            events.abort();
        }
    }
    pub async fn detach_window(&self, window: &str) {
        let sessions: Vec<_> = self
            .entries
            .lock()
            .await
            .iter()
            .filter(|(_, owner)| owner.window == window)
            .map(|(session, _)| session.clone())
            .collect();
        for session in sessions {
            self.detach(&session).await;
        }
    }
}
