//! Core calls this native policy with an admitted vault/scope capability.
//! It must never acquire NativeHost while the Core acceptance lock is held.
use super::{DesktopAiPolicy, Error, Launch, Result};
use lapis_app_core::{services::AgentPolicy, vault::VaultRoot};
use lapis_app_protocol::turns::TurnTarget;
use uuid::Uuid;

fn default_mode(launch: &Launch) -> Result<&'static str> {
    match launch
        .prepared
        .environment
        .0
        .get("JJ_ACP_RUNNER")
        .map(String::as_str)
    {
        Some("codex") => Ok("read-only"),
        Some("opencode") => Ok("plan"),
        Some(runner) if !runner.trim().is_empty() => Ok("ask"),
        _ => Err(Error("agent_not_admitted")),
    }
}

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
        let Some(ready) = self.turn_profile(vault)? else {
            return Ok(Vec::new());
        };
        ready
            .targets()
            .into_iter()
            .map(|target| {
                let launch = ready
                    .launch(&target.id, scope.path())
                    .map_err(|_| Error("agent_not_admitted"))?
                    .ok_or(Error("agent_not_admitted"))?;
                Ok(TurnTarget {
                    queue_selection: super::native_queue::selection(&launch)?,
                    default_mode: default_mode(&launch)?.into(),
                    id: target.id,
                    label: target.label,
                })
            })
            .collect()
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
        assert_eq!(targets[0].default_mode, "read-only");
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

    #[test]
    fn core_targets_declare_each_trusted_prepared_runners_safe_default() {
        let (temp, settings, home) = super::super::super::file_profile::tests::fixture();
        for command in ["opencode", "cursor-agent"] {
            std::fs::write(temp.path().join("bin").join(command), b"never executed").unwrap();
        }
        let policy = DesktopAiPolicy::default();
        policy.configure_file_profile(settings, home).unwrap();
        let path = temp.path().join("scope");
        std::fs::create_dir(&path).unwrap();
        let scope = VaultRoot::open(&path).unwrap();
        let vault = Uuid::new_v4();
        let targets = AgentPolicy::targets(&policy, vault, &scope).unwrap();
        let modes: std::collections::BTreeMap<_, _> = targets
            .iter()
            .map(|target| (target.id.as_str(), target.default_mode.as_str()))
            .collect();
        assert_eq!(
            modes,
            std::collections::BTreeMap::from([
                ("codex", "read-only"),
                ("cursor", "ask"),
                ("opencode", "plan")
            ])
        );
        for target in targets {
            let launch = AgentPolicy::resolve(&policy, vault, &scope, &target.id).unwrap();
            assert_eq!(launch.prepared.environment.0["JJ_ACP_RUNNER"], target.id);
        }
    }

    #[test]
    fn target_modes_require_the_sealed_runner_without_target_names() {
        let (temp, settings, home) = super::super::super::file_profile::tests::fixture();
        let files = super::super::super::file_profile::FileProfile::default();
        files.configure(settings, home).unwrap();
        files.prepare().unwrap();
        let mut launch = files.launch("codex", temp.path()).unwrap().unwrap();
        for (runner, mode) in [
            ("codex", "read-only"),
            ("opencode", "plan"),
            ("cursor", "ask"),
            ("local", "ask"),
            ("another-admitted-runner", "ask"),
        ] {
            launch
                .prepared
                .environment
                .0
                .insert("JJ_ACP_RUNNER".into(), runner.into());
            assert_eq!(default_mode(&launch).unwrap(), mode);
        }
        for invalid in ["", " "] {
            launch
                .prepared
                .environment
                .0
                .insert("JJ_ACP_RUNNER".into(), invalid.into());
            assert!(default_mode(&launch).is_err());
        }
        launch.prepared.environment.0.remove("JJ_ACP_RUNNER");
        assert!(default_mode(&launch).is_err());
    }
}
