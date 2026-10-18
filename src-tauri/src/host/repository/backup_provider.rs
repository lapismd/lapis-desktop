use jj_vault::{Capture, NativeRepository, Repository};
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicBool, Ordering},
};

/// Native writes and backup scans share the IO gate. The worker never locks
/// NativeServices, so watcher shutdown cannot deadlock behind capture.
pub(super) struct Provider {
    pub native: NativeRepository,
    pub files: Arc<Mutex<()>>,
    pub active: Arc<AtomicBool>,
}
impl Repository for Provider {
    fn capture(&mut self) -> Result<Capture, String> {
        if !self.active.load(Ordering::Acquire) {
            return Err("Vault backup admission is closed".into());
        }
        let _gate = self
            .files
            .lock()
            .map_err(|_| "Vault file IO is unavailable".to_string())?;
        if !self.active.load(Ordering::Acquire) {
            return Err("Vault backup admission is closed".into());
        }
        self.native
            .binding
            .relink()
            .map_err(|error| error.to_string())?;
        self.native.capture()
    }
}
