use super::{NativeWatch, WatchBatch, WatchOptions};
use lapis_app_core::vault::VaultRoot;
use std::{
    collections::HashMap,
    io,
    sync::{Arc, Mutex},
};

#[derive(Default)]
pub struct WatchRegistry {
    entries: HashMap<String, (String, NativeWatch)>,
}

impl WatchRegistry {
    pub fn start(
        &mut self,
        session: &str,
        root: &VaultRoot,
        scope: &str,
        recursive: bool,
        gate: Arc<Mutex<()>>,
        listener: impl Fn(WatchBatch) -> bool + Send + 'static,
    ) -> io::Result<String> {
        self.start_filtered(
            session,
            root,
            WatchOptions {
                scope: scope.into(),
                recursive,
                ignored_names: vec![],
                backup_content: false,
            },
            gate,
            listener,
        )
    }
    pub fn start_filtered(
        &mut self,
        session: &str,
        root: &VaultRoot,
        options: WatchOptions,
        gate: Arc<Mutex<()>>,
        listener: impl Fn(WatchBatch) -> bool + Send + 'static,
    ) -> io::Result<String> {
        if self.entries.len() >= 32
            || self
                .entries
                .values()
                .filter(|(owner, _)| owner == session)
                .count()
                >= 16
        {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Native watch subscription limit reached",
            ));
        }
        let watch = NativeWatch::start_filtered(root, options, gate, listener)?;
        let id = uuid::Uuid::new_v4().to_string();
        self.entries.insert(id.clone(), (session.to_owned(), watch));
        Ok(id)
    }

    pub fn close(&mut self, session: &str, id: &str) -> io::Result<()> {
        if let Some((owner, watch)) = self.entries.get_mut(id) {
            if owner != session {
                return Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Watch belongs to another admission",
                ));
            }
            // Failed cleanup stays owned and can be retried before admission release.
            watch.close()?;
            self.entries.remove(id);
        }
        Ok(())
    }

    pub fn close_session(&mut self, session: &str) -> io::Result<()> {
        let ids: Vec<_> = self
            .entries
            .iter()
            .filter(|(_, (owner, _))| owner == session)
            .map(|(id, _)| id.clone())
            .collect();
        let mut failure = None;
        for id in ids {
            if let Err(error) = self.close(session, &id) {
                failure.get_or_insert(error);
            }
        }
        failure.map_or(Ok(()), Err)
    }
}
