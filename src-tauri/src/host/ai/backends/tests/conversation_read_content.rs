use super::{capture_cases::*, conversation_reads::read, *};
use jj_collab::{
    ConversationMetadataSourceV1, ConversationMetadataTargetV1, ConversationMetadataValueV1,
    GeneratedConversationMetadataV1, ThreadCommandV1, ThreadLinkTargetV1, ThreadStateV1,
};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn conversation_view_preserves_wide_native_metadata_integers_as_json_text() {
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
        let stores = stores(&f, &conversation);
        let thread = stores.thread().unwrap();
        let snapshot = thread.snapshot().await.unwrap();
        let state = ThreadStateV1::read(snapshot.data.root.clone(), &snapshot.data.graph).unwrap();
        let thread_id = serde_json::from_value(conversation["data"]["threadId"].clone()).unwrap();
        let reference = *state.links.values().next().unwrap();
        let jj_collab::CollabObjectV1::ThreadLink(link) =
            snapshot.data.graph.get(reference).unwrap()
        else {
            panic!("session link");
        };
        let ThreadLinkTargetV1::Session {
            session_id,
            snapshot: source,
            ..
        } = link.target
        else {
            panic!("session");
        };
        let request = StoreRequest::new(
            RequestId::new([9; 16]),
            ThreadCommandV1::SetMetadata {
                thread_id,
                expected_thread: state.threads[&thread_id],
                expected_metadata: None,
                target: ConversationMetadataTargetV1::Conversation {
                    id: conversation["data"]["conversationId"]
                        .as_str()
                        .unwrap()
                        .into(),
                },
                value: Box::new(ConversationMetadataValueV1 {
                    generated: Some(GeneratedConversationMetadataV1 {
                        title: "Exact native timestamp".into(),
                        summary: "Native integer proof".into(),
                        keywords: vec![],
                        goals: vec![],
                        sources: vec![ConversationMetadataSourceV1 {
                            session: session_id,
                            snapshot: source,
                        }],
                        provider: "fixture".into(),
                        model: "fixture".into(),
                        prompt_version: 1,
                        generated_at_millis: i64::MAX,
                        truncated: false,
                    }),
                    ..Default::default()
                }),
            },
        );
        assert!(matches!(
            thread.execute(&request).await.unwrap(),
            StoreOutcome::Committed(_)
        ));
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        let reply = f.call(read(&handle, 3)).await.unwrap();
        let encoded = reply["data"].as_str().unwrap();
        assert!(encoded.contains("\"generated_at_millis\":9223372036854775807"));
        let view: Value = serde_json::from_str(encoded).unwrap();
        assert_eq!(
            view["metadata"]["value"]["generated"]["generated_at_millis"].as_i64(),
            Some(i64::MAX)
        );
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
    });
}

#[test]
fn conversation_view_reports_a_continuation_instead_of_claiming_a_complete_transcript() {
    let f = Fixture::new();
    run(async {
        let (handle, _, binding) = setup(&f).await;
        let mut processor = f
            .policy
            .processor(&Fixture::context(), &binding)
            .unwrap()
            .unwrap();
        batch(processor.as_mut(), &binding, 1, &opened(&binding))
            .await
            .unwrap();
        for ordinal in 2..=35 {
            // A prompt fact is a complete message record. Unfinished assistant
            // activity is retained as evidence, not a completed transcript chunk.
            let frame = json!({
                "version":3, "type":"prompt", "sessionId":binding.session_id,
                "requestId":format!("turn-{ordinal}"), "sequence":ordinal + 1,
                "text":format!("Captured user turn {ordinal}"),
            });
            batch(processor.as_mut(), &binding, ordinal, &frame)
                .await
                .unwrap();
        }
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        let reply = f.call(read(&handle, 3)).await.unwrap();
        let view: Value = serde_json::from_str(reply["data"].as_str().unwrap()).unwrap();
        let transcript = &view["sessions"][0]["transcripts"][0];
        let chunks = transcript["chunks"].as_array().unwrap();
        assert_eq!(chunks.len(), 32);
        assert_eq!(
            transcript["next_after_sequence"],
            chunks.last().unwrap()["sequence"]
        );
        assert!(transcript["stream"]["record_count"].as_u64().unwrap() > 32);
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
    });
}
