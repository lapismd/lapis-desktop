use lapis_desktop::vault::{VaultManager, admission::VaultAdmissions};
use tempfile::{TempDir, tempdir};

struct Fixture {
    _profile: TempDir,
    root: TempDir,
    vaults: VaultManager,
    admissions: VaultAdmissions,
    session: String,
    generation: String,
}
impl Fixture {
    fn new() -> Self {
        let profile = tempdir().unwrap();
        let root = tempdir().unwrap();
        let mut vaults = VaultManager::new(profile.path()).unwrap();
        let session = vaults
            .select(Some(root.path().into()), None)
            .unwrap()
            .unwrap()
            .session_id;
        let mut admissions = VaultAdmissions::default();
        let plan = admissions.prepare(&vaults, "main", &session).unwrap();
        assert!(
            admissions
                .authorize_retained(&vaults, "main", plan.generation())
                .is_err()
        );
        let generation = admissions
            .complete(&vaults, &plan)
            .unwrap()
            .generation()
            .into();
        Self {
            _profile: profile,
            root,
            vaults,
            admissions,
            session,
            generation,
        }
    }
    fn retained(&mut self) -> bool {
        self.admissions
            .authorize_retained(&self.vaults, "main", &self.generation)
            .is_ok()
    }
    fn renderer_denied(&mut self) {
        assert!(self.admissions.authorize(&self.vaults, "main").is_err());
    }
}

#[test]
fn retained_native_authority_survives_the_closed_renderer_token_and_preserving_pending_phase() {
    let mut f = Fixture::new();
    assert!(f.retained());
    assert!(f.admissions.leave("main", true));
    f.renderer_denied();
    assert!(f.retained());
    assert!(f.admissions.begin_close_vault(&f.session).is_empty());
    assert!(
        f.retained(),
        "closing the suspended renderer token must retain native capture"
    );
    f.vaults.close(&f.session).unwrap();
    assert!(
        f.retained(),
        "native authority owns its physical witness after renderer closure"
    );
    f.admissions.finish_close_vault(&f.session);
    f.renderer_denied();
    let fresh = f
        .vaults
        .select(Some(f.root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    assert_ne!(fresh, f.session);
    let plan = f.admissions.prepare(&f.vaults, "main", &fresh).unwrap();
    assert!(plan.preserves_workers());
    assert_eq!(plan.generation(), f.generation);
    f.renderer_denied();
    assert!(f.retained());
    let lease = f.admissions.complete(&f.vaults, &plan).unwrap();
    assert_eq!(lease.session(), fresh);
    assert_eq!(lease.generation(), f.generation);
    assert!(f.retained());
    assert!(f.admissions.authorize(&f.vaults, "main").is_ok());
}

#[test]
fn retained_authority_cannot_grant_a_wrong_generation_pending_replacement_or_disabled_scope() {
    let mut f = Fixture::new();
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", "foreign")
            .is_err()
    );
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "other", &f.generation)
            .is_err()
    );
    assert!(f.retained());
    let second = tempdir().unwrap();
    let next = f
        .vaults
        .select(Some(second.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let plan = f.admissions.prepare(&f.vaults, "main", &next).unwrap();
    assert!(!plan.preserves_workers());
    assert!(!f.retained());
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", plan.generation())
            .is_err()
    );
    f.renderer_denied();
    let next_generation = f
        .admissions
        .complete(&f.vaults, &plan)
        .unwrap()
        .generation()
        .to_owned();
    assert!(!f.retained());
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", &next_generation)
            .is_ok()
    );
    f.admissions.leave("main", false);
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", &next_generation)
            .is_err()
    );
}

#[test]
fn retained_physical_failure_after_renderer_closure_retires_only_the_original_generation() {
    let mut f = Fixture::new();
    f.admissions.leave("main", true);
    f.vaults.close(&f.session).unwrap();
    let parked = f.root.path().with_extension("retained-original");
    std::fs::rename(f.root.path(), &parked).unwrap();
    std::fs::create_dir(f.root.path()).unwrap();
    let failure = f
        .admissions
        .authorize_retained(&f.vaults, "main", &f.generation)
        .unwrap_err();
    let retired = failure.retired.unwrap();
    assert_eq!(retired.window, "main");
    assert_eq!(retired.generation, f.generation);
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", &f.generation)
            .unwrap_err()
            .retired
            .is_none()
    );
    let next = f
        .vaults
        .select(Some(f.root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let plan = f.admissions.prepare(&f.vaults, "main", &next).unwrap();
    assert!(!plan.preserves_workers());
    assert_ne!(plan.generation(), f.generation);
    std::fs::remove_dir_all(parked).unwrap();
}

#[test]
fn a_stale_pending_completion_cannot_revoke_the_newer_scope() {
    let mut f = Fixture::new();
    f.admissions.leave("main", true);
    let old = f.admissions.prepare(&f.vaults, "main", &f.session).unwrap();
    assert!(old.preserves_workers());
    assert!(f.retained());
    let replacement = f.admissions.prepare(&f.vaults, "main", &f.session).unwrap();
    assert!(!replacement.preserves_workers());
    let generation = f
        .admissions
        .complete(&f.vaults, &replacement)
        .unwrap()
        .generation()
        .to_owned();
    assert!(f.admissions.complete(&f.vaults, &old).is_err());
    assert!(
        f.admissions
            .authorize_retained(&f.vaults, "main", &generation)
            .is_ok()
    );
    assert!(!f.retained());
}
