use lapis_desktop::vault::{VaultManager, admission::VaultAdmissions};

#[test]
fn independent_service_scopes_cannot_grant_or_revoke_each_other() {
    let profile = tempfile::tempdir().unwrap();
    let folder = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let selected = vaults
        .select(Some(folder.path().into()), None)
        .unwrap()
        .unwrap();
    let mut ai = VaultAdmissions::default();
    let mut history = VaultAdmissions::default();
    let plan = ai.prepare(&vaults, "main", &selected.session_id).unwrap();
    let original = ai.complete(&vaults, &plan).unwrap();
    assert!(history.authorize(&vaults, "main").is_err());
    let plan = history
        .prepare(&vaults, "main", &selected.session_id)
        .unwrap();
    assert!(!plan.preserves_workers());
    let repository = history.complete(&vaults, &plan).unwrap();
    assert_ne!(original.generation(), repository.generation());
    assert_eq!(repository.session(), selected.session_id);
    assert_eq!(repository.profile(), selected.profile_id);
    ai.leave("main", false);
    assert!(ai.authorize(&vaults, "main").is_err());
    assert_eq!(
        history.authorize(&vaults, "main").unwrap().generation(),
        repository.generation()
    );
    history.leave("main", false);
    assert!(history.authorize(&vaults, "main").is_err());
}
