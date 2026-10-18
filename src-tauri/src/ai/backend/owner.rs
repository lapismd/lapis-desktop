use super::{Context, Lease, Selection, storage};
use crate::repository::source::Source;
use std::{
    io,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tokio::sync::Notify;
#[derive(Default)]
struct Calls {
    closing: bool,
    active: usize,
}
pub struct BackendScope {
    context: Arc<Context>,
    lease: Lease,
    selection: Selection,
    source: Option<Source>,
    calls: Mutex<Calls>,
    changed: Notify,
    preparations: Arc<tokio::sync::Mutex<()>>,
}
pub struct BackendCall {
    owner: Arc<BackendScope>,
}
impl BackendScope {
    pub(super) fn new(
        context: Arc<Context>,
        lease: Lease,
        selection: Selection,
        source: Option<Source>,
    ) -> Self {
        Self {
            context,
            lease,
            selection,
            source,
            calls: Mutex::new(Calls::default()),
            changed: Notify::new(),
            preparations: Arc::new(tokio::sync::Mutex::new(())),
        }
    }
    pub fn selection(&self) -> &Selection {
        &self.selection
    }
    fn check(&self) -> io::Result<()> {
        self.context.check()?;
        self.lease.verify()?;
        if let Some(source) = &self.source {
            source.verify()?;
        }
        Ok(())
    }
    pub fn begin(self: &Arc<Self>) -> io::Result<BackendCall> {
        self.check()?;
        {
            let mut calls = self.calls.lock().map_err(|_| storage::denied())?;
            if calls.closing {
                return Err(storage::denied());
            }
            calls.active = calls.active.checked_add(1).ok_or_else(storage::denied)?;
        }
        let call = BackendCall {
            owner: self.clone(),
        };
        call.owner.check()?;
        Ok(call)
    }
    /// Fence even if this wait is abandoned. The lease remains held by all calls.
    pub fn drain(&self) -> impl std::future::Future<Output = io::Result<()>> + '_ {
        let fenced = self
            .calls
            .lock()
            .map(|mut calls| calls.closing = true)
            .map_err(|_| storage::denied());
        async move {
            fenced?;
            loop {
                let changed = self.changed.notified();
                if self.calls.lock().map_err(|_| storage::denied())?.active == 0 {
                    return Ok(());
                }
                changed.await;
            }
        }
    }
}
impl BackendCall {
    pub(crate) async fn preparation_guard(&self) -> io::Result<tokio::sync::OwnedMutexGuard<()>> {
        let guard = self.owner.preparations.clone().lock_owned().await;
        self.check()?;
        Ok(guard)
    }
    pub(crate) fn conversation_location(
        &self,
    ) -> io::Result<(cap_std::fs::Dir, PathBuf, [u8; 32])> {
        self.check()?;
        let source = self.owner.source.as_ref().ok_or_else(storage::denied)?;
        Ok((
            self.owner.lease.dir.try_clone()?,
            self.owner.context.lease.root().into(),
            source.fingerprint(),
        ))
    }
    pub(crate) fn selection(&self) -> &Selection {
        &self.owner.selection
    }
    pub fn check(&self) -> io::Result<()> {
        self.owner.check()?;
        if self
            .owner
            .calls
            .lock()
            .map_err(|_| storage::denied())?
            .closing
        {
            return Err(storage::denied());
        }
        Ok(())
    }
    /// Native-only path, still subject to current admission and physical witnesses.
    pub fn repository_metadata(&self) -> io::Result<Option<PathBuf>> {
        self.check()?;
        Ok(self.owner.source.as_ref().map(|s| s.metadata.clone()))
    }
}
impl Drop for BackendCall {
    fn drop(&mut self) {
        if let Ok(mut calls) = self.owner.calls.lock() {
            calls.active -= 1;
            self.owner.changed.notify_waiters();
        }
    }
}
