use super::*;
#[test]
fn cancelled_ipc_retains_its_transition_until_the_original_choice_finishes() {
    let f = Fixture::new();
    let (ready, started) = std::sync::mpsc::channel();
    let (release, blocked) = std::sync::mpsc::channel();
    let host = f.host.clone();
    let blocker = std::thread::spawn(move || {
        let _services = host.0.lock().unwrap();
        ready.send(()).unwrap();
        let _ = blocked.recv();
    });
    started.recv().unwrap();
    run(async {
        let before = f.blocking_jobs();
        let task = tauri::async_runtime::spawn(dispatch(
            f.backends.clone(),
            f.host.clone(),
            f.workers.clone(),
            Fixture::context(),
            f.frame(select(1, 0)),
        ));
        f.wait_for_blocking_job(before).await;
        task.abort();
        assert!(task.await.is_err());
        assert!(
            f.backends.transitions.try_lock().is_err(),
            "blocking IO must retain native serialization after its caller disappears"
        );
        release.send(()).unwrap();
        let receipt = f
            .call(json!({"type":"status","requestId":id(1)}))
            .await
            .unwrap();
        assert_eq!(receipt["data"]["selection"]["revision"], 1);
        assert_eq!(f.call(select(1, 0)).await.unwrap(), receipt);
    });
    blocker.join().unwrap();
}
#[test]
fn cancelled_close_remains_fenced_and_retains_its_owner_until_the_call_drains() {
    let f = Fixture::new();
    run(async {
        let opened = f.call(open(1)).await.unwrap();
        let scope = f.backends.owners.lock().unwrap()["main"].scope.clone();
        let call = scope.begin().unwrap();
        let close = json!({"type":"close","handle":opened["data"]["handle"]});
        let task = tauri::async_runtime::spawn(dispatch(
            f.backends.clone(),
            f.host.clone(),
            f.workers.clone(),
            Fixture::context(),
            f.frame(close.clone()),
        ));
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while scope.begin().is_ok() {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
        task.abort();
        assert!(task.await.is_err());
        assert!(call.check().is_err());
        assert_eq!(f.backends.owners.lock().unwrap().len(), 1);
        assert!(f.call(select(2, 0)).await.is_err());
        drop(call);
        drop(scope);
        f.call(close).await.unwrap();
        assert!(f.backends.owners.lock().unwrap().is_empty());
        f.call(select(2, 0)).await.unwrap();
    });
}
