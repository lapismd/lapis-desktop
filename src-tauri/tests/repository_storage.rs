use jj_store_jj::vault_workspace::Session;
use jj_vault::StorageLocation;
use lapis_desktop::{repository::storage::Locations, vault::VaultManager};
use std::fs;

#[test]
fn storage_resolution_retains_native_history_across_layout_changes_and_reopen() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().canonicalize().unwrap();
            let notes = root.join("notes");
            fs::create_dir(&notes).unwrap();
            fs::write(notes.join("Note.md"), "Retain this version").unwrap();
            let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
            let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
            let locations = Locations::new(root.join("history"));
            let external = locations.binding(&vault).unwrap();
            assert!(
                !external.state.exists(),
                "read-only resolution creates no state"
            );
            let mut native = Session::open(locations.recover(&vault).await.unwrap())
                .await
                .unwrap();
            let saved = native
                .capture(&[], "Original checkpoint")
                .await
                .unwrap()
                .checkpoint
                .unwrap();
            drop(native);
            locations
                .storage(&vault)
                .change(0, StorageLocation::Colocated, "move-root")
                .await
                .unwrap();
            let selected = locations.binding(&vault).unwrap();
            assert_eq!(selected.state, notes.join(".jj"));
            assert!(!external.state.exists());
            drop(vaults);
            let mut reopened = VaultManager::new(&root.join("profile")).unwrap();
            let vault = reopened.open_recent(&vault.profile_id).unwrap();
            let locations = Locations::new(root.join("history"));
            let selected = locations.recover(&vault).await.unwrap();
            assert_eq!(
                Session::open(selected)
                    .await
                    .unwrap()
                    .checkpoint()
                    .unwrap()
                    .unwrap()
                    .commit,
                saved.commit
            );
            locations
                .storage(&vault)
                .change(1, StorageLocation::External, "move-back")
                .await
                .unwrap();
            assert_eq!(locations.binding(&vault).unwrap().state, external.state);
            assert!(!notes.join(".jj").exists());
            assert_eq!(
                fs::read_to_string(notes.join("Note.md")).unwrap(),
                "Retain this version"
            );
        });
}

#[test]
fn read_only_resolution_refuses_pending_moves_and_startup_recovers_the_original_request() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().canonicalize().unwrap();
            let notes = root.join("notes");
            fs::create_dir(&notes).unwrap();
            let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
            let vault = vaults.select(Some(notes), None).unwrap().unwrap();
            let locations = Locations::new(root.join("history"));
            let mut native = Session::open(locations.recover(&vault).await.unwrap())
                .await
                .unwrap();
            let commit = native
                .capture(&[], "Original")
                .await
                .unwrap()
                .checkpoint
                .unwrap()
                .commit;
            drop(native);
            assert!(
                locations
                    .storage(&vault)
                    .change_with(0, StorageLocation::Colocated, "original-move", |progress| {
                        if progress.phase == "archived" {
                            Err(jj_store_jj::vault_workspace::Error::Busy)
                        } else {
                            Ok(())
                        }
                    })
                    .await
                    .is_err()
            );
            assert!(locations.binding(&vault).is_err());
            let recovered = locations.recover(&vault).await.unwrap();
            assert_eq!(
                Session::open(recovered)
                    .await
                    .unwrap()
                    .checkpoint()
                    .unwrap()
                    .unwrap()
                    .commit,
                commit
            );
            assert!(
                locations
                    .storage(&vault)
                    .status()
                    .unwrap()
                    .pending
                    .is_none()
            );
        });
}

#[test]
fn backup_watches_skip_large_metadata_trees_and_do_not_react_to_their_own_writes() {
    use lapis_desktop::watch::{WatchOptions, WatchRegistry};
    use std::{
        sync::{Arc, Mutex, mpsc},
        time::Duration,
    };
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let notes = root.join("notes");
    fs::create_dir(&notes).unwrap();
    fs::write(notes.join("Note.md"), "first").unwrap();
    fs::create_dir(notes.join(".jj")).unwrap();
    for number in 0..2100 {
        fs::write(notes.join(format!(".jj/{number}")), "metadata").unwrap();
    }
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
    let (sender, receiver) = mpsc::channel();
    let mut watches = WatchRegistry::default();
    let id = watches
        .start_filtered(
            &vault.session_id,
            vaults.get(&vault.session_id).unwrap(),
            WatchOptions {
                scope: String::new(),
                recursive: true,
                ignored_names: vec![".jj".into(), ".git".into(), ".lapis".into()],
            },
            Arc::new(Mutex::new(())),
            move |batch| sender.send(batch).is_ok(),
        )
        .unwrap();
    fs::write(notes.join(".jj/0"), "updated native metadata").unwrap();
    assert!(
        receiver.recv_timeout(Duration::from_millis(250)).is_err(),
        "metadata writes must not schedule another capture"
    );
    fs::write(notes.join("Note.md"), "second").unwrap();
    let batch = receiver.recv_timeout(Duration::from_secs(3)).unwrap();
    assert!(batch.error.is_none());
    assert!(batch.changes.iter().any(|change| change.path == "Note.md"));
    assert!(
        batch
            .changes
            .iter()
            .all(|change| !change.path.starts_with(".jj"))
    );
    watches.close(&vault.session_id, &id).unwrap();
}

#[test]
fn storage_display_and_reveal_only_use_the_native_selected_current_directory() {
    use lapis_desktop::repository::storage::{reveal_path, view};
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let notes = base.join("notes");
    fs::create_dir(&notes).unwrap();
    let mut vaults = VaultManager::new(&base.join("profile")).unwrap();
    let vault = vaults.select(Some(notes), None).unwrap().unwrap();
    let locations = Locations::new(base.join("history"));
    let storage = locations.storage(&vault);
    let expected = locations.binding(&vault).unwrap().metadata();
    let empty = view(&storage).unwrap();
    assert_eq!(empty.repository_path, expected.to_str().unwrap());
    assert!(!empty.can_reveal);
    assert!(!expected.exists(), "display does not initialize history");
    fs::create_dir_all(&expected).unwrap();
    assert!(view(&storage).unwrap().can_reveal);
    assert_eq!(reveal_path(&storage, 0).unwrap(), expected);
    assert!(
        reveal_path(&storage, 1).is_err(),
        "stale revision cannot reveal another layout"
    );
    #[cfg(unix)]
    {
        fs::remove_dir(&expected).unwrap();
        let elsewhere = base.join("elsewhere");
        fs::create_dir(&elsewhere).unwrap();
        std::os::unix::fs::symlink(&elsewhere, &expected).unwrap();
        assert!(!view(&storage).unwrap().can_reveal);
        assert!(
            reveal_path(&storage, 0).is_err(),
            "symlink cannot redirect reveal"
        );
    }
}
