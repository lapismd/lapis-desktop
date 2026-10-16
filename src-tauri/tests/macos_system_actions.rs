#![cfg(target_os = "macos")]
use lapis_desktop::{system_actions, vault::VaultRoot};
use objc2::rc::{Retained, autoreleasepool};
use objc2_foundation::{NSFileManager, NSString, NSURL};
use std::{fs, path::PathBuf};
use tempfile::tempdir;

#[test]
fn native_reference_keeps_the_selected_object_after_rename_and_path_replacement() {
    autoreleasepool(|_| {
        let directory = tempdir().unwrap();
        let original = directory.path().join("café.md");
        fs::write(&original, b"selected").unwrap();
        let root = VaultRoot::open(directory.path()).unwrap();
        let target = root.action_target("café.md", false).unwrap();
        let reference = system_actions::file_reference(&target).unwrap();
        assert!(reference.isFileReferenceURL());
        fs::rename(&original, directory.path().join("moved.md")).unwrap();
        fs::write(&original, b"replacement").unwrap();
        let resolved = reference.filePathURL().unwrap().path().unwrap().to_string();
        target.validate_path(&PathBuf::from(resolved)).unwrap();
        assert!(target.verified_path().is_err());
    });
}

#[test]
fn native_reference_rejects_a_replaced_target_before_os_handoff() {
    autoreleasepool(|_| {
        let directory = tempdir().unwrap();
        fs::write(directory.path().join("note.md"), b"selected").unwrap();
        let root = VaultRoot::open(directory.path()).unwrap();
        let target = root.action_target("note.md", false).unwrap();
        fs::rename(
            directory.path().join("note.md"),
            directory.path().join("old.md"),
        )
        .unwrap();
        fs::write(directory.path().join("note.md"), b"replacement").unwrap();
        assert!(system_actions::file_reference(&target).is_err());
    });
}

struct Restore {
    reference: Retained<NSURL>,
    destination: Retained<NSURL>,
    restored: bool,
}
impl Restore {
    fn restore(&mut self) {
        NSFileManager::defaultManager()
            .moveItemAtURL_toURL_error(&self.reference, &self.destination)
            .unwrap();
        self.restored = true;
    }
}
impl Drop for Restore {
    fn drop(&mut self) {
        if !self.restored {
            let _ = NSFileManager::defaultManager()
                .moveItemAtURL_toURL_error(&self.reference, &self.destination);
        }
    }
}

#[test]
fn actual_system_trash_round_trips_only_its_unique_disposable_fixture() {
    autoreleasepool(|_| {
        let directory = tempdir().unwrap();
        let name = format!("lapis-desktop-native-trash-{}.md", uuid::Uuid::new_v4());
        let original = directory.path().join(&name);
        fs::write(&original, b"disposable native acceptance").unwrap();
        let root = VaultRoot::open(directory.path()).unwrap();
        let target = root.action_target(&name, false).unwrap();
        let reference = system_actions::file_reference(&target).unwrap();
        let destination = NSURL::fileURLWithPath(&NSString::from_str(original.to_str().unwrap()));
        let mut restore = Restore {
            reference,
            destination,
            restored: false,
        };
        let receipt = system_actions::trash(&root, &name).unwrap();
        assert!(!original.exists());
        assert!(receipt.is_some());
        restore.restore();
        assert_eq!(
            fs::read(&original).unwrap(),
            b"disposable native acceptance"
        );
        assert!(system_actions::trash(&root, "").is_err());
    });
}
