//! Local ACP admission and tool lifetime. No conversation database is opened here.
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::vault::admission::{RetiredAdmission, VaultLease};
use std::{
    io,
    sync::{
        Arc, OnceLock, Weak,
        atomic::{AtomicBool, Ordering},
    },
};
use tauri::Manager;
use tauri_plugin_lapis_ai::AcpHost;

#[derive(Default)]
pub struct NativeAiOwner {
    pub tools: lapis_desktop::ai::tools::Registry,
    pub turns: super::turns::Retained,
    pub transitions: Arc<tokio::sync::Mutex<()>>,
    pub compute: OnceLock<Arc<lapis_desktop::ai::compute::Compute>>,
    workers: OnceLock<Weak<AcpHost>>,
    destroyed: AtomicBool,
}
fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Local AI admission is unavailable",
    )
}
pub fn initialize(app: &tauri::AppHandle) -> io::Result<()> {
    if app.manage(Arc::new(NativeAiOwner::default())) {
        Ok(())
    } else {
        Err(denied())
    }
}
impl NativeAiOwner {
    pub fn ensure_live(&self) -> io::Result<()> {
        if self.destroyed.load(Ordering::SeqCst) {
            Err(denied())
        } else {
            Ok(())
        }
    }
    pub fn bind_workers(&self, workers: &Arc<AcpHost>) -> io::Result<()> {
        self.workers
            .set(Arc::downgrade(workers))
            .map_err(|_| denied())
    }
    pub fn suspend(&self, _window: &str) -> io::Result<()> {
        self.ensure_live()
    }
    pub fn fence(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        if window == "main"
            && let Some(compute) = self.compute.get()
        {
            compute.fence(generation)?;
        }
        self.tools.fence(window, generation)
    }
    pub async fn drain(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        self.turns.drain(window, generation).await?;
        self.tools.drain(window, generation).await?;
        if window == "main"
            && let Some(compute) = self.compute.get()
        {
            compute.shutdown(generation).await?;
        }
        Ok(())
    }
    pub fn destroy_window(&self, window: &str) -> io::Result<()> {
        if window == "main" {
            self.destroyed.store(true, Ordering::SeqCst);
        }
        self.fence(window, None)
    }
    pub(super) fn current(
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
    pub(super) fn retained(
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
    pub fn retire(self: &Arc<Self>, retired: RetiredAdmission) {
        if let Err(error) = self.fence(&retired.window, Some(&retired.generation)) {
            eprintln!("Local AI fence failed: {error}");
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
                eprintln!("Local AI cleanup failed: {error}");
            }
        });
    }
}
pub async fn revoke(
    workers: &AcpHost,
    owner: &NativeAiOwner,
    window: &str,
    generation: Option<&str>,
) -> io::Result<()> {
    owner.fence(window, generation)?;
    workers
        .revoke(window, generation)
        .await
        .map_err(|e| io::Error::other(e.to_string()))?;
    owner.drain(window, generation).await
}
