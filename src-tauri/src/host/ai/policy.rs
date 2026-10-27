use super::owner::NativeAiOwner;
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
mod native_queue;
mod native_turns;
mod tool_launch;

#[derive(Clone, Default)]
pub struct DesktopAiPolicy(Arc<PolicyState>);
#[derive(Default)]
struct PolicyState {
    host: OnceLock<NativeHost>,
    backends: OnceLock<Arc<NativeAiOwner>>,
    files: super::file_profile::FileProfile,
    turn_owner: OnceLock<super::turns::TurnOwner>,
    compute: OnceLock<Arc<lapis_desktop::ai::compute::Compute>>,
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
    pub fn select_turn_owner(&self, owner: super::turns::TurnOwner) -> io::Result<()> {
        self.0
            .turn_owner
            .set(owner)
            .map_err(|_| io::Error::other("AI owner already selected"))
    }

    pub fn configure_file_profile(
        &self,
        settings: std::path::PathBuf,
        home: std::path::PathBuf,
    ) -> io::Result<()> {
        let profile = settings
            .parent()
            .ok_or_else(|| io::Error::other("AI profile unavailable"))?
            .to_owned();
        self.0
            .compute
            .set(Arc::new(lapis_desktop::ai::compute::Compute::open(
                profile.clone(),
                lapis_desktop::ai::configuration::device_secrets(&profile),
            )?))
            .map_err(|_| io::Error::other("Compute already configured"))?;
        self.0.files.configure(settings, home)
    }
    #[cfg(not(feature = "e2e"))]
    pub fn configure_bundle(&self, bundle: std::path::PathBuf) -> io::Result<()> {
        self.0.files.configure_bundle(bundle)
    }
    pub fn bundle_ready(&self) -> bool {
        self.0.files.bundle_ready()
    }
    #[cfg(test)]
    pub fn prepare_file_profile(&self) -> io::Result<()> {
        self.prepare_for_vault(None)
    }
    pub fn prepare_for_vault(&self, vault: Option<&str>) -> io::Result<()> {
        self.0
            .files
            .prepare_profiles(vault, self.compute_environments())
    }
    fn compute_environments(
        &self,
    ) -> std::collections::BTreeMap<String, Option<std::collections::BTreeMap<String, String>>>
    {
        let compute = self.compute().ok();
        ["local", "paired"]
            .into_iter()
            .map(|id| {
                (
                    id.to_owned(),
                    compute
                        .as_ref()
                        .and_then(|c| c.environment(id == "paired").ok()),
                )
            })
            .collect()
    }
    pub fn providers(&self) -> io::Result<lapis_desktop::ai::configuration::ProviderStore> {
        self.0.files.providers()
    }
    pub fn compute(&self) -> io::Result<Arc<lapis_desktop::ai::compute::Compute>> {
        self.0
            .compute
            .get()
            .cloned()
            .ok_or_else(|| io::Error::other("Compute unavailable"))
    }
    pub fn compute_plan(&self) -> io::Result<tauri_plugin_lapis_ai::runtime::PreparedLaunch> {
        self.0.files.compute_plan()
    }
    pub fn initialize(
        &self,
        host: NativeHost,
        workers: &Arc<AcpHost>,
        backends: Arc<NativeAiOwner>,
    ) -> io::Result<()> {
        self.0
            .host
            .set(host)
            .map_err(|_| io::Error::other("AI policy is already initialized"))?;
        backends.bind_workers(workers)?;
        if let Some(compute) = self.0.compute.get() {
            backends
                .compute
                .set(compute.clone())
                .map_err(|_| io::Error::other("Compute already bound"))?;
        }
        self.0
            .backends
            .set(backends)
            .map_err(|_| io::Error::other("AI backend owner is already initialized"))
    }
    fn current(&self, context: &HostContext) -> Result<VaultLease> {
        local(context)?;
        if self.0.turn_owner.get().is_some_and(|owner| owner.is_core()) {
            return Err(Error("renderer_execution_disabled"));
        }
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
        let lease = self.current(context)?;
        if lease.generation() != binding.admission {
            return Err(Error("admission_revoked"));
        }
        if !self.0.files.retains(&binding.target_id)
            && self
                .tool_binding(context, &lease, &binding.target_id, false)?
                .is_none()
        {
            return Err(Error("agent_not_admitted"));
        }
        Ok(lease.generation().into())
    }

    fn targets(&self, context: &HostContext) -> Result<Vec<Target>> {
        self.current(context)?;
        Ok(self.0.files.targets())
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
        // This explicit profile uses the existing local transcript writer. It
        // does not construct a JJ capture processor or publish store metadata.
        if self.0.files.retains(&binding.target_id)
            || self
                .tool_binding(context, &current, &binding.target_id, false)?
                .is_some()
        {
            return Ok(None);
        }
        Err(Error("agent_not_admitted"))
    }

    fn resolve(&self, context: &HostContext, target: &str, resume: Option<&str>) -> Result<Launch> {
        let current = self.current(context)?;
        if let Some(launch) = self.tool_launch(context, &current, target, resume)? {
            return Ok(launch);
        }
        if resume.is_some() && self.0.files.contains(target) {
            return Err(Error("resume_not_admitted"));
        }
        self.0
            .files
            .launch(target, current.root())
            .map_err(|_| Error("agent_not_admitted"))?
            .ok_or(Error("agent_not_admitted"))
    }
}

#[cfg(test)]
mod tests;
