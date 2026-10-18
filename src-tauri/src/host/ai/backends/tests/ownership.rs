use super::*;
#[test]
fn native_owner_replays_its_open_and_blocks_another_writer_until_confirmed_close() {
    let f = Fixture::new();
    run(async {
        assert_eq!(
            f.call(json!({"type":"read"})).await.unwrap()["data"]["revision"],
            0
        );
        let receipt = f.call(select(1, 0)).await.unwrap();
        let opened = f.call(open(2)).await.unwrap();
        assert_eq!(f.call(open(2)).await.unwrap(), opened);
        assert_eq!(
            f.call(open(3)).await.unwrap_err().kind(),
            std::io::ErrorKind::WouldBlock
        );
        assert!(f.call(select(4, 1)).await.is_err());
        assert_eq!(
            f.call(json!({"type":"status","requestId":id(1)}))
                .await
                .unwrap(),
            receipt
        );
        assert!(
            f.call(json!({"type":"close","handle":uuid::Uuid::new_v4()}))
                .await
                .is_err()
        );
        let close = json!({"type":"close","handle":opened["data"]["handle"]});
        assert_eq!(f.call(close.clone()).await.unwrap()["type"], "closed");
        assert_eq!(f.call(close).await.unwrap()["type"], "closed");
        assert_eq!(
            f.call(select(4, 1)).await.unwrap()["data"]["selection"]["revision"],
            2
        );
    });
}
#[test]
fn verified_reload_reattaches_the_scope_but_rejects_delayed_previous_renderer_closes() {
    let f = Fixture::new();
    run(async {
        let original = f.call(open(1)).await.unwrap();
        let scope = f.backends.owners.lock().unwrap()["main"].scope.clone();
        let call = scope.begin().unwrap();
        assert!(f.host.0.lock().unwrap().ai.leave("main", true));
        f.backends.suspend("main").unwrap();
        assert!(f.call(open(2)).await.is_err());
        f.activate();
        let attached = f.call(open(2)).await.unwrap();
        assert_ne!(original["data"]["handle"], attached["data"]["handle"]);
        assert_eq!(f.call(open(2)).await.unwrap(), attached);
        call.check().unwrap();
        assert!(
            f.call(json!({"type":"close","handle":original["data"]["handle"]}))
                .await
                .is_err()
        );
        call.check().unwrap();
        drop(call);
        drop(scope);
        f.call(json!({"type":"close","handle":attached["data"]["handle"]}))
            .await
            .unwrap();
    });
}
#[test]
fn delayed_old_generation_cleanup_cannot_fence_or_remove_a_replacement_owner() {
    let f = Fixture::new();
    run(async {
        f.call(open(1)).await.unwrap();
        let old = f.activate();
        f.host.0.lock().unwrap().ai.leave("main", false);
        super::super::revoke(&f.workers, &f.backends, "main", Some(&old))
            .await
            .unwrap();
        let new = f.activate();
        assert_ne!(old, new);
        let replacement = f.call(open(2)).await.unwrap();
        f.backends.fence("main", Some(&old)).unwrap();
        f.backends.drain("main", Some(&old)).await.unwrap();
        assert_eq!(f.call(open(2)).await.unwrap(), replacement);
    });
}
#[test]
fn physical_admission_failure_fences_and_supervises_cleanup_without_a_registry_deadlock() {
    let f = Fixture::new();
    run(async {
        f.call(open(1)).await.unwrap();
        let scope = f.backends.owners.lock().unwrap()["main"].scope.clone();
        let call = scope.begin().unwrap();
        let parked = f._root.path().join("parked");
        std::fs::rename(&f.vault, parked).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(f.call(open(1)).await.is_err());
        assert!(call.check().is_err());
        assert!(scope.begin().is_err());
        drop(call);
        drop(scope);
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while !f.backends.owners.lock().unwrap().is_empty() {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
    });
}

#[test]
fn destroyed_window_cannot_be_readmitted_by_an_old_in_flight_frame() {
    let f = Fixture::new();
    run(async {
        f.call(open(1)).await.unwrap();
        f.backends.destroy_window("main").unwrap();
        f.host.0.lock().unwrap().ai.leave("main", false);
        // A prepare/complete queued before destruction must not revive authority.
        f.activate();
        assert!(f.call(json!({"type":"read"})).await.is_err());
        assert!(f.workers.targets(&Fixture::context()).is_err());
        super::super::revoke(&f.workers, &f.backends, "main", None)
            .await
            .unwrap();
    });
}
