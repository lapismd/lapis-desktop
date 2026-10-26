//! Desktop observation leases around the existing Core reader, never an engine.
use lapis_app_core::services::{Client, HistoryError, VaultService};
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};

pub struct ReaderLease {
    window: String,
    session: String,
    client: Arc<Client>,
    active: AtomicBool,
}
impl ReaderLease {
    pub fn session(&self) -> &str {
        &self.session
    }
    pub fn client(&self) -> &Client {
        &self.client
    }
}

#[derive(Default)]
pub struct Readers(Mutex<HashMap<String, Arc<ReaderLease>>>);
impl Readers {
    pub fn current(&self, window: &str) -> Result<Option<Arc<ReaderLease>>, HistoryError> {
        Ok(self
            .0
            .lock()
            .map_err(|_| HistoryError::Unavailable)?
            .get(window)
            .cloned())
    }

    /// Called under the host's existing repository transition guard.
    pub fn attach(
        &self,
        window: &str,
        session: &str,
        service: &Arc<VaultService>,
    ) -> Result<Arc<ReaderLease>, HistoryError> {
        let mut current = self.0.lock().map_err(|_| HistoryError::Unavailable)?;
        if let Some(lease) = current.get(window) {
            return if lease.session == session && lease.active.load(Ordering::Acquire) {
                Ok(lease.clone())
            } else {
                Err(HistoryError::Busy)
            };
        }
        let lease = Arc::new(ReaderLease {
            window: window.into(),
            session: session.into(),
            client: Arc::new(service.attach().map_err(|_| HistoryError::Denied)?),
            active: AtomicBool::new(true),
        });
        current.insert(window.into(), lease.clone());
        Ok(lease)
    }

    pub fn require(&self, window: &str, session: &str) -> Result<Arc<ReaderLease>, HistoryError> {
        self.current(window)?
            .filter(|lease| lease.session == session && lease.active.load(Ordering::Acquire))
            .ok_or(HistoryError::Denied)
    }

    pub fn check(&self, lease: &Arc<ReaderLease>) -> Result<(), HistoryError> {
        self.current(&lease.window)?
            .filter(|current| Arc::ptr_eq(current, lease) && lease.active.load(Ordering::Acquire))
            .map(|_| ())
            .ok_or(HistoryError::Denied)
    }

    pub fn for_session(&self, session: &str) -> Result<Vec<Arc<ReaderLease>>, HistoryError> {
        Ok(self
            .0
            .lock()
            .map_err(|_| HistoryError::Unavailable)?
            .values()
            .filter(|lease| lease.session == session)
            .cloned()
            .collect())
    }

    /// GUI destruction fences admission without blocking its event callback.
    pub fn fence(&self, lease: &Arc<ReaderLease>) {
        lease.active.store(false, Ordering::Release);
    }

    /// Run on a blocking worker, outside NativeHost and filesystem gates.
    pub fn retire(&self, lease: &Arc<ReaderLease>) -> Result<(), HistoryError> {
        self.fence(lease);
        lease
            .client
            .detach()
            .map_err(|_| HistoryError::Unavailable)?;
        let mut current = self.0.lock().map_err(|_| HistoryError::Unavailable)?;
        if current
            .get(&lease.window)
            .is_some_and(|selected| Arc::ptr_eq(selected, lease))
        {
            current.remove(&lease.window);
        }
        Ok(())
    }
}
