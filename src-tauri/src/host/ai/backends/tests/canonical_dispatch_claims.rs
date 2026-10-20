use super::{canonical_capture_cases, canonical_dispatch_cases::*, capture_cases, *};

fn claims(f: &Fixture, request: u8) -> PathBuf {
    capture_cases::profile(f)
        .join("canonical-dispatch-requests-v1")
        .join(format!("{}.json", id(request)))
}
#[test]
fn durable_request_claims_cannot_switch_parent_profile_or_legacy_preparation_after_retirement() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        f.call(begin(&handle, 10, &thread, &before["selection"], false))
            .await
            .unwrap();
        let prepared = f
            .call(prepare(&handle, 11, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let (_, processor) = canonical_capture_cases::processor(&f, &prepared);
        drop(processor);
        let original = std::fs::read(claims(&f, 11)).unwrap();
        for request in [10, 11] {
            assert!(
                f.call(capture_cases::prepare(&handle, request, 3))
                    .await
                    .is_err()
            );
            assert!(
                f.call(canonical_capture_cases::prepare(
                    &handle,
                    request,
                    &thread,
                    &before["selection"]
                ))
                .await
                .is_err()
            );
        }
        f.call(stop(&handle, 10, &thread)).await.unwrap();
        let mut next = begin(&handle, 12, &thread, &before["selection"], false);
        next["input"]["recipients"][0]["requestId"] = json!(id(11));
        f.call(next).await.unwrap();
        let reused = prepare(&handle, 11, 12, &thread, &before["selection"]);
        // This recipient is correctly bound by the new Begin. The durable
        // global claim, rather than input mismatch, prevents its reuse.
        assert!(f.call(reused).await.is_err());
        assert_eq!(std::fs::read(claims(&f, 11)).unwrap(), original);
        assert!(!claims(&f, 13).exists());
        f.call(stop(&handle, 12, &thread)).await.unwrap();
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        let next = f.call(open(20)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(capture_cases::prepare(&next, 11, 3)).await.is_err());
    });
}

#[test]
fn orphan_recipient_claim_is_unknown_and_never_reconstructs_a_grant() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        f.call(begin(&handle, 10, &thread, &before["selection"], false))
            .await
            .unwrap();
        let command = prepare(&handle, 11, 10, &thread, &before["selection"]);
        f.call(command.clone()).await.unwrap();
        let original = std::fs::read(claims(&f, 11)).unwrap();
        let mut record = saved(&f, &thread, 10);
        record["recipients"][0]["phase"] = json!("planned");
        record["recipients"][0]["target"] = Value::Null;
        std::fs::write(path(&f, &thread, 10), serde_json::to_vec(&record).unwrap()).unwrap();
        // Model an interruption after claim fsync but before the journal update
        // and volatile plan installation. There has been no worker launch.
        f.backends
            .owners
            .lock()
            .unwrap()
            .get_mut("main")
            .unwrap()
            .canonical_captures
            .clear();
        assert!(f.call(command).await.is_err());
        assert_eq!(std::fs::read(claims(&f, 11)).unwrap(), original);
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
        assert_eq!(
            f.call(status(&handle, Some(10), &thread)).await.unwrap()["data"]["settled"],
            false
        );
        f.call(stop(&handle, 10, &thread)).await.unwrap();
    });
}

#[test]
fn private_claim_corruption_cannot_become_a_fresh_request_or_native_completion() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        f.call(begin(&handle, 10, &thread, &before["selection"], false))
            .await
            .unwrap();
        let command = prepare(&handle, 11, 10, &thread, &before["selection"]);
        f.call(command.clone()).await.unwrap();
        f.backends
            .owners
            .lock()
            .unwrap()
            .get_mut("main")
            .unwrap()
            .canonical_captures
            .clear();
        let mut claim: Value =
            serde_json::from_slice(&std::fs::read(claims(&f, 11)).unwrap()).unwrap();
        claim["binding"][0] = json!((claim["binding"][0].as_u64().unwrap() + 1) % 256);
        std::fs::write(claims(&f, 11), serde_json::to_vec(&claim).unwrap()).unwrap();
        assert!(f.call(status(&handle, Some(10), &thread)).await.is_err());
        assert!(f.call(command).await.is_err());
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
    });
}

#[test]
fn a_missing_parent_record_with_a_durable_claim_is_unavailable_instead_of_an_absent_turn() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        let command = begin(&handle, 10, &thread, &before["selection"], false);
        f.call(command.clone()).await.unwrap();
        let claim = std::fs::read(claims(&f, 10)).unwrap();
        std::fs::remove_file(path(&f, &thread, 10)).unwrap();
        assert!(f.call(status(&handle, Some(10), &thread)).await.is_err());
        assert!(f.call(command).await.is_err());
        assert_eq!(std::fs::read(claims(&f, 10)).unwrap(), claim);
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
    });
}
