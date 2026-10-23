use lapis_app_core::vault::{VaultRoot, WriteOptions};
use std::{fs, io};
use tempfile::tempdir;

#[test]
fn unicode_files_and_nested_folders_move_without_replacing_destinations() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault.mkdir("Notes", false).unwrap();
    vault.mkdir("Archive", false).unwrap();
    vault
        .write("Notes/café.md", b"draft", &WriteOptions::default())
        .unwrap();
    vault.rename("Notes/café.md", "Archive/笔记.md").unwrap();
    assert!(vault.stat("Notes/café.md").unwrap().is_none());
    assert_eq!(vault.read("Archive/笔记.md").unwrap(), b"draft");
    vault.rename("Archive", "Moved").unwrap();
    assert_eq!(vault.read("Moved/笔记.md").unwrap(), b"draft");
    vault.rename("Moved/笔记.md", "Moved/笔记.md").unwrap();
    assert!(vault.rename("missing", "missing").is_err());
}

#[test]
fn rename_and_copy_collisions_preserve_both_files_and_copy_is_complete() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault
        .write("a.md", b"source", &WriteOptions::default())
        .unwrap();
    vault
        .write("b.md", b"destination", &WriteOptions::default())
        .unwrap();
    assert_eq!(
        vault.rename("a.md", "b.md").unwrap_err().kind(),
        io::ErrorKind::AlreadyExists
    );
    assert_eq!(
        vault.copy_file("a.md", "b.md").unwrap_err().kind(),
        io::ErrorKind::AlreadyExists
    );
    assert_eq!(vault.read("a.md").unwrap(), b"source");
    assert_eq!(vault.read("b.md").unwrap(), b"destination");
    vault.copy_file("a.md", "café.md").unwrap();
    assert_eq!(vault.read("café.md").unwrap(), b"source");
    assert_eq!(fs::read_dir(root.path()).unwrap().count(), 3);
}

#[test]
fn file_and_directory_removal_have_distinct_nonrecursive_semantics() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault.mkdir("Folder/Nested", true).unwrap();
    vault
        .write("Folder/Nested/note.md", b"body", &WriteOptions::default())
        .unwrap();
    assert_eq!(
        vault.remove_file("Folder").unwrap_err().kind(),
        io::ErrorKind::IsADirectory
    );
    assert!(vault.remove_directory("Folder", false).is_err());
    assert_eq!(vault.read("Folder/Nested/note.md").unwrap(), b"body");
    assert_eq!(
        vault
            .remove_directory("Folder/Nested/note.md", true)
            .unwrap_err()
            .kind(),
        io::ErrorKind::NotADirectory
    );
    vault.remove_file("Folder/Nested/note.md").unwrap();
    vault.remove_directory("Folder/Nested", false).unwrap();
    vault
        .write("Folder/other.md", b"other", &WriteOptions::default())
        .unwrap();
    vault.remove_directory("Folder", true).unwrap();
    assert!(vault.stat("Folder").unwrap().is_none());
    assert!(vault.remove_directory("", true).is_err());
    assert!(vault.remove_file("").is_err());
}

#[cfg(unix)]
#[test]
fn mutation_paths_and_symlink_parents_cannot_escape_the_admission() {
    use std::os::unix::fs::symlink;
    let root = tempdir().unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("keep.md"), b"outside").unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault
        .write("note.md", b"inside", &WriteOptions::default())
        .unwrap();
    symlink(outside.path(), root.path().join("linked")).unwrap();
    for path in [
        "../keep.md",
        "/absolute",
        "linked/keep.md",
        "a/../b",
        "a\\b",
        "",
    ] {
        assert!(vault.rename("note.md", path).is_err());
        assert!(vault.rename(path, "moved.md").is_err());
        assert!(vault.copy_file("note.md", path).is_err());
        assert!(vault.copy_file(path, "copy.md").is_err());
        assert!(vault.remove_file(path).is_err());
        assert!(vault.remove_directory(path, true).is_err());
    }
    assert_eq!(vault.read("note.md").unwrap(), b"inside");
    assert_eq!(
        fs::read(outside.path().join("keep.md")).unwrap(),
        b"outside"
    );
}

#[cfg(unix)]
#[test]
fn recursive_remove_does_not_follow_nested_symlinks_and_copy_preserves_mode() {
    use std::os::unix::fs::{MetadataExt, PermissionsExt, symlink};
    let root = tempdir().unwrap();
    let outside = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    fs::write(outside.path().join("keep.md"), b"outside").unwrap();
    vault.mkdir("Folder", false).unwrap();
    symlink(outside.path(), root.path().join("Folder/linked")).unwrap();
    vault.remove_directory("Folder", true).unwrap();
    assert_eq!(
        fs::read(outside.path().join("keep.md")).unwrap(),
        b"outside"
    );
    vault
        .write("source.bin", &[0, 255, 7], &WriteOptions::default())
        .unwrap();
    fs::set_permissions(
        root.path().join("source.bin"),
        fs::Permissions::from_mode(0o640),
    )
    .unwrap();
    vault.copy_file("source.bin", "copy.bin").unwrap();
    assert_eq!(vault.read("copy.bin").unwrap(), [0, 255, 7]);
    assert_eq!(
        fs::metadata(root.path().join("copy.bin")).unwrap().mode() & 0o777,
        0o640
    );
}

#[test]
fn case_only_rename_keeps_the_existing_note_and_updates_its_entry_name() {
    let root = tempdir().unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    vault
        .write("Note.md", b"body", &WriteOptions::default())
        .unwrap();
    vault.rename("Note.md", "note.md").unwrap();
    assert_eq!(vault.list("").unwrap().files, ["note.md"]);
    assert_eq!(vault.read("note.md").unwrap(), b"body");
}

#[test]
fn competing_copies_publish_exactly_one_complete_destination_and_leave_no_stages() {
    use std::sync::{Arc, Barrier};
    let root = tempdir().unwrap();
    fs::write(root.path().join("one.bin"), vec![1_u8; 128 * 1024]).unwrap();
    fs::write(root.path().join("two.bin"), vec![2_u8; 128 * 1024]).unwrap();
    let barrier = Arc::new(Barrier::new(2));
    let tasks: Vec<_> = ["one.bin", "two.bin"]
        .into_iter()
        .map(|source| {
            let path = root.path().to_owned();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                let vault = VaultRoot::open(&path).unwrap();
                barrier.wait();
                vault.copy_file(source, "winner.bin")
            })
        })
        .collect();
    let results: Vec<_> = tasks.into_iter().map(|t| t.join().unwrap()).collect();
    assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        results.into_iter().find_map(Result::err).unwrap().kind(),
        io::ErrorKind::AlreadyExists
    );
    let winner = fs::read(root.path().join("winner.bin")).unwrap();
    assert!(winner == vec![1_u8; 128 * 1024] || winner == vec![2_u8; 128 * 1024]);
    assert_eq!(fs::read_dir(root.path()).unwrap().count(), 3);
}

#[test]
fn bounded_copy_failure_preserves_existing_files_and_leaves_no_partial_destination() {
    let root = tempdir().unwrap();
    let oversized = fs::File::create(root.path().join("large.bin")).unwrap();
    oversized
        .set_len(lapis_app_core::vault::MAX_FILE_BYTES + 1)
        .unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    assert_eq!(
        vault.copy_file("large.bin", "copy.bin").unwrap_err().kind(),
        io::ErrorKind::InvalidInput
    );
    assert!(!root.path().join("copy.bin").exists());
    assert_eq!(fs::read_dir(root.path()).unwrap().count(), 1);
}
