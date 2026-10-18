use jj_vault::{Capture, NativeRepository, Repository, RestorePreview, RestoreRequest};
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
        self.with_native(|native| native.capture())
    }
    fn preview_restore(&mut self, checkpoint: &str, path: &str) -> Result<RestorePreview, String> {
        self.with_native(|native| native.preview_restore(checkpoint, path))
    }
    fn restore(&mut self, request: &RestoreRequest) -> Result<Capture, String> {
        self.with_native(|native| native.restore(request))
    }
}
impl Provider {
    fn with_native<T>(
        &mut self,
        action: impl FnOnce(&mut NativeRepository) -> Result<T, String>,
    ) -> Result<T, String> {
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
        action(&mut self.native)
    }
}
