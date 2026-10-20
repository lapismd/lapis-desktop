use super::backup::{Backups, error};
use crate::host::state::{NativeError, NativeHost, access};

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
    pub async fn close(&self, host: NativeHost, session: &str) -> Result<(), NativeError> {
        let mut entries = self.entries.lock().await;
        let Some(owner) = entries.get_mut(session) else {
            return Ok(());
        };
        // Stop delivery before the final capture, after editor persistence.
        if let Some(watch) = owner.watch.clone() {
            let key = session.to_owned();
            access(host.clone(), move |s| s.watches.close(&key, &watch)).await?;
            owner.watch = None;
        }
        // Keep the original owner and status stream on failure or cancellation.
        if let Err(failure) = owner.backup.try_close().await {
            owner.watch = Some(
                super::backup_watch::start(host, session.to_owned(), owner.backup.changes())
                    .await
                    .map_err(|resume| {
                        error(format!(
                            "{failure}; backup watching could not resume: {resume}"
                        ))
                    })?,
            );
            return Err(error(failure));
        }
        let owner = entries.remove(session).unwrap();
        if let Some(events) = owner.events {
            events.abort();
        }
        Ok(())
    }
}
