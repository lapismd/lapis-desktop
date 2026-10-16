use lapis_desktop::system_actions;
use lapis_desktop::vault::VaultRoot;
use std::{fs, io};
use tempfile::tempdir;

#[test]
fn admitted_actions_pin_files_folders_and_root_without_arbitrary_paths() {
    let directory = tempdir().unwrap();
    fs::write(directory.path().join("café.md"), b"note").unwrap();
    fs::create_dir(directory.path().join("Folder")).unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    for path in ["café.md", "Folder", ""] {
        let target = root.action_target(path, true).unwrap();
        assert_eq!(target.verified_path().unwrap(), root.path().join(path));
    }
    assert!(root.action_target("", false).is_err());
    assert_eq!(
        root.action_target("missing", true).err().unwrap().kind(),
        io::ErrorKind::NotFound
    );
    for path in ["../outside", "/absolute", "a/../outside", "a\\outside"] {
        assert!(root.action_target(path, true).is_err());
    }
}

#[cfg(unix)]
#[test]
fn symlink_targets_and_parents_never_become_os_action_authority() {
    let directory = tempdir().unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("note.md"), b"outside").unwrap();
    std::os::unix::fs::symlink(outside.path(), directory.path().join("linked")).unwrap();
    std::os::unix::fs::symlink(
        outside.path().join("note.md"),
        directory.path().join("note.md"),
    )
    .unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    assert!(root.action_target("linked/note.md", true).is_err());
    assert!(root.action_target("note.md", true).is_err());
}

#[cfg(unix)]
#[test]
fn replacement_after_pinning_rejects_before_dispatch() {
    let directory = tempdir().unwrap();
    fs::write(directory.path().join("note.md"), b"selected").unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let target = root.action_target("note.md", false).unwrap();
    fs::rename(
        directory.path().join("note.md"),
        directory.path().join("moved.md"),
    )
    .unwrap();
    fs::write(directory.path().join("note.md"), b"replacement").unwrap();
    assert_eq!(
        target.verified_path().unwrap_err().kind(),
        io::ErrorKind::PermissionDenied
    );
    target
        .validate_path(&directory.path().join("moved.md"))
        .unwrap();
}

#[cfg(unix)]
#[test]
fn replacing_the_displayed_root_cannot_redirect_a_pinned_action() {
    let parent = tempdir().unwrap();
    let path = parent.path().join("vault");
    fs::create_dir(&path).unwrap();
    fs::write(path.join("note.md"), b"selected").unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("note.md"), b"outside").unwrap();
    let root = VaultRoot::open(&path).unwrap();
    let target = root.action_target("note.md", false).unwrap();
    fs::rename(&path, parent.path().join("moved")).unwrap();
    std::os::unix::fs::symlink(outside.path(), &path).unwrap();
    assert!(target.verified_path().is_err());
    assert!(
        root.action_target("note.md", false)
            .unwrap()
            .verified_path()
            .is_err()
    );
}

#[test]
fn absolute_path_conversion_accepts_only_existing_admitted_objects() {
    let directory = tempdir().unwrap();
    fs::write(directory.path().join("café.md"), b"note").unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("secret.md"), b"outside").unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    assert_eq!(
        system_actions::to_relative(&root, root.path().join("café.md").to_str().unwrap()).unwrap(),
        Some("café.md".into())
    );
    assert_eq!(
        system_actions::to_relative(&root, outside.path().join("secret.md").to_str().unwrap())
            .unwrap(),
        None
    );
    assert_eq!(
        system_actions::to_relative(&root, root.path().join("missing.md").to_str().unwrap())
            .unwrap(),
        None
    );
    assert!(system_actions::to_relative(&root, "relative.md").is_err());
    assert!(
        system_actions::to_relative(&root, root.path().join("../outside.md").to_str().unwrap())
            .is_err()
    );
}
