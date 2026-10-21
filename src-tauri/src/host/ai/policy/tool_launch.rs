use super::DesktopAiPolicy;
use lapis_desktop::{
    ai::tools::{Binding, Owner},
    vault::admission::VaultLease,
};
use std::sync::Arc;
use tauri_plugin_lapis_ai::{Error, HostContext, Launch, Result};
use uuid::Uuid;

fn target_parts(target: &str) -> Option<(&str, &str)> {
    let (provider, id) = target.split_once(":tools:")?;
    (matches!(provider, "codex" | "local" | "opencode" | "cursor")
        || super::super::file_profile::local_profile_id(provider).is_some())
    .then_some((provider, id))
}
impl DesktopAiPolicy {
    pub(super) fn tool_binding(
        &self,
        context: &HostContext,
        lease: &VaultLease,
        target: &str,
        claim: bool,
    ) -> Result<Option<Arc<Binding>>> {
        let Some((provider, id)) = target_parts(target) else {
            return Ok(None);
        };
        if claim && !self.0.files.contains(provider) {
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
        let Some((provider, _)) = target_parts(target) else {
            return Ok(None);
        };
        if resume.is_some() {
            return Err(Error("resume_not_admitted"));
        }
        let binding = self
            .tool_binding(context, lease, target, true)?
            .ok_or(Error("agent_not_admitted"))?;
        let (config, environment) = if provider == "cursor" {
            binding.http_launch()
        } else {
            binding.launch()
        }
        .map_err(|_| Error("agent_not_admitted"))?;
        let mut launch = self
            .0
            .files
            .launch(provider, lease.root())
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
