use jj_vault::Binding;
use lapis_desktop::{repository::RepositoryAdmissions, vault::VaultManager};
use std::{fs, path::PathBuf, sync::Arc};
struct Access(PathBuf);
struct Guarded {
    native: jj_vault::NativeRepository,
    files: Arc<std::sync::Mutex<()>>,
}
impl jj_vault::Repository for Guarded {
    fn capture(&mut self) -> Result<jj_vault::Capture, String> {
        let _guard = self.files.lock().unwrap();
        jj_vault::Repository::capture(&mut self.native)
    }
}
#[async_trait::async_trait]
impl tauri_plugin_jj_store::local::Access for Access {
    fn repository(&self) -> jj_store_model::RepositoryId {
        jj_store_model::RepositoryId::new([7; 16])
    }
    fn generation(&self) -> u64 {
        1
    }
    fn metadata_path(&self) -> &std::path::Path {
        &self.0
    }
    async fn authorize(&self) -> tauri_plugin_jj_store::Result<()> {
        Ok(())
    }
}
#[test]
fn an_ordinary_vault_binds_external_checkpoint_history_without_read_side_snapshots() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().canonicalize().unwrap();
            let notes = root.join("notes");
            fs::create_dir(&notes).unwrap();
            fs::write(notes.join("Note.md"), "Recorded note\n").unwrap();
            let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
            let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
            let binding = Binding {
                vault_id: vault.profile_id.clone(),
                root: notes.clone(),
                state: root.join("private/history"),
            };
            let mut session = jj_store_jj::vault_workspace::Session::open(binding.clone())
                .await
                .unwrap();
            let captured = session.capture(&[], "Recorded note").await.unwrap();
            drop(session);
            let mut admissions = RepositoryAdmissions::default();
            assert!(
                admissions
                    .prepare(&vaults, "main", &vault.session_id)
                    .is_err()
            );
            admissions
                .bind_backup(&vaults, &vault.session_id, &binding.state)
                .unwrap();
            let plan = admissions
                .prepare(&vaults, "main", &vault.session_id)
                .unwrap();
            let grant = admissions.complete(&vaults, &plan).unwrap();
            assert_eq!(grant.metadata_path(), binding.metadata());
            fs::write(notes.join("Note.md"), "Unsnapshotted edit\n").unwrap();
            let reader = tauri_plugin_jj_store::local::Executor::new(1).unwrap();
            let heads = reader
                .heads(Arc::new(Access(grant.metadata_path().to_path_buf())))
                .await
                .unwrap();
            assert_eq!(heads.heads[0].to_string(), captured.operation);
            assert_eq!(
                fs::read_to_string(notes.join("Note.md")).unwrap(),
                "Unsnapshotted edit\n"
            );
            assert!(!notes.join(".jj").exists());
            assert!(!notes.join(".git").exists());
            admissions.begin_close_vault(&vault.session_id);
            assert!(admissions.check(&vaults, &grant).is_err());
        });
}
#[test]
fn native_directory_events_capture_external_edits_and_drain_on_close() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().canonicalize().unwrap();
            let notes = root.join("notes");
            fs::create_dir(&notes).unwrap();
            fs::write(notes.join("Note.md"), "First version\n").unwrap();
            let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
            let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
            let binding = Binding {
                vault_id: vault.profile_id.clone(),
                root: notes.clone(),
                state: root.join("history"),
            };
            let gate = Arc::new(std::sync::Mutex::new(()));
            let backup = jj_vault::Backup::start_idle(
                Guarded {
                    native: jj_vault::NativeRepository {
                        binding: binding.clone(),
                        exclusions: vec![],
                    },
                    files: gate.clone(),
                },
                jj_vault::Timing {
                    quiet: std::time::Duration::from_millis(25),
                    maximum_delay: std::time::Duration::from_millis(200),
                    reconciliation: std::time::Duration::from_secs(60),
                },
            )
            .unwrap();
            let changes = backup.changes();
            let mut watches = lapis_desktop::watch::WatchRegistry::default();
            let watch = watches
                .start(
                    &vault.session_id,
                    vaults.get(&vault.session_id).unwrap(),
                    "",
                    true,
                    gate,
                    move |event| {
                        if !event.changes.is_empty() || event.reconciliation {
                            changes.changed();
                        }
                        true
                    },
                )
                .unwrap();
            let initial = backup.capture().await.unwrap().checkpoint.unwrap();
            let mut status = backup.subscribe();
            fs::write(notes.join("Note.md"), "External second version\n").unwrap();
            tokio::time::timeout(std::time::Duration::from_secs(5), async {
                loop {
                    status.changed().await.unwrap();
                    if status
                        .borrow()
                        .checkpoint
                        .as_ref()
                        .is_some_and(|c| c.commit != initial.commit)
                    {
                        break;
                    }
                }
            })
            .await
            .unwrap();
            watches.close(&vault.session_id, &watch).unwrap();
            backup.close().await.unwrap();
            let session = jj_store_jj::vault_workspace::Session::open(binding)
                .await
                .unwrap();
            let final_commit = session.checkpoint().unwrap().unwrap().commit;
            assert_ne!(final_commit, initial.commit);
            assert_eq!(
                session.file_at(&final_commit, "Note.md").await.unwrap(),
                Some(jj_store_jj::vault_workspace::FileContents::Regular {
                    data: b"External second version\n".to_vec(),
                    executable: false,
                })
            );
            assert!(!notes.join(".jj").exists());
        });
}
