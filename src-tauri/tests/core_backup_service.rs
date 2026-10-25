use lapis_desktop::vault::{VaultManager, services::VaultServices};
use std::{
    fs,
    sync::{Arc, Mutex},
    time::Duration,
};

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn reload_detaches_the_native_client_but_keeps_capture_until_controlled_quit() {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let root = base.join("notes");
    let history = base.join("existing-vault-history");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("Note.md"), "initial").unwrap();
    let mut vaults = VaultManager::new(&base.join("profile")).unwrap();
    let first = vaults.select(Some(root.clone()), None).unwrap().unwrap();
    let mut services =
        VaultServices::new_with_backup(&base.join("profile"), &history, Arc::new(Mutex::new(())))
            .unwrap();
    let client = services.client(&vaults, &first.session_id).unwrap();
    let generation = client.descriptor().generation;
    let mut status = client.start_backup().await.unwrap();
    let initial = status.borrow().checkpoint.as_ref().unwrap().commit.clone();
    drop(client);
    services.detach(&vaults, &first.session_id).unwrap();
    vaults.close(&first.session_id).unwrap();
    fs::write(root.join("Note.md"), "saved during renderer reload").unwrap();
    tokio::time::timeout(Duration::from_secs(10), async {
        loop {
            if status
                .borrow()
                .checkpoint
                .as_ref()
                .is_some_and(|c| c.commit != initial)
            {
                break;
            }
            status.changed().await.unwrap();
        }
    })
    .await
    .unwrap();
    let second = vaults.open_recent(&first.profile_id).unwrap();
    let client = services.client(&vaults, &second.session_id).unwrap();
    assert_eq!(client.descriptor().generation, generation);
    drop(client);
    services.detach(&vaults, &second.session_id).unwrap();
    vaults.close(&second.session_id).unwrap();
    tokio::task::spawn_blocking(move || services.shutdown())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(status.borrow().phase, jj_vault::Phase::Closed);
    assert!(history.join(&first.profile_id).join("vault.json").is_file());
}
