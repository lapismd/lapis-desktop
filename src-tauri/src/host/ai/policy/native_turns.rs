//! Core calls this native policy with an admitted vault/scope capability.
//! It must never acquire NativeHost while the Core acceptance lock is held.
use super::{DesktopAiPolicy, Error, Launch, Result};
use lapis_app_core::{services::AgentPolicy, vault::VaultRoot};
use lapis_app_protocol::turns::TurnTarget;
use uuid::Uuid;

impl DesktopAiPolicy {
    fn turn_profile(&self, vault: Uuid) -> Result<Option<super::super::file_profile::Ready>> {
        self.0
            .files
            .snapshot(Some(&vault.to_string()), self.compute_environments())
            .map_err(|_| Error("agent_not_admitted"))
    }
}
impl AgentPolicy for DesktopAiPolicy {
    fn targets(&self, vault: Uuid, scope: &VaultRoot) -> Result<Vec<TurnTarget>> {
        scope
            .verify_physical_root()
            .map_err(|_| Error("vault_admission_unavailable"))?;
        Ok(self
            .turn_profile(vault)?
            .map(|ready| {
                ready
                    .targets()
                    .into_iter()
                    .map(|target| TurnTarget {
                        id: target.id,
                        label: target.label,
                    })
                    .collect()
            })
            .unwrap_or_default())
    }
    fn resolve(&self, vault: Uuid, scope: &VaultRoot, target: &str) -> Result<Launch> {
        scope
            .verify_physical_root()
            .map_err(|_| Error("vault_admission_unavailable"))?;
        self.turn_profile(vault)?
            .ok_or(Error("agent_not_admitted"))?
            .launch(target, scope.path())
            .map_err(|_| Error("agent_not_admitted"))?
            .ok_or(Error("agent_not_admitted"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn core_policy_resolves_only_native_configuration_without_window_host_lock() {
        let (temp, settings, home) = super::super::super::file_profile::tests::fixture();
        let policy = DesktopAiPolicy::default();
        policy
            .configure_file_profile(settings, home.clone())
            .unwrap();
        let path = temp.path().join("admitted-scope");
        std::fs::create_dir(&path).unwrap();
        let scope = VaultRoot::open(&path).unwrap();
        let vault = Uuid::new_v4();
        let targets = AgentPolicy::targets(&policy, vault, &scope).unwrap();
        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].id, "codex");
        let launch = AgentPolicy::resolve(&policy, vault, &scope, "codex").unwrap();
        assert_eq!(launch.directory, scope.path());
        assert_eq!(launch.prepared.directory, scope.path());
        assert_eq!(
            launch.prepared.environment.0["HOME"],
            home.to_str().unwrap()
        );
        assert!(launch.prepared.arguments.is_empty());
        assert!(launch.resume.is_none());
        assert!(AgentPolicy::resolve(&policy, vault, &scope, "local:profile:missing").is_err());
        assert!(AgentPolicy::resolve(&policy, vault, &scope, "../foreign").is_err());
    }
}
