use super::backends::NativeBackends;
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::vault::admission::{RetiredAdmission, VaultLease};
use std::{
    io,
    sync::{Arc, OnceLock},
};
use tauri::WebviewWindow;
use tauri_plugin_lapis_ai::{
    AcpHost, Error, HostContext, HostPolicy, Launch, Result, SessionBinding, Target,
    runtime::SessionProcessor,
};

#[derive(Clone, Default)]
pub struct DesktopAiPolicy(Arc<PolicyState>);
#[derive(Default)]
struct PolicyState {
    host: OnceLock<NativeHost>,
    backends: OnceLock<Arc<NativeBackends>>,
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
    pub fn initialize(
        &self,
        host: NativeHost,
        workers: &Arc<AcpHost>,
        backends: Arc<NativeBackends>,
    ) -> io::Result<()> {
        self.0
            .host
            .set(host)
            .map_err(|_| io::Error::other("AI policy is already initialized"))?;
        backends.bind_workers(workers)?;
        self.0
            .backends
            .set(backends)
            .map_err(|_| io::Error::other("AI backend owner is already initialized"))
    }
    fn current(&self, context: &HostContext) -> Result<VaultLease> {
        local(context)?;
        let backends = self.0.backends.get().ok_or(Error("host_unavailable"))?;
        backends
            .ensure_live()
            .map_err(|_| Error("vault_admission_unavailable"))?;
        let host = self.0.host.get().ok_or(Error("host_unavailable"))?;
        let result = {
            let mut services = host.0.lock().map_err(|_| Error("host_unavailable"))?;
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.authorize(vaults, &context.window)
        };
        match result {
            Ok(lease) => {
                backends
                    .ensure_live()
                    .map_err(|_| Error("vault_admission_unavailable"))?;
                Ok(lease)
            }
            Err(failure) => {
                if let Some(retired) = failure.retired {
                    self.retire(retired);
                }
                Err(Error("vault_admission_unavailable"))
            }
        }
    }
    fn retire(&self, retired: RetiredAdmission) {
        if let Some(backends) = self.0.backends.get() {
            backends.retire(retired);
        }
    }
}
impl HostPolicy for DesktopAiPolicy {
    fn authorize(&self, context: &HostContext) -> Result<String> {
        Ok(self.current(context)?.generation().into())
    }
    fn authorize_processing(
        &self,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> Result<String> {
        local(context)?;
        self.0
            .backends
            .get()
            .ok_or(Error("host_unavailable"))?
            .authorize_processing(context, binding)
            .map_err(|_| Error("capture_scope_unavailable"))
    }
    fn targets(&self, context: &HostContext) -> Result<Vec<Target>> {
        self.current(context)?;
        // Executable/credential policy and its native qualification remain gated.
        Ok(vec![])
    }
    fn processor(
        &self,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> Result<Option<Box<dyn SessionProcessor>>> {
        let current = self.current(context)?;
        if current.generation() != binding.admission {
            return Err(Error("admission_revoked"));
        }
        let host = self.0.host.get().ok_or(Error("host_unavailable"))?;
        let _permit = self
            .0
            .backends
            .get()
            .ok_or(Error("host_unavailable"))?
            .register_processing(host, context, binding)
            .map_err(|_| Error("capture_backend_not_admitted"))?;
        Err(Error("capture_backend_not_admitted"))
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
