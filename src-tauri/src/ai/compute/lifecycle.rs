//! Original-owner cleanup remains available after execution admission is revoked.
use super::*;
impl Compute {
    pub async fn shutdown(&self, generation: Option<&str>) -> io::Result<()> {
        self.shutdown_scoped(generation, None).await
    }
    pub async fn stop_owned(&self, session: &str, owner_id: Option<uuid::Uuid>) -> io::Result<()> {
        self.shutdown_scoped(None, Some((session, owner_id))).await
    }
    async fn shutdown_scoped(
        &self,
        generation: Option<&str>,
        request: Option<(&str, Option<uuid::Uuid>)>,
    ) -> io::Result<()> {
        let _transition = self.transition.lock().await;
        {
            let owner = self.runtime.owner.lock().map_err(|_| unavailable())?;
            if generation
                .is_some_and(|generation| owner.as_ref().is_none_or(|o| o.generation != generation))
            {
                return Ok(());
            }
            if let Some((session, id)) = request
                && (id.is_none()
                    || owner.as_ref().is_none_or(|o| o.session != session)
                    || self
                        .runtime
                        .view
                        .lock()
                        .map_err(|_| unavailable())?
                        .owner_id
                        != id)
            {
                return Ok(());
            }
        }
        self.fenced.store(true, std::sync::atomic::Ordering::SeqCst);
        let commands = self
            .runtime
            .commands
            .lock()
            .map_err(|_| unavailable())?
            .clone();
        if let Some(commands) = commands {
            // Reaping the owned helper is the cleanup proof, even if it already closed stdin.
            let _sent = commands.stop().await;
        }
        let mut job = self.runtime.job.lock().await;
        if let Some(task) = job.as_mut() {
            tokio::time::timeout(std::time::Duration::from_secs(25), task)
                .await
                .map_err(|_| unavailable())?
                .map_err(|_| unavailable())?
                .ok();
            job.take();
        }
        let mut client = self.runtime.client.lock().await;
        if let Some(active) = client.as_mut() {
            if active.shutdown().await.is_err() {
                self.runtime.view.lock().map_err(|_| unavailable())?.state = "attention".into();
                return Err(unavailable());
            }
            client.take();
        }
        self.runtime
            .commands
            .lock()
            .map_err(|_| unavailable())?
            .take();
        self.runtime
            .connection
            .lock()
            .map_err(|_| unavailable())?
            .take();
        self.runtime.owner.lock().map_err(|_| unavailable())?.take();
        *self.runtime.view.lock().map_err(|_| unavailable())? = View {
            state: "off".into(),
            ..Default::default()
        };
        Ok(())
    }
}
