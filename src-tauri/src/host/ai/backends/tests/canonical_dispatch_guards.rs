use super::{
    canonical_capture_cases, canonical_dispatch_cases::*, canonical_message_cases, capture_cases, *,
};

#[test]
fn native_dispatch_rejects_changed_intent_and_late_preparation_after_stop() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        let command = begin(&handle, 10, &thread, &before["selection"], false);
        f.call(command.clone()).await.unwrap();
        for (key, replacement) in [
            ("expectedSelection", json!([0])),
            ("authored", json!(true)),
            (
                "recipients",
                json!([{ "requestId":id(12), "participant":null }]),
            ),
            ("owner", json!({"window":"main"})),
        ] {
            let mut changed = command.clone();
            changed["input"][key] = replacement;
            assert!(f.call(changed).await.is_err(), "{key}");
        }
        f.call(stop(&handle, 10, &thread)).await.unwrap();
        assert!(
            f.call(prepare(&handle, 11, 10, &thread, &before["selection"]))
                .await
                .is_err()
        );
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert_eq!(current["selection"], before["selection"]);
    });
}

#[test]
fn native_dispatch_uses_bounded_private_files_and_redacts_participant_data() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        let mut command = begin(&handle, 10, &thread, &before["selection"], false);
        command["input"]["recipients"][0]["participant"] = json!({
            "profileId":"native-profile", "label":capture_cases::TOKEN, "preferredModel":null, "preferredEffort":"low"
        });
        f.call(command).await.unwrap();
        let path = path(&f, &thread, 10);
        assert_eq!(
            std::fs::metadata(&path).unwrap().permissions().mode() & 0o077,
            0
        );
        let bytes = std::fs::read_to_string(&path).unwrap();
        assert!(!bytes.contains(capture_cases::TOKEN));
        assert!(bytes.contains("[REDACTED]"));
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o644)).unwrap();
        assert!(f.call(status(&handle, Some(10), &thread)).await.is_err());
    });
}

#[test]
fn native_dispatch_frame_has_a_narrow_eight_kib_limit_without_widening_other_frames() {
    let f = Fixture::new();
    let mut operation = begin(
        &json!(uuid::Uuid::new_v4()),
        10,
        &json!(id(6)),
        &json!(vec![255; 256]),
        false,
    );
    operation["input"]["recipients"] = json!((11..15).map(|n| json!({"requestId":id(n),"participant":{
        "profileId":format!("p{n}{}", "界".repeat(60)),"label":"界".repeat(80),"preferredModel":"m".repeat(256),"preferredEffort":"high"
    }})).collect::<Vec<_>>());
    let frame = f.frame(operation);
    assert!(frame.len() > 4096 && frame.len() <= 8192);
    assert!(super::super::frames::Request::decode(&frame).is_ok());
    assert!(
        super::super::frames::Request::decode(&format!("{frame}{}", " ".repeat(8193))).is_err()
    );
    let ordinary = f.frame(status(
        &json!(uuid::Uuid::new_v4()),
        Some(10),
        &json!(id(6)),
    ));
    assert!(
        super::super::frames::Request::decode(&format!("{ordinary}{}", " ".repeat(4097))).is_err()
    );
}

#[test]
fn native_stop_fences_a_bound_prompt_and_retains_unclosed_capture_authority() {
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
        let (binding, mut processor) = canonical_capture_cases::processor(&f, &prepared);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        let call = Arc::new(
            f.backends
                .conversation_call(
                    &f.host,
                    &Fixture::context(),
                    &f.session,
                    serde_json::from_value(handle.clone()).unwrap(),
                )
                .unwrap(),
        );
        lapis_desktop::ai::conversations::dispatch::request_stop(
            call,
            jj_store_model::RequestId::new([10; 16]),
            serde_json::from_value(thread.clone()).unwrap(),
        )
        .await
        .unwrap();
        assert!(
            f.call(stop(&handle, 10, &thread)).await.is_err(),
            "an owned processor missing from the host session list is not proven closed"
        );
        assert_eq!(
            f.call(status(&handle, Some(10), &thread)).await.unwrap()["data"]["stopped"],
            false
        );
        // Refusing the fenced prompt retires the capture worker and releases
        // its permit. Holding an empty wrapper is not a live capture authority.
        assert!(
            canonical_capture_cases::prompt(processor.as_mut(), &binding, 10, "")
                .await
                .is_err()
        );
        drop(processor);
        assert_eq!(
            f.call(stop(&handle, 10, &thread)).await.unwrap()["data"]["stopped"],
            true
        );
    });
}

#[test]
fn a_foreign_prompt_retires_its_processor_without_authoring_or_replaying() {
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
        let (binding, mut processor) = canonical_capture_cases::processor(&f, &prepared);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        assert_eq!(
            canonical_capture_cases::prompt(processor.as_mut(), &binding, 12, "Foreign text")
                .await
                .unwrap_err()
                .0,
            "dispatch_prompt_not_admitted"
        );
        assert_eq!(
            canonical_capture_cases::prompt(processor.as_mut(), &binding, 10, "")
                .await
                .unwrap_err()
                .0,
            "native_capture_worker_unavailable"
        );
        assert!(
            canonical_message_cases::view(&f, &handle, &thread).await["messages"]
                .as_array()
                .unwrap()
                .is_empty()
        );
        let pending = f.call(status(&handle, Some(10), &thread)).await.unwrap();
        assert_eq!(pending["data"]["recipients"][0]["phase"], "bound");
        assert_eq!(pending["data"]["settled"], false);
        drop(processor);
        f.call(stop(&handle, 10, &thread)).await.unwrap();
    });
}
