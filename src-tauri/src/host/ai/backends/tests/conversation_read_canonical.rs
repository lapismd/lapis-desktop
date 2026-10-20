use super::{capture_cases::*, conversations, *};
use tauri_plugin_lapis_ai::HostPolicy;

pub(super) fn read(handle: &Value, thread: &Value) -> Value {
    json!({"type":"readCanonicalConversation","handle":handle,"threadId":thread})
}
pub(super) fn open_read(handle: &Value, thread: &Value) -> Value {
    json!({"type":"openCanonicalConversationRead","handle":handle,"threadId":thread})
}
#[test]
fn canonical_conversation_view_survives_loss_of_private_creation_and_actor_records() {
    let f = Fixture::new();
    run(async {
        let (handle, conversation, binding) = setup(&f).await;
        let mut processor = f
            .policy
            .processor(&Fixture::context(), &binding)
            .unwrap()
            .unwrap();
        batch(processor.as_mut(), &binding, 1, &opened(&binding))
            .await
            .unwrap();
        batch(
            processor.as_mut(),
            &binding,
            2,
            &text(&binding, "A canonical stored answer"),
        )
        .await
        .unwrap();
        batch(processor.as_mut(), &binding, 3, &terminal(&binding))
            .await
            .unwrap();
        drop(processor);
        f.call(json!({"type":"appendConversationMessage","handle":handle,
            "requestId":id(5),"conversationRequestId":id(3),"text":"Canonical human authorship"}))
            .await
            .unwrap();
        let legacy = f
            .call(super::conversation_reads::read(&handle, 3))
            .await
            .unwrap();
        let legacy: Value = serde_json::from_str(legacy["data"].as_str().unwrap()).unwrap();
        let session =
            serde_json::from_value(legacy["sessions"][0]["snapshot"]["session_id"].clone())
                .unwrap();
        let native = stores(&f, &conversation);
        let recorded_target = jj_collab::ConversationMetadataTargetV1::Recorded { session };
        let recorded_thread = jj_collab::ThreadId::new([6; 16]);
        assert!(matches!(
            native
                .thread()
                .unwrap()
                .execute(&jj_store_core::StoreRequest::new(
                    jj_store_model::RequestId::new([6; 16]),
                    jj_collab::ThreadCommandV1::CreateConversation {
                        thread_id: recorded_thread,
                        title: "Recorded source identity".into(),
                        target: recorded_target.clone(),
                    }
                ))
                .await
                .unwrap(),
            jj_store_core::StoreOutcome::Committed(_)
        ));
        let recorded = f
            .call(read(&handle, &json!(recorded_thread)))
            .await
            .unwrap();
        let recorded: Value = serde_json::from_str(recorded["data"].as_str().unwrap()).unwrap();
        assert_eq!(
            recorded["conversation"]["target"],
            serde_json::to_value(recorded_target).unwrap()
        );
        let thread = &conversation["data"]["threadId"];
        let reply = f
            .call(read(&handle, thread))
            .await
            .expect("canonical reads must use the committed native conversation identity");
        assert_eq!(reply["type"], "canonicalConversationView");
        let encoded = reply["data"].as_str().unwrap();
        let view: Value = serde_json::from_str(encoded).unwrap();
        assert_eq!(view["version"], 2);
        assert_eq!(view["conversation"]["threadId"], *thread);
        assert_eq!(
            view["conversation"]["target"]["id"],
            conversation["data"]["conversationId"]
        );
        assert_eq!(view["messages"].as_array().unwrap().len(), 1);
        assert_eq!(view["messages"][0]["body"], "Canonical human authorship");
        let committed = native.thread().unwrap().snapshot().await.unwrap();
        let state =
            jj_collab::ThreadStateV1::read(committed.data.root.clone(), &committed.data.graph)
                .unwrap();
        let thread_id: jj_collab::ThreadId = serde_json::from_value(thread.clone()).unwrap();
        let message_id: jj_collab::HumanMessageId =
            serde_json::from_value(view["messages"][0]["message_id"].clone()).unwrap();
        assert_eq!(
            view["references"]["thread"],
            serde_json::to_value(state.threads[&thread_id]).unwrap()
        );
        assert_eq!(
            view["references"]["messages"][view["messages"][0]["message_id"].as_str().unwrap()],
            serde_json::to_value(state.messages[&message_id]).unwrap()
        );
        assert!(view["references"]["metadata"].is_null());
        assert!(encoded.contains("A canonical stored answer"));
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        assert_eq!(f.call(read(&handle, thread)).await.unwrap(), reply);
        let pinned = f.call(open_read(&handle, thread)).await.unwrap();
        let mut pinned_view: Value =
            serde_json::from_str(pinned["data"]["snapshot"].as_str().unwrap()).unwrap();
        assert!(pinned_view["sessions"][0]["records_cursor"].is_string());
        pinned_view["sessions"][0]
            .as_object_mut()
            .unwrap()
            .remove("records_cursor");
        assert_eq!(pinned_view, view);
        assert!(!conversations::private(&f).exists());
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
        f.call(json!({"type":"closeConversationRead","handle":handle,
            "readHandle":pinned["data"]["handle"]}))
            .await
            .unwrap();
    });
}

#[test]
fn canonical_reads_preserve_opaque_source_identity_and_refuse_annotation_threads() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        let conversation = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let native = stores(&f, &conversation);
        let target = jj_collab::ConversationMetadataTargetV1::Conversation {
            id: "external:canonical-conversation".into(),
        };
        for (n, command) in [
            (
                6,
                jj_collab::ThreadCommandV1::CreateConversation {
                    thread_id: jj_collab::ThreadId::new([6; 16]),
                    title: "External canonical label".into(),
                    target: target.clone(),
                },
            ),
            (
                7,
                jj_collab::ThreadCommandV1::CreateAnnotation {
                    thread_id: jj_collab::ThreadId::new([7; 16]),
                    title: "A different domain purpose".into(),
                },
            ),
        ] {
            assert!(matches!(
                native
                    .thread()
                    .unwrap()
                    .execute(&jj_store_core::StoreRequest::new(
                        jj_store_model::RequestId::new([n; 16]),
                        command
                    ))
                    .await
                    .unwrap(),
                jj_store_core::StoreOutcome::Committed(_)
            ));
        }
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        let source = f.call(read(&handle, &json!(id(6)))).await.unwrap();
        let source: Value = serde_json::from_str(source["data"].as_str().unwrap()).unwrap();
        assert_eq!(
            source["conversation"]["target"],
            serde_json::to_value(target).unwrap()
        );
        assert!(f.call(read(&handle, &json!(id(7)))).await.is_err());
    });
}

#[test]
fn canonical_absence_is_read_only_and_foreign_identity_frames_are_refused() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        let unknown = json!(id(9));
        assert!(f.call(read(&handle, &unknown)).await.unwrap()["data"].is_null());
        assert!(f.call(open_read(&handle, &unknown)).await.unwrap()["data"].is_null());
        assert!(!conversations::private(&f).exists());
        assert!(metadata(&f).read().unwrap().is_none());
        for field in [
            "root",
            "actor",
            "conversationId",
            "repository",
            "selection",
            "generation",
        ] {
            let mut frame = read(&handle, &unknown);
            frame[field] = json!("foreign");
            assert!(f.call(frame).await.is_err());
        }
        assert!(
            f.call(read(&json!(uuid::Uuid::new_v4()), &unknown))
                .await
                .is_err()
        );
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        assert!(f.call(read(&handle, &unknown)).await.is_err());
    });
}
