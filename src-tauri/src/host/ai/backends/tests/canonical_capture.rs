use super::{canonical_capture_cases::*, canonical_message_cases, capture_cases, conversations, *};
use jj_collab::{ThreadActionV1, ThreadCommandV1, ThreadId};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn canonical_managed_capture_keeps_opaque_identity_and_authorship_without_creation_cache() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, stores) = setup(&f).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let command = prepare(&handle, 10, &thread, &before["selection"]);
        let first = f.call(command.clone()).await.unwrap();
        assert_eq!(first["type"], "canonicalCapture");
        assert_eq!(first["data"]["conversation"], before["conversation"]);
        assert_eq!(f.call(command.clone()).await.unwrap(), first);
        assert!(
            !conversations::private(&f).exists(),
            "an idle plan needs no actor or creation alias"
        );
        assert!(!capture_cases::profile(&f).join("ai-capture-v1").exists());
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        let binding = capture_cases::binding(&f, &first);
        assert!(f.policy.processor(&Fixture::context(), &binding).is_err());
        let (binding, mut processor) = processor(&f, &first);
        assert!(
            f.policy
                .resolve(&Fixture::context(), &binding.target_id, None)
                .is_err()
        );
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        let dirty = b"Unsnapshotted editor content\n";
        std::fs::write(f.vault.join("Note.md"), dirty).unwrap();
        let text = format!(
            "Please review {}/Note.md {}",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        );
        prompt(processor.as_mut(), &binding, 11, &text)
            .await
            .unwrap();
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            2,
            &capture_cases::text(&binding, "A canonical managed reply"),
        )
        .await
        .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert_eq!(current["conversation"], before["conversation"]);
        assert_eq!(current["messages"].as_array().unwrap().len(), 1);
        let body = current["messages"][0]["body"].as_str().unwrap();
        assert!(body.contains("$WORKSPACE/Note.md") && body.contains("[REDACTED]"));
        assert!(
            !body.contains("Separate injected context") && !body.contains(capture_cases::TOKEN)
        );
        assert_eq!(current["sessions"].as_array().unwrap().len(), 1);
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        prompt(processor.as_mut(), &binding, 11, &text)
            .await
            .unwrap();
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected,
            "a confirmed repeated prompt keeps its original observed selection even after capture advances metadata"
        );
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        prompt(processor.as_mut(), &binding, 11, &text)
            .await
            .unwrap();
        assert!(!conversations::private(&f).exists());
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            3,
            &capture_cases::terminal(&binding),
        )
        .await
        .unwrap();
        assert_eq!(capture_cases::entries(&f).len(), 3);
        assert_eq!(std::fs::read(f.vault.join("Note.md")).unwrap(), dirty);
        assert_eq!(
            f.call(command).await.unwrap(),
            first,
            "spent preparation remains the same grant"
        );
        let pin = stores.thread().unwrap().snapshot().await.unwrap();
        let state = jj_collab::ThreadStateV1::read(pin.data.root.clone(), &pin.data.graph).unwrap();
        for reference in state.assignments.values() {
            let jj_collab::CollabObjectV1::ThreadLink(link) =
                pin.data.graph.get(*reference).unwrap()
            else {
                panic!("link");
            };
            assert_eq!(json!(link.thread_id), thread);
        }
        drop(processor);
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
    });
}

#[test]
fn recorded_conversation_target_retains_identity_when_a_new_managed_session_is_linked() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, _, _, stores) = setup(&f).await;
        let thread = ThreadId::new([7; 16]);
        let target = jj_collab::ConversationMetadataTargetV1::Recorded {
            session: jj_agent::AgentSessionId::new([8; 16]),
        };
        assert!(matches!(
            stores
                .thread()
                .unwrap()
                .execute(&StoreRequest::new(
                    RequestId::new([7; 16]),
                    ThreadCommandV1::CreateConversation {
                        thread_id: thread,
                        title: "Recorded conversation".into(),
                        target: target.clone()
                    }
                ))
                .await
                .unwrap(),
            StoreOutcome::Committed(_)
        ));
        let before = canonical_message_cases::view(&f, &handle, &json!(thread)).await;
        let prepared = f
            .call(prepare(&handle, 10, &json!(thread), &before["selection"]))
            .await
            .unwrap();
        assert_eq!(prepared["data"]["conversation"]["target"], json!(target));
        let (binding, mut processor) = processor(&f, &prepared);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        prompt(
            processor.as_mut(),
            &binding,
            11,
            "An authored reply to the recorded source",
        )
        .await
        .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &json!(thread)).await;
        assert_eq!(current["conversation"]["target"], json!(target));
        assert_eq!(current["messages"].as_array().unwrap().len(), 1);
        assert_eq!(current["sessions"].as_array().unwrap().len(), 1);
        assert_ne!(
            current["sessions"][0]["snapshot"]["session_id"],
            json!(jj_agent::AgentSessionId::new([8; 16]))
        );
        drop(processor);
    });
}

#[test]
fn archive_preserves_a_running_reply_but_rejects_new_prompts() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, stores) = setup(&f).await;
        let prepared = f
            .call(prepare(&handle, 10, &thread, &before["selection"]))
            .await
            .unwrap();
        let (binding, mut processor) = processor(&f, &prepared);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        prompt(processor.as_mut(), &binding, 11, "Original admitted prompt")
            .await
            .unwrap();
        let native_thread = serde_json::from_value(thread.clone()).unwrap();
        lifecycle(&stores, native_thread, 20, ThreadActionV1::Activate).await;
        lifecycle(&stores, native_thread, 21, ThreadActionV1::Archive).await;
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            2,
            &capture_cases::text(&binding, "Retain this in-flight reply"),
        )
        .await
        .unwrap();
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            3,
            &capture_cases::terminal(&binding),
        )
        .await
        .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert!(
            serde_json::to_string(&current)
                .unwrap()
                .contains("Retain this in-flight reply")
        );
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            prompt(
                processor.as_mut(),
                &binding,
                12,
                "A new prompt after archive"
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
        assert!(!canonical_message_cases::path(&f, 12).exists());
        drop(processor);
    });
}
