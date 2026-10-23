use lapis_app_core::vault::{TextWriteConflict, VaultRoot, WriteOptions};
use std::fs;
use std::io::{self, Read};
use tempfile::tempdir;

#[test]
fn conditional_writes_match_complete_unicode_contents_and_preserve_metadata() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    fs::write(directory.path().join("café.md"), "# 笔记\n").unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            directory.path().join("café.md"),
            fs::Permissions::from_mode(0o640),
        )
        .unwrap();
    }
    root.write_if_unchanged(
        "café.md",
        "# Updated 🪨\n".as_bytes(),
        Some("# 笔记\n".as_bytes()),
        &WriteOptions {
            mtime: Some(1_700_000_000_000.0),
        },
    )
    .unwrap();
    assert_eq!(root.read_text("café.md").unwrap(), "# Updated 🪨\n");
    assert_eq!(
        root.stat("café.md").unwrap().unwrap().mtime,
        1_700_000_000_000.0
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(directory.path().join("café.md"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o640
        );
    }
}

#[test]
fn stale_contents_or_an_unexpected_file_reject_without_replacement() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    fs::write(directory.path().join("note.md"), "external").unwrap();
    for expected in [
        None,
        Some(b"older".as_slice()),
        Some(b"externaL".as_slice()),
    ] {
        let error = root
            .write_if_unchanged(
                "note.md",
                b"local".as_slice(),
                expected,
                &WriteOptions::default(),
            )
            .unwrap_err();
        assert!(error.get_ref().unwrap().is::<TextWriteConflict>());
        assert_eq!(root.read_text("note.md").unwrap(), "external");
    }
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}

#[test]
fn expected_absence_creates_once_and_a_deleted_baseline_is_not_recreated() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    assert!(
        root.write_if_unchanged(
            "note.md",
            b"local".as_slice(),
            Some(b"old"),
            &WriteOptions::default()
        )
        .is_err()
    );
    assert!(!directory.path().join("note.md").exists());
    root.write_if_unchanged(
        "note.md",
        b"first".as_slice(),
        None,
        &WriteOptions::default(),
    )
    .unwrap();
    assert!(
        root.write_if_unchanged(
            "note.md",
            b"second".as_slice(),
            None,
            &WriteOptions::default()
        )
        .is_err()
    );
    assert_eq!(root.read_text("note.md").unwrap(), "first");
}

struct ChangeDuringStaging<'a> {
    path: &'a std::path::Path,
    done: bool,
}
impl Read for ChangeDuringStaging<'_> {
    fn read(&mut self, output: &mut [u8]) -> io::Result<usize> {
        if self.done {
            return Ok(0);
        }
        self.done = true;
        fs::write(self.path, "external during staging")?;
        output[..5].copy_from_slice(b"local");
        Ok(5)
    }
}

#[test]
fn an_external_change_during_staging_is_checked_again_before_commit() {
    let directory = tempdir().unwrap();
    let path = directory.path().join("note.md");
    let root = VaultRoot::open(directory.path()).unwrap();
    fs::write(&path, "baseline").unwrap();
    let source = ChangeDuringStaging {
        path: &path,
        done: false,
    };
    let error = root
        .write_if_unchanged(
            "note.md",
            source,
            Some(b"baseline"),
            &WriteOptions::default(),
        )
        .unwrap_err();
    assert!(error.get_ref().unwrap().is::<TextWriteConflict>());
    assert_eq!(
        root.read_text("note.md").unwrap(),
        "external during staging"
    );
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}

#[test]
fn conditional_writes_keep_path_and_symlink_containment() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    for path in [
        "../outside",
        "/outside",
        "a/../outside",
        "a\\outside",
        "C:/outside",
    ] {
        assert!(
            root.write_if_unchanged(path, b"bad".as_slice(), None, &WriteOptions::default())
                .is_err()
        );
    }
    #[cfg(unix)]
    {
        let outside = tempdir().unwrap();
        fs::write(outside.path().join("note.md"), "outside").unwrap();
        std::os::unix::fs::symlink(outside.path(), directory.path().join("escape")).unwrap();
        assert!(
            root.write_if_unchanged(
                "escape/note.md",
                b"bad".as_slice(),
                Some(b"outside"),
                &WriteOptions::default()
            )
            .is_err()
        );
        assert_eq!(
            fs::read_to_string(outside.path().join("note.md")).unwrap(),
            "outside"
        );
    }
}

#[test]
fn conditional_snapshots_remain_bounded_and_large_external_files_are_conflicts() {
    use lapis_app_core::vault::MAX_FILE_BYTES;
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    fs::write(directory.path().join("note.md"), b"old").unwrap();
    let expected = vec![0; MAX_FILE_BYTES as usize + 1];
    let error = root
        .write_if_unchanged(
            "note.md",
            b"local".as_slice(),
            Some(&expected),
            &WriteOptions::default(),
        )
        .unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::InvalidInput);
    assert_eq!(root.read_text("note.md").unwrap(), "old");
    drop(expected);
    let external = fs::OpenOptions::new()
        .write(true)
        .open(directory.path().join("note.md"))
        .unwrap();
    external.set_len(MAX_FILE_BYTES + 1).unwrap();
    let error = root
        .write_if_unchanged(
            "note.md",
            b"local".as_slice(),
            Some(b"old"),
            &WriteOptions::default(),
        )
        .unwrap_err();
    assert!(error.get_ref().unwrap().is::<TextWriteConflict>());
    assert_eq!(external.metadata().unwrap().len(), MAX_FILE_BYTES + 1);
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}
