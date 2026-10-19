use super::DesktopAiPolicy;
use lapis_desktop::{
    ai::tools::{Binding, Owner},
    vault::admission::VaultLease,
};
use std::sync::Arc;
use tauri_plugin_lapis_ai::{Error, HostContext, Launch, Result};
use uuid::Uuid;

const PREFIX: &str = "codex:tools:";
impl DesktopAiPolicy {
    pub(super) fn tool_binding(
        &self,
        context: &HostContext,
        lease: &VaultLease,
        target: &str,
        claim: bool,
    ) -> Result<Option<Arc<Binding>>> {
        let Some(id) = target.strip_prefix(PREFIX) else {
            return Ok(None);
        };
        if !self.0.files.contains("codex") {
            return Err(Error("agent_not_admitted"));
        }
        let id = Uuid::parse_str(id).map_err(|_| Error("agent_not_admitted"))?;
        let owner = Owner {
            window: context.window.clone(),
            session: lease.session().into(),
            generation: lease.generation().into(),
        };
        let registry = &self
            .0
            .backends
            .get()
            .ok_or(Error("host_unavailable"))?
            .tools;
        let binding = if claim {
            registry.claim(id, &owner)
        } else {
            registry.binding(id, &owner)
        }
        .map_err(|_| Error("agent_not_admitted"))?;
        binding.check().map_err(|_| Error("agent_not_admitted"))?;
        Ok(Some(binding))
    }
    pub(super) fn tool_launch(
        &self,
        context: &HostContext,
        lease: &VaultLease,
        target: &str,
        resume: Option<&str>,
    ) -> Result<Option<Launch>> {
        if !target.starts_with(PREFIX) {
            return Ok(None);
        }
        if resume.is_some() {
            return Err(Error("resume_not_admitted"));
        }
        let binding = self
            .tool_binding(context, lease, target, true)?
            .ok_or(Error("agent_not_admitted"))?;
        let (config, environment) = binding.launch().map_err(|_| Error("agent_not_admitted"))?;
        let mut launch = self
            .0
            .files
            .launch("codex", lease.root())
            .map_err(|_| Error("agent_not_admitted"))?
            .ok_or(Error("agent_not_admitted"))?;
        // The session adapter fixes argv; reuse its trusted launch environment.
        launch.prepared.environment.0.insert(
            "JJ_ACP_TOOLS".into(),
            config.to_str().ok_or(Error("agent_not_admitted"))?.into(),
        );
        launch.prepared.environment.0.extend(environment);
        Ok(Some(launch))
    }
}
