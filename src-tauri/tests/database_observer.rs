use lapis_desktop::{
    database::NativeDatabases,
    vault::{VaultManager, services::VaultServices},
};
use serde_json::json;
use std::time::Duration;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_lagged_native_channel_resets_at_the_shared_revision_and_disposes_cleanly() {
    let root = tempfile::tempdir().unwrap();
    let profile = tempfile::tempdir().unwrap();
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let selected = manager
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::new(profile.path()).unwrap();
    let client = services.client(&manager, &selected.session_id).unwrap();
    let (_, view) = NativeDatabases::default()
        .open(&selected.session_id, client.clone())
        .unwrap();
    let changes = view.subscribe().await.unwrap();
    let (events, mut received) = tokio::sync::mpsc::unbounded_channel();
    let (ready, started) = tokio::sync::oneshot::channel();
    let mut ready = Some(ready);
    let (resume, blocked) = std::sync::mpsc::channel();
    view.observe(changes, move |change| {
        if let Some(ready) = ready.take() {
            let _ = ready.send(());
            if blocked.recv_timeout(Duration::from_secs(5)).is_err() {
                return false;
            }
        }
        events.send(change).is_ok()
    })
    .await
    .unwrap();
    let set = |index| {
        serde_json::from_value(json!({"method":"setMeta","args":[{"kind":"value","value":"key"},{"kind":"value","value":index}]})).unwrap()
    };
    view.call(set(0)).await.unwrap();
    tokio::time::timeout(Duration::from_secs(5), started)
        .await
        .unwrap()
        .unwrap();
    for index in 1..=130 {
        view.call(set(index)).await.unwrap();
    }
    resume.send(()).unwrap();
    let first = tokio::time::timeout(Duration::from_secs(5), received.recv())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(first.revision, 1);
    let reset = tokio::time::timeout(Duration::from_secs(5), received.recv())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(reset.revision, 131);
    assert_eq!(reset.reset, Some(true));
    assert_eq!(reset.domains.len(), 9);
    assert!(reset.paths.is_empty());
    view.call(set(131)).await.unwrap();
    let next = tokio::time::timeout(Duration::from_secs(5), received.recv())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(next.revision, 132);
    assert_ne!(next.reset, Some(true));
    view.close().await;
    assert!(
        tokio::time::timeout(Duration::from_secs(5), received.recv())
            .await
            .unwrap()
            .is_none()
    );
    // Closing observation does not revoke the service's native work authority.
    client.call_database(set(132)).await.unwrap();
    tokio::task::spawn_blocking(move || services.close(&manager, &selected.session_id))
        .await
        .unwrap()
        .unwrap();
}
