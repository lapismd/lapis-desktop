use super::{conversations::*, *};

fn read_open(handle: &Value, request: u8) -> Value {
    json!({"type":"openConversationRead","handle":handle,"requestId":id(request)})
}
fn read_close(handle: &Value, read: &Value) -> Value {
    json!({"type":"closeConversationRead","handle":handle,"readHandle":read})
}
#[test]
fn conversation_read_handles_are_bounded_and_hold_no_idle_backend_calls() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        assert!(f.call(read_open(&handle, 3)).await.unwrap()["data"].is_null());
        assert!(f.backends.owners.lock().unwrap()["main"].reads.is_empty());
        f.call(prepare(&handle, 3)).await.unwrap();
        let before = super::capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let mut reads = Vec::new();
        for _ in 0..8 {
            let opened = f.call(read_open(&handle, 3)).await.unwrap();
            assert_eq!(opened["type"], "conversationRead");
            reads.push(opened["data"]["handle"].clone());
        }
        assert!(f.call(read_open(&handle, 3)).await.is_err());
        assert_eq!(f.backends.owners.lock().unwrap()["main"].reads.len(), 8);
        f.call(read_close(&handle, &reads[0])).await.unwrap();
        f.call(read_close(&handle, &reads[0])).await.unwrap();
        assert_eq!(f.backends.owners.lock().unwrap()["main"].reads.len(), 7);
        f.call(read_open(&handle, 3)).await.unwrap();
        tokio::time::timeout(
            std::time::Duration::from_secs(5),
            f.call(json!({"type":"close","handle":handle})),
        )
        .await
        .unwrap()
        .unwrap();
        assert!(f.backends.owners.lock().unwrap().is_empty());
        let fresh = f.call(open(5)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(read_close(&handle, &reads[0])).await.is_err());
        assert!(f.backends.owners.lock().unwrap()["main"].reads.is_empty());
        assert!(f.call(read_open(&fresh, 3)).await.unwrap()["data"].is_object());
        assert_eq!(
            super::capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            before
        );
    });
}

#[test]
fn conversation_read_handles_expire_on_reload_and_replaced_physical_sources() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        f.call(prepare(&handle, 3)).await.unwrap();
        let reader = f.call(read_open(&handle, 3)).await.unwrap()["data"]["handle"].clone();
        f.backends.suspend("main").unwrap();
        f.host.0.lock().unwrap().ai.leave("main", true);
        assert!(f.call(read_open(&handle, 3)).await.is_err());
        f.activate();
        let fresh = f.call(open(5)).await.unwrap()["data"]["handle"].clone();
        assert!(f.backends.owners.lock().unwrap()["main"].reads.is_empty());
        assert!(
            f.call(json!({"type":"readConversationTranscript","handle":fresh,
            "readHandle":reader,"cursor":uuid::Uuid::new_v4(),"afterSequence":"32"}))
                .await
                .is_err()
        );
        assert!(f.call(read_close(&handle, &reader)).await.is_err());
        f.call(read_open(&fresh, 3)).await.unwrap();
        std::fs::rename(&f.vault, f.vault.with_extension("retired")).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(f.call(read_open(&fresh, 3)).await.is_err());
    });
}
