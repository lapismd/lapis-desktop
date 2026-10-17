use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::ai::admission::{AiLease, RetiredAdmission};
use std::{
    io,
    sync::{Arc, OnceLock, Weak},
};
use tauri::WebviewWindow;
use tauri_plugin_lapis_ai::{AcpHost, Error, HostContext, HostPolicy, Launch, Result, Target};

#[derive(Clone, Default)]
pub struct DesktopAiPolicy(Arc<PolicyState>);
#[derive(Default)]
struct PolicyState {
    host: OnceLock<NativeHost>,
    workers: OnceLock<Weak<AcpHost>>,
}
pub fn local(context: &HostContext) -> Result<()> {
    let url = url::Url::parse(&context.url).map_err(|_| Error("denied"))?;
    if context.window != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(Error("denied"));
    }
    Ok(())
}
pub fn caller(window: &WebviewWindow) -> Result<HostContext> {
    let context = HostContext {
        window: window.label().into(),
        url: window.url().map_err(|_| Error("denied"))?.to_string(),
    };
    local(&context)?;
    Ok(context)
}
impl DesktopAiPolicy {
    pub fn initialize(&self, host: NativeHost, workers: &Arc<AcpHost>) -> io::Result<()> {
        self.0
            .host
            .set(host)
            .map_err(|_| io::Error::other("AI policy is already initialized"))?;
        self.0
            .workers
            .set(Arc::downgrade(workers))
            .map_err(|_| io::Error::other("AI worker owner is already initialized"))
    }
    fn current(&self, context: &HostContext) -> Result<AiLease> {
        local(context)?;
        let host = self.0.host.get().ok_or(Error("host_unavailable"))?;
        let result = {
            let mut services = host.0.lock().map_err(|_| Error("host_unavailable"))?;
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.authorize(vaults, &context.window)
        };
        match result {
            Ok(lease) => Ok(lease),
            Err(failure) => {
                if let Some(retired) = failure.retired {
                    self.retire(retired);
                }
                Err(Error("vault_admission_unavailable"))
            }
        }
    }
    fn retire(&self, retired: RetiredAdmission) {
        if let Some(workers) = self.0.workers.get().and_then(Weak::upgrade) {
            tauri::async_runtime::spawn(async move {
                if let Err(error) = workers
                    .revoke(&retired.window, Some(&retired.generation))
                    .await
                {
                    eprintln!("Native AI scope cleanup failed: {error}");
                }
            });
        }
    }
}
impl HostPolicy for DesktopAiPolicy {
    fn authorize(&self, context: &HostContext) -> Result<String> {
        Ok(self.current(context)?.generation().into())
    }
    fn targets(&self, context: &HostContext) -> Result<Vec<Target>> {
        self.current(context)?;
        // Executable/credential policy and its native qualification remain gated.
        Ok(vec![])
    }
    fn resolve(
        &self,
        context: &HostContext,
        _target: &str,
        _resume: Option<&str>,
    ) -> Result<Launch> {
        self.current(context)?;
        Err(Error("agent_not_admitted"))
    }
}

#[cfg(test)]
mod tests;
