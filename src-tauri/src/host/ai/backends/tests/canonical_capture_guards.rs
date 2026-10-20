use super::{canonical_capture_cases::*, canonical_message_cases, capture_cases, conversations, *};
use jj_collab::{ThreadActionV1, ThreadId};
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn rejected_canonical_preparations_allocate_no_actor_and_idle_plans_share_the_existing_bound() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        let valid = prepare(&handle, 10, &thread, &before["selection"]);
        for (field, value) in [
            ("threadId", json!(id(99))),
            ("expectedSelection", json!([])),
            ("expectedSelection", json!([256])),
            ("expectedSelection", json!([0])),
            ("clientId", json!("arbitrary-program")),
            ("root", json!("outside")),
            ("actor", json!(id(99))),
            ("target", json!("foreign-conversation")),
            ("environment", json!({"KEY":"VALUE"})),
        ] {
            let mut rejected = valid.clone();
            rejected[field] = value;
            assert!(f.call(rejected).await.is_err(), "{field}");
            assert!(!conversations::private(&f).exists());
            assert!(!capture_cases::profile(&f).join("ai-capture-v1").exists());
        }
        let first = f.call(valid.clone()).await.unwrap();
        assert!(
            f.call(capture_cases::prepare(&handle, 10, 3))
                .await
                .is_err(),
            "a request cannot cross preparation types"
        );
        for request in 11..74 {
            f.call(prepare(&handle, request, &thread, &before["selection"]))
                .await
                .unwrap();
        }
        assert!(
            f.call(prepare(&handle, 74, &thread, &before["selection"]))
                .await
                .is_err()
        );
        assert_eq!(f.call(valid).await.unwrap(), first);
        assert!(!conversations::private(&f).exists());
        assert!(f.backends.processing.lock().unwrap().is_empty());
        tokio::time::timeout(
            std::time::Duration::from_secs(5),
            f.call(json!({"type":"close","handle":handle})),
        )
        .await
        .unwrap()
        .unwrap();
    });
    let f = Fixture::new();
    run(async {
        let (handle, conversation, _) = capture_cases::setup(&f).await;
        let thread = &conversation["data"]["threadId"];
        let current = canonical_message_cases::view(&f, &handle, thread).await;
        assert!(
            f.call(prepare(&handle, 4, thread, &current["selection"]))
                .await
                .is_err(),
            "an existing capture-only request cannot upgrade to canonical execution"
        );
    });
}

#[test]
fn archiving_after_preparation_rejects_first_capture_before_actor_or_journal_allocation() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, stores) = setup(&f).await;
        let first = f
            .call(prepare(&handle, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let native_thread = serde_json::from_value(thread.clone()).unwrap();
        lifecycle(&stores, native_thread, 20, ThreadActionV1::Activate).await;
        lifecycle(&stores, native_thread, 21, ThreadActionV1::Archive).await;
        let archived = canonical_message_cases::view(&f, &handle, &thread).await;
        assert!(
            f.call(prepare(&handle, 11, &thread, &archived["selection"]))
                .await
                .is_err()
        );
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let (binding, mut processor) = processor(&f, &first);
        assert!(
            capture_cases::batch(
                processor.as_mut(),
                &binding,
                1,
                &capture_cases::opened(&binding)
            )
            .await
            .is_err()
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert!(!conversations::private(&f).exists());
        assert!(!capture_cases::profile(&f).join("ai-capture-v1").exists());
        assert!(
            f.policy
                .resolve(&Fixture::context(), &binding.target_id, None)
                .is_err(),
            "failed startup never refunds a launch grant"
        );
    });
}

#[test]
fn unknown_canonical_authorship_never_reexecutes_the_original_prompt_write() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        let first = f
            .call(prepare(&handle, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let (binding, mut processor) = processor(&f, &first);
        let text = "Keep the original canonical unknown request";
        prompt(processor.as_mut(), &binding, 11, text)
            .await
            .unwrap();
        let original = canonical_message_cases::record(&f, 11);
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        canonical_message_cases::replace(
            &f,
            12,
            &canonical_message_cases::unpublished(original, 12, &current),
        );
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            prompt(processor.as_mut(), &binding, 12, text)
                .await
                .is_err()
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        let status = f
            .call(canonical_message_cases::status(&handle, 12, &thread))
            .await
            .unwrap();
        assert!(status["data"]["receipt"].is_null());
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert_eq!(current["messages"].as_array().unwrap().len(), 1);
        drop(processor);
    });
}

#[test]
fn canonical_workers_refuse_foreign_bindings_and_physical_source_replacement() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        let first = f
            .call(prepare(&handle, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let (binding, mut processor) = processor(&f, &first);
        for index in 0..3 {
            let mut foreign = binding.clone();
            match index {
                0 => foreign.target_id = uuid::Uuid::new_v4().to_string(),
                1 => foreign.admission = "other-generation".into(),
                _ => foreign.session_id = "bad\nworker".into(),
            }
            assert!(f.policy.processor(&Fixture::context(), &foreign).is_err());
        }
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        std::fs::rename(&f.vault, f._root.path().join("original-vault")).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(
            capture_cases::batch(
                processor.as_mut(),
                &binding,
                2,
                &capture_cases::text(&binding, "A foreign source must not receive this reply")
            )
            .await
            .is_err()
        );
        assert_eq!(capture_cases::entries(&f).len(), 1);
        drop(processor);
    });
}

#[test]
fn annotations_never_become_canonical_managed_conversations() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, _, stores) = setup(&f).await;
        assert!(matches!(
            stores
                .thread()
                .unwrap()
                .execute(&jj_store_core::StoreRequest::new(
                    jj_store_model::RequestId::new([7; 16]),
                    jj_collab::ThreadCommandV1::CreateAnnotation {
                        thread_id: ThreadId::new([7; 16]),
                        title: "An annotation".into()
                    }
                ))
                .await
                .unwrap(),
            jj_store_core::StoreOutcome::Committed(_)
        ));
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert!(
            f.call(prepare(&handle, 10, &json!(id(7)), &current["selection"]))
                .await
                .is_err()
        );
        assert!(!conversations::private(&f).exists());
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
    });
}

#[test]
fn tombstoned_membership_fences_further_capture_without_discarding_prior_facts() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, stores) = setup(&f).await;
        let first = f
            .call(prepare(&handle, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let (binding, mut processor) = processor(&f, &first);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        let native_thread = serde_json::from_value(thread).unwrap();
        lifecycle(&stores, native_thread, 20, ThreadActionV1::Activate).await;
        lifecycle(&stores, native_thread, 21, ThreadActionV1::Archive).await;
        lifecycle(&stores, native_thread, 22, ThreadActionV1::Tombstone).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            capture_cases::batch(
                processor.as_mut(),
                &binding,
                2,
                &capture_cases::text(&binding, "No new tombstoned capture")
            )
            .await
            .is_err()
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert_eq!(capture_cases::entries(&f).len(), 1);
    });
}
