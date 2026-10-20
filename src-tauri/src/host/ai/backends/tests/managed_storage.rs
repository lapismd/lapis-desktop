use super::{conversations, *};
use jj_store_jj::vault_workspace::Session;
use jj_vault::StorageLocation;
use lapis_desktop::vault::VaultDescriptor;

fn descriptor(f: &Fixture) -> VaultDescriptor {
    f.host
        .0
        .lock()
        .unwrap()
        .vaults
        .descriptor(&f.session)
        .unwrap()
        .clone()
}
async fn initialize(f: &Fixture) -> jj_vault::Binding {
    let locations = f.backends.storage.as_ref().unwrap();
    let binding = locations.binding(&descriptor(f)).unwrap();
    let mut native = Session::open(binding.clone()).await.unwrap();
    native.capture(&[], "Initial backup").await.unwrap();
    binding
}
async fn open_managed(f: &Fixture, request: u8, revision: u32) -> Value {
    f.call(
        json!({"type":"select","requestId":id(request),"expectedRevision":revision,"backend":"jj"}),
    )
    .await
    .unwrap();
    f.call(open(request + 1)).await.unwrap()["data"]["handle"].clone()
}

#[test]
fn managed_vault_conversations_use_external_state_without_history_admission_or_disk_snapshot() {
    let f = Fixture::managed();
    run(async {
        std::fs::write(f.vault.join("Note.md"), "Saved checkpoint\n").unwrap();
        let binding = initialize(&f).await;
        let heads = std::fs::read_dir(binding.metadata().join("op_heads/heads"))
            .unwrap()
            .map(|p| p.unwrap().file_name())
            .collect::<Vec<_>>();
        std::fs::write(f.vault.join("Note.md"), "Unsnapshotted edit\n").unwrap();
        let handle = open_managed(&f, 1, 0).await;
        let empty = f
            .call(json!({"type":"listConversations","handle":handle}))
            .await
            .unwrap();
        let empty: Value = serde_json::from_str(empty["data"].as_str().unwrap()).unwrap();
        assert!(empty["conversations"].as_array().unwrap().is_empty());
        assert!(!conversations::private(&f).exists());
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        assert!(created["data"]["receipt"].is_string());
        let metadata = jj_store_jj::local_repository::default_metadata_store(&binding.metadata())
            .unwrap()
            .carrier()
            .clone();
        let committed = metadata.read().unwrap().unwrap().commit();
        assert_eq!(
            f.call(conversations::prepare(&handle, 3)).await.unwrap(),
            created
        );
        assert_eq!(
            f.call(conversations::status(&handle, 3)).await.unwrap(),
            created
        );
        let catalog = f
            .call(json!({"type":"listConversations","handle":handle}))
            .await
            .unwrap();
        let catalog: Value = serde_json::from_str(catalog["data"].as_str().unwrap()).unwrap();
        assert_eq!(
            catalog["conversations"][0]["threadId"],
            created["data"]["threadId"]
        );
        f.call(json!({"type":"readCanonicalConversation","handle":handle,
            "threadId":created["data"]["threadId"]}))
            .await
            .unwrap();
        assert_eq!(metadata.read().unwrap().unwrap().commit(), committed);
        let mut after = std::fs::read_dir(binding.metadata().join("op_heads/heads"))
            .unwrap()
            .map(|p| p.unwrap().file_name())
            .collect::<Vec<_>>();
        after.sort();
        let mut heads = heads;
        heads.sort();
        assert_eq!(after, heads);
        assert_eq!(
            std::fs::read(f.vault.join("Note.md")).unwrap(),
            b"Unsnapshotted edit\n"
        );
        assert!(!f.vault.join(".jj").exists());
        assert!(!f.vault.join(".git").exists());
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
        let mut services = f.host.0.lock().unwrap();
        let NativeServices {
            repository, vaults, ..
        } = &mut *services;
        assert!(repository.authorize(vaults, "main", &f.session).is_err());
    });
}

#[test]
fn vault_policy_never_falls_back_to_an_unrelated_root_workspace_or_initializes_missing_backup() {
    let f = Fixture::managed();
    run(async {
        conversations::jj(&f, &["git", "init", "--no-colocate"]);
        assert!(
            f.call(json!({"type":"select","requestId":id(1),"expectedRevision":0,"backend":"jj"}))
                .await
                .is_err()
        );
        assert!(
            !f.backends
                .storage
                .as_ref()
                .unwrap()
                .binding(&descriptor(&f))
                .unwrap()
                .state
                .exists()
        );
        let binding = initialize(&f).await;
        let path = binding.state.join("vault.json");
        let original = std::fs::read(&path).unwrap();
        for field in ["vault_id", "root_identity"] {
            let mut changed: Value = serde_json::from_slice(&original).unwrap();
            if field == "vault_id" {
                changed["binding"][field] = json!(uuid::Uuid::new_v4().to_string());
            } else {
                changed[field] = json!("0:0");
            }
            std::fs::write(&path, serde_json::to_vec(&changed).unwrap()).unwrap();
            assert!(
                f.call(
                    json!({"type":"select","requestId":id(1),"expectedRevision":0,"backend":"jj"})
                )
                .await
                .is_err()
            );
        }
        std::fs::write(path, original).unwrap();
        let handle = open_managed(&f, 1, 0).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let root = jj_store_jj::local_repository::inspect_workspace(&f.vault).unwrap();
        assert!(
            root.repository.is_none(),
            "root workspace is not the selected backend"
        );
        assert!(created["data"]["repository"].is_string());
    });
}

#[test]
fn storage_moves_fence_old_calls_and_require_explicit_new_source_selection() {
    let f = Fixture::managed();
    run(async {
        initialize(&f).await;
        let handle = open_managed(&f, 1, 0).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let locations = f.backends.storage.as_ref().unwrap();
        let storage = locations.storage(&descriptor(&f));
        // Exercise a retained owner while native layout recovery is pending.
        assert!(
            storage
                .change_with(0, StorageLocation::Colocated, "move-root", |progress| {
                    if progress.phase == "archived" {
                        Err(jj_store_jj::vault_workspace::Error::Busy)
                    } else {
                        Ok(())
                    }
                })
                .await
                .is_err()
        );
        assert!(locations.binding(&descriptor(&f)).is_err());
        assert!(f.call(conversations::status(&handle, 3)).await.is_err());
        storage.recover().await.unwrap();
        assert!(f.call(conversations::status(&handle, 3)).await.is_err());
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        let handle = open_managed(&f, 4, 1).await;
        assert!(
            f.call(conversations::status(&handle, 3)).await.is_err(),
            "the old physical intent is not rebound during migration"
        );
        let catalog = f
            .call(json!({"type":"listConversations","handle":handle}))
            .await
            .unwrap();
        let catalog: Value = serde_json::from_str(catalog["data"].as_str().unwrap()).unwrap();
        assert_eq!(
            catalog["conversations"][0]["threadId"],
            created["data"]["threadId"]
        );
        f.call(json!({"type":"readCanonicalConversation","handle":handle,
            "threadId":created["data"]["threadId"]}))
            .await
            .unwrap();
    });
}

#[test]
fn host_storage_move_drains_native_publishers_and_holds_the_admission_fence() {
    let f = Fixture::managed();
    run(async {
        initialize(&f).await;
        let _handle = open_managed(&f, 1, 0).await;
        let scope = f
            .backends
            .owners
            .lock()
            .unwrap()
            .get("main")
            .unwrap()
            .scope
            .clone();
        let call = scope.begin().unwrap();
        let backends = f.backends.clone();
        let workers = f.workers.clone();
        let session = f.session.clone();
        let draining =
            tokio::spawn(async move { backends.prepare_storage_move(&workers, &session).await });
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            loop {
                if scope.begin().is_err() {
                    break;
                }
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
        assert!(
            !draining.is_finished(),
            "the active publisher still owns its lease"
        );
        drop(call);
        let fence = draining.await.unwrap().unwrap();
        assert!(f.backends.owners.lock().unwrap().is_empty());
        assert!(f.backends.transitions.try_lock().is_err());
        assert!(scope.begin().is_err());
        drop(fence);
        f.call(open(4)).await.unwrap();
    });
}
