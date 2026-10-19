use jj_vault::{
    Capture, Checkpoint, FetchedHead, NativeRepository, Repository, RestorePreview, RestoreRequest,
    SyncConflict, SyncProposal, SyncResolution, VaultRestorePreview, VaultRestoreRequest,
};
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
    fn prepare_sync(&mut self, incoming: &str) -> Result<SyncProposal, String> {
        self.with_native(|n| n.prepare_sync(incoming))
    }
    fn preview_sync(&mut self, candidate: &str) -> Result<VaultRestorePreview, String> {
        self.with_native(|n| n.preview_sync(candidate))
    }
    fn apply_sync(&mut self, request: &VaultRestoreRequest) -> Result<Capture, String> {
        self.with_native(|n| n.apply_sync(request))
    }
    fn sync_conflict(&mut self, candidate: &str, path: &str) -> Result<SyncConflict, String> {
        self.with_native(|n| n.sync_conflict(candidate, path))
    }
    fn resolve_sync(
        &mut self,
        candidate: &str,
        path: &str,
        resolution: SyncResolution,
    ) -> Result<Checkpoint, String> {
        self.with_native(|n| n.resolve_sync(candidate, path, resolution))
    }
    fn import_remote(&mut self, head: &FetchedHead) -> Result<Checkpoint, String> {
        self.with_native(|native| native.import_remote(head))
    }
    fn restore_remote(&mut self, request: &VaultRestoreRequest) -> Result<Capture, String> {
        self.with_native(|native| native.restore_remote(request))
    }
    fn preview_vault_restore(&mut self, checkpoint: &str) -> Result<VaultRestorePreview, String> {
        self.with_native(|native| native.preview_vault_restore(checkpoint))
    }
    fn restore_vault(&mut self, request: &VaultRestoreRequest) -> Result<Capture, String> {
        self.with_native(|native| native.restore_vault(request))
    }
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
