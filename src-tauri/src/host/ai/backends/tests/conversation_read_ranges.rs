use super::{capture_cases::*, *};
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn conversation_read_continuation_keeps_the_original_snapshot_after_capture_advances() {
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
        for ordinal in 2..=35 {
            batch(
                processor.as_mut(),
                &binding,
                ordinal,
                &json!({
                    "version":3,"type":"prompt","sessionId":binding.session_id,
                    "requestId":format!("turn-{ordinal}"),"sequence":ordinal+1,
                    "text":format!("Captured user turn {ordinal}")
                }),
            )
            .await
            .unwrap();
        }
        let before = metadata(&f).read().unwrap().unwrap().commit();
        let opened = f
            .call(json!({
                "type":"openConversationRead","handle":handle,"requestId":id(3)
            }))
            .await
            .expect("ordinary native continuation must open a pinned read");
        let view: Value =
            serde_json::from_str(opened["data"]["snapshot"].as_str().unwrap()).unwrap();
        let transcript = &view["sessions"][0]["transcripts"][0];
        let first = transcript["chunks"].as_array().unwrap();
        assert_eq!(first.len(), 32);
        let request = json!({
            "type":"readConversationTranscript","handle":handle,
            "readHandle":opened["data"]["handle"],"cursor":transcript["cursor"],
            "afterSequence":transcript["next_after_sequence"].as_u64().unwrap().to_string()
        });
        let original = f.call(request.clone()).await.unwrap();
        assert_eq!(original["type"], "transcriptRange");
        let page: Value = serde_json::from_str(original["data"].as_str().unwrap()).unwrap();
        assert_eq!(page["selection"], view["selection"]);
        let remaining = page["transcript"]["chunks"].as_array().unwrap();
        assert_eq!(remaining.len(), 2);
        assert!(page["transcript"]["next_after_sequence"].is_null());
        let canonical = f
            .call(super::conversation_read_canonical::open_read(
                &handle,
                &conversation["data"]["threadId"],
            ))
            .await
            .unwrap();
        let canonical_view: Value =
            serde_json::from_str(canonical["data"]["snapshot"].as_str().unwrap()).unwrap();
        assert_eq!(canonical_view["version"], 2);
        let canonical_stream = &canonical_view["sessions"][0]["transcripts"][0];
        let canonical_request = json!({
            "type":"readConversationTranscript","handle":handle,
            "readHandle":canonical["data"]["handle"],"cursor":canonical_stream["cursor"],
            "afterSequence":canonical_stream["next_after_sequence"].as_u64().unwrap().to_string(),
        });
        let canonical_original = f.call(canonical_request.clone()).await.unwrap();
        let canonical_page: Value =
            serde_json::from_str(canonical_original["data"].as_str().unwrap()).unwrap();
        assert_eq!(canonical_page["version"], 2);
        assert_eq!(
            canonical_page["transcript"]["chunks"],
            page["transcript"]["chunks"]
        );
        assert_eq!(
            canonical_page["conversation"],
            canonical_view["conversation"]
        );
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), before);
        for after in [
            "0",
            "01",
            "-1",
            "1.0",
            "18446744073709551616",
            "9007199254740993",
        ] {
            let mut invalid = request.clone();
            invalid["afterSequence"] = json!(after);
            assert!(f.call(invalid).await.is_err(), "{after}");
        }
        let mut invalid = request.clone();
        invalid["afterSequence"] = json!(32);
        assert!(f.call(invalid).await.is_err());
        for key in [
            "root",
            "selection",
            "manifest",
            "sessionId",
            "sourceGeneration",
        ] {
            let mut invalid = request.clone();
            invalid[key] = json!("outside");
            assert!(f.call(invalid).await.is_err(), "{key}");
        }
        let other = f
            .call(json!({"type":"openConversationRead","handle":handle,
            "requestId":id(3)}))
            .await
            .unwrap();
        let mut substituted = request.clone();
        substituted["readHandle"] = other["data"]["handle"].clone();
        assert!(f.call(substituted).await.is_err());
        let original_record = super::conversations::record(&f, 3);
        let mut replaced = original_record.clone();
        replaced["receipt"]["actor"] = json!(id(9));
        super::conversations::replace(&f, 3, &replaced);
        assert!(f.call(request.clone()).await.is_err());
        assert_eq!(
            f.call(canonical_request.clone()).await.unwrap(),
            canonical_original
        );
        assert_eq!(super::conversations::record(&f, 3), replaced);
        super::conversations::replace(&f, 3, &original_record);
        assert_eq!(f.call(request.clone()).await.unwrap(), original);
        batch(
            processor.as_mut(),
            &binding,
            36,
            &json!({
                "version":3,"type":"prompt","sessionId":binding.session_id,
                "requestId":"later-turn","sequence":37,"text":"Later native capture"
            }),
        )
        .await
        .unwrap();
        let advanced = metadata(&f).read().unwrap().unwrap().commit();
        assert_ne!(advanced, before);
        assert_eq!(f.call(request.clone()).await.unwrap(), original);
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), advanced);
        let close = json!({"type":"closeConversationRead","handle":handle,
            "readHandle":opened["data"]["handle"]});
        f.call(close.clone()).await.unwrap();
        f.call(close).await.unwrap();
        assert!(f.call(request).await.is_err());
        drop(processor);
        std::fs::remove_dir_all(super::conversations::private(&f)).unwrap();
        assert_eq!(
            f.call(canonical_request.clone()).await.unwrap(),
            canonical_original
        );
        assert!(!super::conversations::private(&f).exists());
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), advanced);
        f.call(json!({"type":"closeConversationRead","handle":handle,
            "readHandle":canonical["data"]["handle"]}))
            .await
            .unwrap();
        assert!(f.call(canonical_request).await.is_err());
    });
}
