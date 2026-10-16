use lapis_desktop::vault::{VaultManager, VaultRoot, WriteOptions};
use std::fs;
use std::io::{self, Read};
use tempfile::tempdir;

#[test]
fn cancellation_does_not_admit_or_change_recent_profiles() {
    let profile = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    assert!(manager.select(None, None).unwrap().is_none());
    assert!(manager.recents().is_empty());
    assert!(manager.get("unadmitted").is_err());
}

#[test]
fn unicode_binary_and_modification_time_round_trip_on_disk() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault.mkdir("笔记", true).unwrap();
    vault
        .write(
            "笔记/café 🪨.md",
            "# 日本語\n".as_bytes(),
            &WriteOptions::default(),
        )
        .unwrap();
    assert_eq!(vault.read_text("笔记/café 🪨.md").unwrap(), "# 日本語\n");
    let bytes = [0, 255, 128, 10, 13, 42];
    vault
        .write(
            "image.bin",
            &bytes,
            &WriteOptions {
                mtime: Some(1_700_000_000_000.0),
            },
        )
        .unwrap();
    assert_eq!(fs::read(root.path().join("image.bin")).unwrap(), bytes);
    assert_eq!(vault.read("image.bin").unwrap(), bytes);
    assert_eq!(vault.read_range("image.bin", 1, 3).unwrap(), [255, 128, 10]);
    assert!(vault.read_text("image.bin").is_err());
    assert_eq!(
        vault.stat("image.bin").unwrap().unwrap().mtime,
        1_700_000_000_000.0
    );
    assert_eq!(vault.list("").unwrap().folders, ["笔记"]);
    assert!(vault.stat("missing.md").unwrap().is_none());
}

#[test]
fn absolute_paths_and_parent_components_are_rejected_before_io() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    for path in [
        "/etc/passwd",
        "../escape",
        "a/../../escape",
        "a/./b",
        "C:/outside",
        "a\\b",
        "a\0b",
    ] {
        assert!(vault.read(path).is_err(), "read admitted {path:?}");
        assert!(
            vault.write(path, b"bad", &WriteOptions::default()).is_err(),
            "write admitted {path:?}"
        );
        assert!(vault.mkdir(path, true).is_err(), "mkdir admitted {path:?}");
    }
    assert!(vault.write("", b"bad", &WriteOptions::default()).is_err());
}

#[test]
fn staged_reader_failure_preserves_previous_bytes_and_cleans_staging() {
    struct Interrupted(bool);
    impl Read for Interrupted {
        fn read(&mut self, out: &mut [u8]) -> io::Result<usize> {
            if self.0 {
                return Err(io::Error::other("interrupted source"));
            }
            self.0 = true;
            out[..4].copy_from_slice(b"half");
            Ok(4)
        }
    }
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    fs::write(root.path().join("note.md"), b"previous complete content").unwrap();
    assert!(
        vault
            .write_from("note.md", Interrupted(false), &WriteOptions::default())
            .is_err()
    );
    assert_eq!(
        fs::read(root.path().join("note.md")).unwrap(),
        b"previous complete content"
    );
    assert_eq!(fs::read_dir(root.path()).unwrap().count(), 1);
}

#[test]
fn recent_profiles_survive_restart_and_live_authority_does_not() {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let first = manager
        .select(Some(root.path().to_owned()), None)
        .unwrap()
        .unwrap();
    assert_eq!(manager.recents()[0].id, first.profile_id);
    manager.close(&first.session_id).unwrap();
    assert!(manager.get(&first.session_id).is_err());
    let mut reopened = VaultManager::new(profile.path()).unwrap();
    assert!(reopened.get(&first.session_id).is_err());
    let second = reopened.open_recent(&first.profile_id).unwrap();
    assert_eq!(second.profile_id, first.profile_id);
    assert_ne!(second.session_id, first.session_id);
    assert_ne!(second.resource_token, first.resource_token);
    fs::remove_dir(root.path()).unwrap();
    assert!(reopened.open_recent(&first.profile_id).is_err());
}

#[test]
fn create_rejects_collisions_and_invalid_names_without_overwriting() {
    let profile = tempdir().unwrap();
    let parent = tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let created = manager
        .select(Some(parent.path().to_owned()), Some("新しい Notes"))
        .unwrap()
        .unwrap();
    assert!(parent.path().join("新しい Notes").is_dir());
    assert_eq!(created.name, "新しい Notes");
    fs::write(parent.path().join("新しい Notes/keep.md"), b"keep").unwrap();
    assert!(
        manager
            .select(Some(parent.path().to_owned()), Some("新しい Notes"))
            .is_err()
    );
    for name in ["", "..", "../escape", "a/b", "a\\b", "/absolute"] {
        assert!(
            manager
                .select(Some(parent.path().to_owned()), Some(name))
                .is_err()
        );
    }
    assert_eq!(
        fs::read(parent.path().join("新しい Notes/keep.md")).unwrap(),
        b"keep"
    );
}

#[cfg(unix)]
#[test]
fn symlink_reads_writes_lists_and_new_parents_cannot_escape() {
    use std::os::unix::fs::symlink;
    let root = tempdir().unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("secret"), b"outside").unwrap();
    symlink(outside.path(), root.path().join("linked")).unwrap();
    symlink(outside.path().join("secret"), root.path().join("file-link")).unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    for path in ["linked/secret", "file-link", "linked/new.md"] {
        assert!(vault.read(path).is_err());
        assert!(vault.write(path, b"bad", &WriteOptions::default()).is_err());
    }
    assert!(vault.list("linked").is_err());
    assert!(vault.mkdir("linked/new-dir", true).is_err());
    assert!(vault.list("").unwrap().files.is_empty());
    assert_eq!(fs::read(outside.path().join("secret")).unwrap(), b"outside");
    assert!(!outside.path().join("new.md").exists());
}

#[cfg(unix)]
#[test]
fn permission_failures_preserve_notes_and_existing_modes() {
    use std::os::unix::fs::{MetadataExt, PermissionsExt};
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    let note = root.path().join("note.md");
    fs::write(&note, b"original").unwrap();
    fs::set_permissions(&note, fs::Permissions::from_mode(0o600)).unwrap();
    vault
        .write("note.md", b"saved", &WriteOptions::default())
        .unwrap();
    assert_eq!(fs::metadata(&note).unwrap().mode() & 0o777, 0o600);
    fs::set_permissions(&note, fs::Permissions::from_mode(0o400)).unwrap();
    assert_eq!(
        vault
            .write("note.md", b"bad", &WriteOptions::default())
            .unwrap_err()
            .kind(),
        io::ErrorKind::PermissionDenied
    );
    assert_eq!(fs::read(&note).unwrap(), b"saved");
    fs::create_dir(root.path().join("denied")).unwrap();
    fs::set_permissions(
        root.path().join("denied"),
        fs::Permissions::from_mode(0o500),
    )
    .unwrap();
    assert!(
        vault
            .write("denied/new.md", b"bad", &WriteOptions::default())
            .is_err()
    );
    fs::set_permissions(
        root.path().join("denied"),
        fs::Permissions::from_mode(0o700),
    )
    .unwrap();
}
