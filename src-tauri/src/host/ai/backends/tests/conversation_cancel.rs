use super::*;

#[test]
fn abandoned_conversation_ipc_retains_native_transition_and_original_result() {
    let f = Fixture::new();
    run(async {
        let handle = super::conversations::setup(&f).await;
        let (ready, started) = std::sync::mpsc::channel();
        let (release, blocked) = std::sync::mpsc::channel();
        let host = f.host.clone();
        let blocker = std::thread::spawn(move || {
            let _services = host.0.lock().unwrap();
            ready.send(()).unwrap();
            let _ = blocked.recv();
        });
        started.recv().unwrap();
        let operation = super::conversations::prepare(&handle, 3);
        let task = tauri::async_runtime::spawn(dispatch(
            f.backends.clone(),
            f.host.clone(),
            f.workers.clone(),
            Fixture::context(),
            f.frame(operation.clone()),
        ));
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while f.backends.transitions.try_lock().is_ok() {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
        task.abort();
        assert!(task.await.is_err());
        assert!(f.backends.transitions.try_lock().is_err());
        release.send(()).unwrap();
        let original = f
            .call(super::conversations::status(&handle, 3))
            .await
            .unwrap();
        assert!(original["data"]["receipt"].is_string());
        assert_eq!(f.call(operation).await.unwrap(), original);
        blocker.join().unwrap();
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        assert!(f.backends.owners.lock().unwrap().is_empty());
    });
}
