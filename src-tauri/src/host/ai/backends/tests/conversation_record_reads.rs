use super::{capture_cases::*, conversation_read_canonical::open_read, *};
use tauri_plugin_lapis_ai::HostPolicy;

pub(super) fn records(handle: &Value, opened: &Value, view: &Value, after: u32) -> Value {
    json!({"type":"readConversationRecords","handle":handle,
        "readHandle":opened["data"]["handle"],
        "cursor":view["sessions"][0]["records_cursor"],"afterIndex":after})
}
pub(super) fn view(opened: &Value) -> Value {
    serde_json::from_str(opened["data"]["snapshot"].as_str().unwrap()).unwrap()
}
pub(super) fn page(reply: &Value) -> Value {
    assert_eq!(reply["type"], "conversationRecords");
    serde_json::from_str(reply["data"].as_str().unwrap()).unwrap()
}

#[test]
fn retained_records_keep_typed_objects_and_the_original_selection_through_later_capture() {
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
        for ordinal in 2..=20 {
            batch(
                processor.as_mut(),
                &binding,
                ordinal,
                &json!({
                    "version":3,"type":"prompt","sessionId":binding.session_id,
                    "requestId":format!("turn-{ordinal}"),"sequence":ordinal+1,
                    "text":format!("Stored human message {ordinal}")
                }),
            )
            .await
            .unwrap();
        }
        batch(
            processor.as_mut(),
            &binding,
            21,
            &text(&binding, "Stored assistant answer"),
        )
        .await
        .unwrap();
        batch(processor.as_mut(), &binding, 22, &terminal(&binding))
            .await
            .unwrap();
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        let prepared = f
            .call(json!({"type":"openConversationRead","handle":handle,"requestId":id(3)}))
            .await
            .unwrap();
        let prepared_view = view(&prepared);
        let prepared_request = records(&handle, &prepared, &prepared_view, 0);
        let prepared_page = page(&f.call(prepared_request.clone()).await.unwrap());
        assert_eq!(prepared_page["version"], 1);
        assert_eq!(prepared_page["conversation_request_id"], id(3));
        assert_eq!(prepared_page["selection"], prepared_view["selection"]);
        let canonical = f
            .call(open_read(&handle, &conversation["data"]["threadId"]))
            .await
            .unwrap();
        let original_view = view(&canonical);
        let request = records(&handle, &canonical, &original_view, 0);
        let original = f.call(request.clone()).await.unwrap();
        let first = page(&original);
        assert_eq!(first["version"], 2);
        assert_eq!(first["conversation"], original_view["conversation"]);
        assert_eq!(first["selection"], original_view["selection"]);
        assert_eq!(
            first["session_id"],
            original_view["sessions"][0]["snapshot"]["session_id"]
        );
        assert_eq!(first["after_index"], 0);
        assert_eq!(first["records"].as_array().unwrap().len(), 16);
        assert_eq!(first["next_after_index"], 16);
        let mut after = 0u32;
        let mut found = std::collections::BTreeMap::new();
        loop {
            let current = page(
                &f.call(records(&handle, &canonical, &original_view, after))
                    .await
                    .unwrap(),
            );
            assert_eq!(current["selection"], original_view["selection"]);
            let entries = current["records"].as_array().unwrap();
            assert!(entries.len() <= 16);
            let bytes: usize = entries
                .iter()
                .map(|v| serde_json::to_vec(v).unwrap().len())
                .sum();
            assert!(bytes <= 1536 * 1024);
            for record in entries {
                let key = record["reference"].to_string();
                assert!(found.insert(key, record.clone()).is_none());
                assert_eq!(record["reference"]["kind"], record["projection"]["type"]);
            }
            let Some(next) = current["next_after_index"].as_u64() else {
                break;
            };
            assert_eq!(next, u64::from(after) + entries.len() as u64);
            after = u32::try_from(next).unwrap();
        }
        for kind in ["event_batches", "evidence"] {
            for reference in original_view["sessions"][0]["snapshot"][kind]
                .as_array()
                .unwrap()
            {
                assert!(found.contains_key(&reference.to_string()));
            }
        }
        let answer = found
            .values()
            .find(|v| {
                v["projection"]["type"] == "content"
                    && v["projection"]["value"]["payload"]["text"] == "Stored assistant answer"
            })
            .expect("typed native content");
        assert_eq!(
            answer["projection"]["value"]["payload"]["media_type"],
            "text"
        );
        assert!(
            found
                .values()
                .any(|v| v["projection"]["type"] == "event_batch")
        );
        assert!(
            found
                .values()
                .any(|v| v["projection"]["type"] == "observation_batch")
        );
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
        batch(
            processor.as_mut(),
            &binding,
            23,
            &json!({
                "version":3,"type":"prompt","sessionId":binding.session_id,
                "requestId":"later-turn","sequence":83,"text":"Later capture"
            }),
        )
        .await
        .unwrap();
        let advanced = metadata(&f).read().unwrap().unwrap().commit();
        assert_ne!(advanced, selected);
        assert_eq!(f.call(request.clone()).await.unwrap(), original);
        drop(processor);
        std::fs::remove_dir_all(super::conversations::private(&f)).unwrap();
        assert_eq!(f.call(request.clone()).await.unwrap(), original);
        assert!(f.call(prepared_request).await.is_err());
        assert!(!super::conversations::private(&f).exists());
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), advanced);
        f.call(json!({"type":"closeConversationRead","handle":handle,"readHandle":canonical["data"]["handle"]})).await.unwrap();
        assert!(f.call(request).await.is_err());
    });
}

#[test]
fn retained_records_refuse_unissued_offsets_foreign_pins_and_surplus_authority() {
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
        let canonical = f
            .call(open_read(&handle, &conversation["data"]["threadId"]))
            .await
            .unwrap();
        let request = records(&handle, &canonical, &view(&canonical), 0);
        f.call(request.clone()).await.unwrap();
        for after in [
            json!(1),
            json!(-1),
            json!(1.5),
            json!("0"),
            json!(4294967296u64),
        ] {
            let mut invalid = request.clone();
            invalid["afterIndex"] = after;
            assert!(f.call(invalid).await.is_err());
        }
        for field in [
            "root",
            "actor",
            "selection",
            "repository",
            "sessionId",
            "object",
            "sourceGeneration",
        ] {
            let mut invalid = request.clone();
            invalid[field] = json!("outside");
            assert!(f.call(invalid).await.is_err(), "{field}");
        }
        for field in ["handle", "readHandle", "cursor"] {
            let mut invalid = request.clone();
            invalid[field] = json!(uuid::Uuid::new_v4());
            assert!(f.call(invalid).await.is_err(), "{field}");
        }
        let other = f
            .call(open_read(&handle, &conversation["data"]["threadId"]))
            .await
            .unwrap();
        let mut substituted = request.clone();
        substituted["readHandle"] = other["data"]["handle"].clone();
        assert!(f.call(substituted).await.is_err());
        f.backends.suspend("main").unwrap();
        f.host.0.lock().unwrap().ai.leave("main", true);
        assert!(f.call(request).await.is_err());
    });
}
