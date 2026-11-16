use lapis_app_core::vault::VaultRoot;
use lapis_desktop::sync::profile::SyncProfile;
use std::path::Path;

fn admitted(path: &Path) -> SyncProfile {
    SyncProfile::open(&VaultRoot::open(path).unwrap()).unwrap()
}
#[test]
fn profile_identity_survives_cold_process_without_modifying_metadata() {
    const ROOT: &str = "LAPIS_SYNC_PROFILE_TEST_ROOT";
    const ID: &str = "LAPIS_SYNC_PROFILE_TEST_ID";
    if let Some(path) = std::env::var_os(ROOT) {
        let profile = admitted(Path::new(&path));
        assert_eq!(profile.id().to_string(), std::env::var(ID).unwrap());
        profile.verify().unwrap();
        return;
    }
    let temp = tempfile::tempdir().unwrap();
    let first = admitted(temp.path());
    let id = first.id();
    let bytes = std::fs::read(temp.path().join("sync/desktop-profile.json")).unwrap();
    assert!(!id.is_nil());
    first.verify().unwrap();
    assert_eq!(admitted(temp.path()).id(), id);
    let output = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "profile_identity_survives_cold_process_without_modifying_metadata",
            "--nocapture",
        ])
        .env(ROOT, temp.path())
        .env(ID, id.to_string())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "cold profile child: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        std::fs::read(temp.path().join("sync/desktop-profile.json")).unwrap(),
        bytes
    );
}
#[test]
fn lost_corrupt_and_foreign_profile_metadata_never_reset_identity() {
    let first = tempfile::tempdir().unwrap();
    let second = tempfile::tempdir().unwrap();
    let original = admitted(first.path());
    let other = admitted(second.path());
    assert_ne!(original.id(), other.id());
    let path = first.path().join("sync/desktop-profile.json");
    let foreign = std::fs::read(second.path().join("sync/desktop-profile.json")).unwrap();
    for bytes in [
        b"private-corrupt-payload".to_vec(),
        vec![b'x'; 4097],
        foreign,
    ] {
        std::fs::write(&path, &bytes).unwrap();
        assert!(original.verify().is_err());
        let error = SyncProfile::open(&VaultRoot::open(first.path()).unwrap())
            .err()
            .unwrap();
        assert!(!error.to_string().contains("private-corrupt-payload"));
        assert_eq!(std::fs::read(&path).unwrap(), bytes);
    }
    std::fs::remove_file(&path).unwrap();
    assert!(SyncProfile::open(&VaultRoot::open(first.path()).unwrap()).is_err());
    assert!(!path.exists());
}
#[test]
fn interrupted_creation_and_replaced_profile_or_sync_roots_refuse() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("profile");
    std::fs::create_dir(&path).unwrap();
    std::fs::create_dir(path.join("sync")).unwrap();
    let root = VaultRoot::open(&path).unwrap();
    assert!(SyncProfile::open(&root).is_err());
    assert!(
        std::fs::read_dir(path.join("sync"))
            .unwrap()
            .next()
            .is_none()
    );
    std::fs::remove_dir(path.join("sync")).unwrap();
    let original = SyncProfile::open(&root).unwrap();
    std::fs::rename(path.join("sync"), path.join("old-sync")).unwrap();
    std::fs::create_dir(path.join("sync")).unwrap();
    assert!(original.verify().is_err());
    assert!(SyncProfile::open(&root).is_err());
    std::fs::rename(&path, temp.path().join("old-profile")).unwrap();
    std::fs::create_dir(&path).unwrap();
    assert!(original.verify().is_err());
    assert!(SyncProfile::open(&root).is_err());
    assert!(std::fs::read_dir(&path).unwrap().next().is_none());
}
#[cfg(unix)]
#[test]
fn profile_directory_and_metadata_symlinks_refuse_without_changing_targets() {
    use std::os::unix::fs::{PermissionsExt, symlink};
    let temp = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();
    let root = VaultRoot::open(temp.path()).unwrap();
    symlink(outside.path(), temp.path().join("sync")).unwrap();
    assert!(SyncProfile::open(&root).is_err());
    assert!(std::fs::read_dir(outside.path()).unwrap().next().is_none());
    std::fs::remove_file(temp.path().join("sync")).unwrap();
    let profile = SyncProfile::open(&root).unwrap();
    assert_eq!(
        std::fs::metadata(temp.path().join("sync"))
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        0o700
    );
    let metadata = temp.path().join("sync/desktop-profile.json");
    let target = outside.path().join("identity.json");
    std::fs::rename(&metadata, &target).unwrap();
    let bytes = std::fs::read(&target).unwrap();
    symlink(&target, &metadata).unwrap();
    assert!(profile.verify().is_err());
    assert!(SyncProfile::open(&root).is_err());
    assert_eq!(std::fs::read(&target).unwrap(), bytes);
    std::fs::remove_file(&metadata).unwrap();
    assert!(
        std::process::Command::new("mkfifo")
            .arg(&metadata)
            .status()
            .unwrap()
            .success()
    );
    assert!(profile.verify().is_err());
    assert!(SyncProfile::open(&root).is_err());
}

#[test]
fn valid_uuid_mutation_cannot_reset_identity_on_cold_admission() {
    let temp = tempfile::tempdir().unwrap();
    let original = admitted(temp.path());
    let path = temp.path().join("sync/desktop-profile.json");
    let original_bytes = std::fs::read(&path).unwrap();
    let mut record: serde_json::Value = serde_json::from_slice(&original_bytes).unwrap();
    record["id"] = serde_json::json!(uuid::Uuid::new_v4());
    std::fs::write(&path, serde_json::to_vec(&record).unwrap()).unwrap();
    assert!(original.verify().is_err());
    assert!(
        SyncProfile::open(&VaultRoot::open(temp.path()).unwrap()).is_err(),
        "cold admission must not accept a replacement UUID in otherwise valid metadata"
    );
    std::fs::write(&path, &original_bytes).unwrap();
    let claim = temp.path().join(".lapis-sync-profile.identity");
    std::fs::write(&claim, uuid::Uuid::new_v4().as_bytes()).unwrap();
    assert!(original.verify().is_err());
    assert!(SyncProfile::open(&VaultRoot::open(temp.path()).unwrap()).is_err());
}

#[test]
fn sync_directory_loss_cannot_allocate_another_profile_identity() {
    let temp = tempfile::tempdir().unwrap();
    let original = admitted(temp.path());
    std::fs::remove_dir_all(temp.path().join("sync")).unwrap();
    assert!(original.verify().is_err());
    assert!(
        SyncProfile::open(&VaultRoot::open(temp.path()).unwrap()).is_err(),
        "lost Sync state must retain profile identity evidence rather than minting another UUID"
    );
    assert!(!temp.path().join("sync").exists());
}
