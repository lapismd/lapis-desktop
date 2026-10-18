use super::*;
use crate::vault::{VaultManager, admission::VaultAdmissions};
use cap_std::ambient_authority;
use std::sync::Mutex;

#[test]
fn dropping_a_native_lease_releases_its_lock_even_while_a_kernel_descriptor_duplicate_exists() {
    let profile = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let session = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let mut admissions = VaultAdmissions::default();
    let plan = admissions.prepare(&vaults, "main", &session).unwrap();
    admissions.complete(&vaults, &plan).unwrap();
    let state = Mutex::new((vaults, admissions));
    let profiles = BackendProfiles::new(
        Dir::open_ambient_dir(profile.path(), ambient_authority()).unwrap(),
        Arc::new(move || {
            let mut state = state.lock().unwrap();
            let (vaults, admissions) = &mut *state;
            admissions
                .authorize(vaults, "main")
                .map_err(|failure| failure.error)
        }),
    )
    .unwrap();
    let lease = profiles.context.lock().unwrap();
    // Concurrent native process launch can briefly inherit a kernel duplicate
    // before close-on-exec. That descriptor is not a native service owner.
    let duplicate = lease.file.try_clone().unwrap();
    assert!(profiles.context.lock().is_err());
    drop(lease);
    let replacement = profiles
        .context
        .lock()
        .expect("the logical lease must release its lock");
    assert!(duplicate.metadata().is_ok());
    drop(duplicate);
    assert!(profiles.context.lock().is_err());
    drop(replacement);
    assert!(profiles.context.lock().is_ok());
}
