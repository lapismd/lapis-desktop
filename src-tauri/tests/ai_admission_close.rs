use lapis_desktop::{vault::VaultManager, vault::admission::VaultAdmissions};
use tempfile::tempdir;

fn activate(registry: &mut VaultAdmissions, vaults: &VaultManager, session: &str) -> String {
    let plan = registry.prepare(vaults, "main", session).unwrap();
    registry
        .complete(vaults, &plan)
        .unwrap()
        .generation()
        .to_owned()
}

#[test]
fn failed_vault_worker_retirement_can_be_retried_until_closure_finishes() {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let closing = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let mut registry = VaultAdmissions::default();
    let original = activate(&mut registry, &vaults, &closing);
    let first = registry.begin_close_vault(&closing);
    assert_eq!(first.len(), 1);
    let next = tempdir().unwrap();
    let next_session = vaults
        .select(Some(next.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let active = activate(&mut registry, &vaults, &next_session);
    assert_eq!(first[0].window, "main");
    assert_eq!(first[0].generation, original);
    assert_ne!(first[0].generation, active);
    assert_eq!(
        registry.begin_close_vault(&closing),
        first,
        "A failed worker cleanup must remain available to the next close attempt"
    );
    assert_eq!(
        registry.authorize(&vaults, "main").unwrap().generation(),
        active
    );
}
