use lapis_desktop::{
    vault::admission::VaultAdmissions,
    vault::{VaultDescriptor, VaultManager},
};
use std::{fs, io};
use tempfile::{TempDir, tempdir};

struct Vaults {
    _profile: TempDir,
    root: TempDir,
    manager: VaultManager,
    selected: VaultDescriptor,
}
fn vaults() -> Vaults {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let selected = manager
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    Vaults {
        _profile: profile,
        root,
        manager,
        selected,
    }
}
fn activate(registry: &mut VaultAdmissions, vaults: &Vaults, window: &str) -> String {
    let plan = registry
        .prepare(&vaults.manager, window, &vaults.selected.session_id)
        .unwrap();
    registry
        .complete(&vaults.manager, &plan)
        .unwrap()
        .generation()
        .to_owned()
}

#[test]
fn admission_requires_a_live_vault_and_a_completed_native_transition() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    assert!(registry.authorize(&vaults.manager, "main").is_err());
    assert!(
        registry
            .prepare(&vaults.manager, "main", "invented")
            .is_err()
    );
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    assert!(!plan.preserves_workers());
    assert!(registry.authorize(&vaults.manager, "main").is_err());
    let lease = registry.complete(&vaults.manager, &plan).unwrap();
    assert_ne!(lease.generation(), vaults.selected.session_id);
    assert_eq!(lease.root(), vaults.root.path().canonicalize().unwrap());
    assert_eq!(
        registry
            .authorize(&vaults.manager, "main")
            .unwrap()
            .generation(),
        lease.generation()
    );
}

#[test]
fn reload_retains_only_the_same_physical_vault_under_a_new_vault_token() {
    let mut vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let generation = activate(&mut registry, &vaults, "main");
    assert!(registry.leave("main", true));
    assert!(
        registry
            .authorize(&vaults.manager, "main")
            .unwrap_err()
            .retired
            .is_none()
    );
    let old = vaults.selected.session_id.clone();
    assert!(registry.begin_close_vault(&old).is_empty());
    vaults.manager.close(&old).unwrap();
    registry.finish_close_vault(&old);
    vaults.selected = vaults
        .manager
        .select(Some(vaults.root.path().into()), None)
        .unwrap()
        .unwrap();
    assert_ne!(vaults.selected.session_id, old);
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    assert!(plan.preserves_workers());
    assert_eq!(
        registry
            .complete(&vaults.manager, &plan)
            .unwrap()
            .generation(),
        generation
    );
}

#[test]
fn explicit_disable_requires_retirement_and_never_resurrects_its_generation() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let original = activate(&mut registry, &vaults, "main");
    assert!(!registry.leave("main", false));
    assert!(
        !registry.leave("main", false),
        "cleanup remains retryable without an entry"
    );
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    assert!(!plan.preserves_workers());
    assert_ne!(
        registry
            .complete(&vaults.manager, &plan)
            .unwrap()
            .generation(),
        original
    );
}

#[test]
fn an_obsolete_async_transition_cannot_activate_or_remove_the_newer_scope() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let first = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    let second = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    assert_ne!(first.generation(), second.generation());
    let current = registry.complete(&vaults.manager, &second).unwrap();
    assert!(registry.complete(&vaults.manager, &first).is_err());
    assert_eq!(
        registry
            .authorize(&vaults.manager, "main")
            .unwrap()
            .generation(),
        current.generation()
    );
}

#[test]
fn invalid_replacement_cannot_evict_a_valid_scope() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let generation = activate(&mut registry, &vaults, "main");
    assert!(
        registry
            .prepare(&vaults.manager, "main", "unadmitted")
            .is_err()
    );
    assert_eq!(
        registry
            .authorize(&vaults.manager, "main")
            .unwrap()
            .generation(),
        generation
    );
}

#[test]
fn reload_cannot_reuse_a_generation_after_the_physical_root_is_replaced() {
    let mut vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let generation = activate(&mut registry, &vaults, "main");
    let profile = vaults.selected.profile_id.clone();
    registry.leave("main", true);
    vaults.manager.close(&vaults.selected.session_id).unwrap();
    let parked = vaults.root.path().with_extension("parked");
    fs::rename(vaults.root.path(), &parked).unwrap();
    fs::create_dir(vaults.root.path()).unwrap();
    vaults.selected = vaults
        .manager
        .select(Some(vaults.root.path().into()), None)
        .unwrap()
        .unwrap();
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    fs::remove_dir_all(parked).unwrap();
    // A different physical vault at the same path gets an independent vault ID.
    assert_ne!(vaults.selected.profile_id, profile);
    assert!(!plan.preserves_workers());
    assert_ne!(
        registry
            .complete(&vaults.manager, &plan)
            .unwrap()
            .generation(),
        generation
    );
}

#[test]
fn physical_replacement_during_a_transition_fails_closed() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    let parked = vaults.root.path().with_extension("parked");
    fs::rename(vaults.root.path(), &parked).unwrap();
    fs::create_dir(vaults.root.path()).unwrap();
    let result = registry.complete(&vaults.manager, &plan);
    fs::remove_dir_all(parked).unwrap();
    assert!(result.is_err());
    assert!(registry.authorize(&vaults.manager, "main").is_err());
}

#[test]
fn stale_live_roots_return_the_exact_retired_generation_once() {
    let mut vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let generation = activate(&mut registry, &vaults, "main");
    vaults.manager.close(&vaults.selected.session_id).unwrap();
    let failure = registry.authorize(&vaults.manager, "main").unwrap_err();
    let retired = failure.retired.unwrap();
    assert_eq!(retired.window, "main");
    assert_eq!(retired.generation, generation);
    assert!(
        registry
            .authorize(&vaults.manager, "main")
            .unwrap_err()
            .retired
            .is_none()
    );
}

#[test]
fn changing_vaults_requires_retirement_and_leaves_other_windows_admitted() {
    let mut vaults = vaults();
    let mut registry = VaultAdmissions::default();
    let main = activate(&mut registry, &vaults, "main");
    let other = activate(&mut registry, &vaults, "other");
    let next = tempdir().unwrap();
    vaults.selected = vaults
        .manager
        .select(Some(next.path().into()), None)
        .unwrap()
        .unwrap();
    let plan = registry
        .prepare(&vaults.manager, "main", &vaults.selected.session_id)
        .unwrap();
    assert!(!plan.preserves_workers());
    assert_ne!(plan.generation(), main);
    assert_eq!(
        registry
            .authorize(&vaults.manager, "other")
            .unwrap()
            .generation(),
        other
    );
    registry.complete(&vaults.manager, &plan).unwrap();
    registry.leave("main", false);
    assert_eq!(
        registry
            .authorize(&vaults.manager, "other")
            .unwrap()
            .generation(),
        other
    );
}

#[test]
fn closing_a_vault_fences_new_transitions_until_native_closure_finishes() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    activate(&mut registry, &vaults, "main");
    let plan = registry
        .prepare(&vaults.manager, "other", &vaults.selected.session_id)
        .unwrap();
    let mut windows = registry.begin_close_vault(&vaults.selected.session_id);
    windows.sort_by(|left, right| left.window.cmp(&right.window));
    assert_eq!(
        windows
            .iter()
            .map(|entry| entry.window.as_str())
            .collect::<Vec<_>>(),
        ["main", "other"]
    );
    assert!(registry.complete(&vaults.manager, &plan).is_err());
    assert!(
        registry
            .prepare(&vaults.manager, "main", &vaults.selected.session_id)
            .is_err()
    );
}

#[test]
fn invalid_window_labels_and_unbounded_admissions_cannot_grow_state() {
    let vaults = vaults();
    let mut registry = VaultAdmissions::default();
    for label in ["", "bad\nwindow", &"x".repeat(257)] {
        assert!(
            registry
                .prepare(&vaults.manager, label, &vaults.selected.session_id)
                .is_err()
        );
    }
    for index in 0..16 {
        activate(&mut registry, &vaults, &format!("window-{index}"));
    }
    let error = registry
        .prepare(&vaults.manager, "overflow", &vaults.selected.session_id)
        .unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::PermissionDenied);
}
