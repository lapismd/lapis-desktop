use lapis_app_core::{services::AgentPolicy, vault::VaultRoot};
use lapis_app_protocol::turns::{TurnCommand, TurnValue};
use lapis_desktop::vault::{VaultManager, services::VaultServices};
use std::sync::Arc;
use tauri_plugin_lapis_ai::{Error, Launch, Result};
struct Policy;
impl AgentPolicy for Policy {
    fn resolve(&self, _: uuid::Uuid, _: &VaultRoot, _: &str) -> Result<Launch> {
        Err(Error("agent_not_admitted"))
    }
}
#[test]
fn selected_native_turn_owner_reopens_after_renderer_detach_and_explicit_disable() {
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let first = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::new(profile.path())
        .unwrap()
        .with_turns(profile.path(), Arc::new(Policy), runtime.handle().clone())
        .unwrap();
    let old = services.client(&vaults, &first.session_id).unwrap();
    assert!(
        matches!(old.call_turn(TurnCommand::List {}).unwrap(), TurnValue::Records { records } if records.is_empty())
    );
    services.detach(&vaults, &first.session_id).unwrap();
    vaults.close(&first.session_id).unwrap();
    let second = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let current = services.client(&vaults, &second.session_id).unwrap();
    assert!(matches!(
        current
            .call_turn(TurnCommand::SetEnabled { enabled: false })
            .unwrap(),
        TurnValue::Availability { enabled: false }
    ));
    assert!(current.call_turn(TurnCommand::Targets {}).is_err());
    current.set_turns_enabled(true).unwrap();
    assert!(
        matches!(current.call_turn(TurnCommand::Targets {}).unwrap(), TurnValue::Targets { targets } if targets.is_empty())
    );
    services.close(&vaults, &second.session_id).unwrap();
    assert!(old.call_turn(TurnCommand::List {}).is_err());
    assert!(current.call_turn(TurnCommand::List {}).is_err());
}
#[test]
fn existing_renderer_profile_does_not_allocate_a_second_native_turn_owner() {
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let descriptor = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::default();
    let client = services.client(&vaults, &descriptor.session_id).unwrap();
    assert!(client.call_turn(TurnCommand::List {}).is_err());
    services.close(&vaults, &descriptor.session_id).unwrap();
}
