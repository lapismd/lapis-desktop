use super::DesktopAiPolicy;
use lapis_desktop::vault::admission::VaultLease;
use tauri_plugin_lapis_ai::{Error, HostContext, Launch, Result};
use uuid::Uuid;

impl DesktopAiPolicy {
    pub(super) fn managed_launch(
        &self,
        context: &HostContext,
        lease: &VaultLease,
        target: &str,
        resume: Option<&str>,
    ) -> Result<Option<Launch>> {
        let Ok(target) = Uuid::parse_str(target) else {
            return Ok(None);
        };
        if resume.is_some() {
            return Err(Error("resume_not_admitted"));
        }
        // Readiness is checked before claiming. Installation never becomes an
        // implicit launch or a substitute conversation-capture target.
        if !self.0.files.contains("codex") {
            return Err(Error("agent_not_admitted"));
        }
        let backends = self.0.backends.get().ok_or(Error("host_unavailable"))?;
        let host = self.0.host.get().ok_or(Error("host_unavailable"))?;
        backends
            .claim_managed_launch(host, context, target)
            .map_err(|_| Error("capture_backend_not_admitted"))?;
        self.0
            .files
            .launch("codex", lease.root())
            .map_err(|_| Error("agent_not_admitted"))?
            .map(Some)
            .ok_or(Error("agent_not_admitted"))
    }
}
