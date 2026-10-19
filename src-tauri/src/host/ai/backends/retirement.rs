use super::{NativeBackends, Ordering, denied, revoke};
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::vault::admission::{RetiredAdmission, VaultLease};
use std::{
    io,
    sync::{Arc, Weak},
};
use tauri_plugin_lapis_ai::AcpHost;

impl NativeBackends {
    pub fn ensure_live(&self) -> io::Result<()> {
        if self.destroyed.load(Ordering::SeqCst) {
            return Err(denied());
        }
        Ok(())
    }
    pub fn destroy_window(&self, window: &str) -> io::Result<()> {
        if window == "main" {
            self.destroyed.store(true, Ordering::SeqCst);
        }
        self.fence(window, None)
    }
    pub fn bind_workers(&self, workers: &Arc<AcpHost>) -> io::Result<()> {
        self.workers
            .set(Arc::downgrade(workers))
            .map_err(|_| io::Error::other("Backend worker owner is already initialized"))
    }
    pub(in crate::host::ai) fn current(
        self: &Arc<Self>,
        host: &NativeHost,
        window: &str,
    ) -> io::Result<VaultLease> {
        self.ensure_live()?;
        let result = {
            let mut services = host.0.lock().map_err(|_| denied())?;
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.authorize(vaults, window)
        };
        match result {
            Ok(lease) => {
                self.ensure_live()?;
                Ok(lease)
            }
            Err(failure) => {
                if let Some(retired) = failure.retired {
                    self.retire(retired);
                }
                Err(failure.error)
            }
        }
    }
    pub fn retire(self: &Arc<Self>, retired: RetiredAdmission) {
        if let Err(error) = self.fence(&retired.window, Some(&retired.generation)) {
            eprintln!("Native backend fence failed: {error}");
        }
        let owner = self.clone();
        let workers = self.workers.get().and_then(Weak::upgrade);
        tauri::async_runtime::spawn(async move {
            let _transition = owner.transitions.lock().await;
            let result = if let Some(workers) = workers {
                revoke(&workers, &owner, &retired.window, Some(&retired.generation)).await
            } else {
                owner
                    .drain(&retired.window, Some(&retired.generation))
                    .await
            };
            if let Err(error) = result {
                eprintln!("Native backend cleanup failed: {error}");
            }
        });
    }
    pub(in crate::host::ai) fn retained(
        self: &Arc<Self>,
        host: &NativeHost,
        window: &str,
        generation: &str,
    ) -> io::Result<VaultLease> {
        self.ensure_live()?;
        let result = {
            let mut services = host.0.lock().map_err(|_| denied())?;
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.authorize_retained(vaults, window, generation)
        };
        match result {
            Ok(lease) => {
                self.ensure_live()?;
                Ok(lease)
            }
            Err(failure) => {
                if let Some(retired) = failure.retired {
                    self.retire(retired);
                }
                Err(failure.error)
            }
        }
    }
}
