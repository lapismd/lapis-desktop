use super::{
    capture_cases::*,
    conversation_edits::{edit, view},
    *,
};
use jj_collab::{
    ConversationMetadataSourceV1, ConversationMetadataValueV1, GeneratedConversationMetadataV1,
    ThreadCommandV1, ThreadStateV1,
};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn canonical_rename_preserves_generated_and_acp_metadata_for_opaque_targets() {
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
            &text(&binding, "A committed source answer"),
        )
        .await
        .unwrap();
        drop(processor);
        let native = stores(&f, &conversation);
        let thread = native.thread().unwrap();
        let original = view(&f, &handle, &conversation["data"]["threadId"]).await;
        let source = ConversationMetadataSourceV1 {
            session: serde_json::from_value(
                original["sessions"][0]["snapshot"]["session_id"].clone(),
            )
            .unwrap(),
            snapshot: serde_json::from_value(
                original["sessions"][0]["link"]["target"]["snapshot"].clone(),
            )
            .unwrap(),
        };
        let target = jj_collab::ConversationMetadataTargetV1::Conversation {
            id: "opaque:portable-conversation".into(),
        };
        let id = jj_collab::ThreadId::new([8; 16]);
        let created = thread
            .execute(&StoreRequest::new(
                RequestId::new([8; 16]),
                ThreadCommandV1::CreateConversation {
                    thread_id: id,
                    title: "Original native title".into(),
                    target: target.clone(),
                },
            ))
            .await
            .unwrap();
        assert!(matches!(created, StoreOutcome::Committed(_)));
        let current = thread.snapshot().await.unwrap();
        let state = ThreadStateV1::read(current.data.root.clone(), &current.data.graph).unwrap();
        let value = ConversationMetadataValueV1 {
            custom_title: Some("Prior custom title".into()),
            generated: Some(GeneratedConversationMetadataV1 {
                title: "A generated title".into(),
                summary: "Retained source summary".into(),
                keywords: vec!["source".into()],
                goals: vec!["Keep metadata".into()],
                sources: vec![source.clone()],
                provider: "fixture".into(),
                model: "fixture".into(),
                prompt_version: 1,
                generated_at_millis: 12345,
                truncated: false,
            }),
            agent_titles: std::collections::BTreeMap::from([(
                "participant".into(),
                "ACP suggestion".into(),
            )]),
            agent_title_sources: std::collections::BTreeMap::from([("participant".into(), source)]),
        };
        assert!(matches!(
            thread
                .execute(&StoreRequest::new(
                    RequestId::new([9; 16]),
                    ThreadCommandV1::SetMetadata {
                        thread_id: id,
                        expected_thread: state.threads[&id],
                        expected_metadata: None,
                        target: target.clone(),
                        value: Box::new(value.clone())
                    }
                ))
                .await
                .unwrap(),
            StoreOutcome::Committed(_)
        ));
        std::fs::remove_dir_all(super::conversations::private(&f)).unwrap();
        let observed = view(&f, &handle, &json!(id)).await;
        let written = f
            .call(edit(
                &handle,
                10,
                &observed,
                json!({"type":"rename","title":"Renamed conversation"}),
            ))
            .await
            .unwrap();
        assert_eq!(written["data"]["conversation"]["target"], json!(target));
        let mut expected = value;
        expected.custom_title = Some("Renamed conversation".into());
        let after = view(&f, &handle, &json!(id)).await;
        assert_eq!(after["metadata"]["value"], json!(expected));
        f.call(edit(
            &handle,
            11,
            &after,
            json!({"type":"rename","title":null}),
        ))
        .await
        .unwrap();
        expected.custom_title = None;
        assert_eq!(
            view(&f, &handle, &json!(id)).await["metadata"]["value"],
            json!(expected)
        );
    });
}
