use jj_vault::{
    Binding,
    search::{
        NativeHistory,
        indexed::{Expression, Page, Request},
    },
};
use lapis_desktop::vault::{VaultManager, services::VaultServices};
use std::{
    fs,
    sync::{Arc, Mutex},
    time::Duration,
};

fn request(value: &str) -> Request {
    Request {
        expression: Expression::Term {
            field: Some("content".into()),
            value: value.into(),
        },
        case_sensitive: false,
        cursor: None,
        limit: 100,
    }
}
async fn retained(binding: &Binding, value: &str) -> Page {
    tokio::time::timeout(Duration::from_secs(15), async {
        loop {
            if binding.state.join("history-search-v2").is_dir() {
                let source = binding.clone();
                let query = request(value);
                let result = tokio::task::spawn_blocking(move || {
                    NativeHistory {
                        binding: source,
                        exclusions: vec![],
                    }
                    .indexed_search(&query)
                })
                .await
                .unwrap();
                match result {
                    Ok(page) if page.status.complete && !page.hits.is_empty() => return page,
                    Ok(_) => {}
                    Err(error) if error == "History index is busy" => {}
                    Err(error) => panic!("History query failed: {error}"),
                }
            }
            tokio::time::sleep(Duration::from_millis(40)).await;
        }
    })
    .await
    .expect("vault owner must publish without renderer batch requests")
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn desktop_history_owner_indexes_after_detach_and_survives_backup_pause() {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let root = base.join("notes");
    let history = base.join("history");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("Note.md"), "native initial History version").unwrap();
    let mut vaults = VaultManager::new(&base.join("profile")).unwrap();
    let selected = vaults.select(Some(root.clone()), None).unwrap().unwrap();
    let mut services =
        VaultServices::new_with_backup(&base.join("profile"), &history, Arc::new(Mutex::new(())))
            .unwrap();
    let client = services.client(&vaults, &selected.session_id).unwrap();
    let service = services.service(&vaults, &selected.session_id).unwrap();
    let state = client.start_backup().await.unwrap();
    let initial = state.borrow().checkpoint.as_ref().unwrap().commit.clone();
    drop(client);
    services.detach(&vaults, &selected.session_id).unwrap();
    vaults.close(&selected.session_id).unwrap();
    assert_eq!(service.status().unwrap().clients, 0);
    let binding = Binding {
        vault_id: selected.profile_id.clone(),
        root: root.clone(),
        state: history.join(&selected.profile_id),
    };
    fs::write(root.join("Note.md"), "captured without a renderer observer").unwrap();
    let indexed = retained(&binding, "captured without a renderer observer").await;
    assert_ne!(indexed.hits[0].record.revision.checkpoint.commit, initial);
    assert_eq!(service.status().unwrap().clients, 0);
    let reopened = vaults.open_recent(&selected.profile_id).unwrap();
    let client = services.client(&vaults, &reopened.session_id).unwrap();
    client.stop_backup().await.unwrap();
    drop(client);
    assert!(service.history_indexing_status().unwrap().passes > 0);
    fs::write(root.join("Note.md"), "unsnapshotted while capture paused").unwrap();
    retained(&binding, "captured without a renderer observer").await;
    assert_eq!(
        fs::read_to_string(root.join("Note.md")).unwrap(),
        "unsnapshotted while capture paused"
    );
    tokio::task::spawn_blocking(move || services.shutdown())
        .await
        .unwrap()
        .unwrap();
    assert!(service.history_indexing_status().is_err());
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn desktop_cold_history_read_rebuilds_cache_without_capturing_disk() {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let root = base.join("notes");
    let history = base.join("history");
    let profile = base.join("profile");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("Note.md"), "immutable cold History phrase").unwrap();
    let mut vaults = VaultManager::new(&profile).unwrap();
    let selected = vaults.select(Some(root.clone()), None).unwrap().unwrap();
    let mut services =
        VaultServices::new_with_backup(&profile, &history, Arc::new(Mutex::new(()))).unwrap();
    let client = services.client(&vaults, &selected.session_id).unwrap();
    let state = client.start_backup().await.unwrap();
    let checkpoint = state.borrow().checkpoint.as_ref().unwrap().commit.clone();
    let binding = Binding {
        vault_id: selected.profile_id.clone(),
        root: root.clone(),
        state: history.join(&selected.profile_id),
    };
    retained(&binding, "immutable cold History phrase").await;
    client.stop_backup().await.unwrap();
    drop(client);
    tokio::task::spawn_blocking(move || services.shutdown())
        .await
        .unwrap()
        .unwrap();
    fs::remove_dir_all(binding.state.join("history-search-v2")).unwrap();
    fs::write(root.join("Note.md"), "later unsnapshotted disk bytes").unwrap();
    let mut cold =
        VaultServices::new_with_backup(&profile, &history, Arc::new(Mutex::new(()))).unwrap();
    let service = cold.service(&vaults, &selected.session_id).unwrap();
    let owner = service.clone();
    tokio::task::spawn_blocking(move || owner.start_history_indexing())
        .await
        .unwrap()
        .unwrap();
    let page = retained(&binding, "immutable cold History phrase").await;
    assert_eq!(page.hits[0].record.revision.checkpoint.commit, checkpoint);
    assert_eq!(
        fs::read_to_string(root.join("Note.md")).unwrap(),
        "later unsnapshotted disk bytes"
    );
    let source = NativeHistory {
        binding,
        exclusions: vec![],
    };
    let private = tokio::task::spawn_blocking(move || {
        source.indexed_search(&request("later unsnapshotted disk bytes"))
    })
    .await
    .unwrap()
    .unwrap();
    assert!(private.hits.is_empty());
    let saved = root.with_extension("retained");
    fs::rename(&root, &saved).unwrap();
    fs::create_dir(&root).unwrap();
    assert!(service.history_indexing_status().is_err());
    assert!(cold.service(&vaults, &selected.session_id).is_err());
    fs::remove_dir(&root).unwrap();
    fs::rename(&saved, &root).unwrap();
    tokio::task::spawn_blocking(move || cold.shutdown())
        .await
        .unwrap()
        .unwrap();
}
