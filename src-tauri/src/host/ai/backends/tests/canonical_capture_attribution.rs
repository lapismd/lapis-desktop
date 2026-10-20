use super::{
    canonical_capture_cases::*, canonical_message_cases, capture_cases,
    conversation_read_canonical, conversation_record_reads, conversations, *,
};

fn participant() -> Value {
    json!({"profileId":"reviewer", "label":"Migration reviewer", "preferredModel":"preferred-model", "preferredEffort":"high"})
}
async fn pages(f: &Fixture, handle: &Value, opened: &Value) -> Vec<Value> {
    let view = conversation_record_reads::view(opened);
    let mut after = 0;
    let mut records = Vec::new();
    loop {
        let reply = f
            .call(conversation_record_reads::records(
                handle, opened, &view, after,
            ))
            .await
            .unwrap();
        let page = conversation_record_reads::page(&reply);
        records.extend(page["records"].as_array().unwrap().iter().cloned());
        match page["next_after_index"].as_u64() {
            Some(next) => after = next.try_into().unwrap(),
            None => break,
        }
    }
    records
}

#[test]
fn two_participants_can_share_one_stable_human_request_without_duplicating_authorship() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        let mut first = prepare(&handle, 10, &thread, &before["selection"]);
        first["participant"] = participant();
        let first = f.call(first).await.unwrap();
        let (first_binding, mut first_worker) = processor(&f, &first);
        capture_cases::batch(
            first_worker.as_mut(),
            &first_binding,
            1,
            &capture_cases::opened(&first_binding),
        )
        .await
        .unwrap();
        prompt(
            first_worker.as_mut(),
            &first_binding,
            11,
            "One contribution for both participants",
        )
        .await
        .unwrap();
        let after_first = canonical_message_cases::view(&f, &handle, &thread).await;
        let mut second = prepare(&handle, 12, &thread, &after_first["selection"]);
        second["participant"] = participant();
        second["participant"]["profileId"] = json!("writer");
        second["participant"]["label"] = json!("Writer");
        let second = f.call(second).await.unwrap();
        let (second_binding, mut second_worker) = processor(&f, &second);
        capture_cases::batch(
            second_worker.as_mut(),
            &second_binding,
            1,
            &capture_cases::opened(&second_binding),
        )
        .await
        .unwrap();
        prompt(
            second_worker.as_mut(),
            &second_binding,
            11,
            "One contribution for both participants",
        )
        .await
        .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert_eq!(current["messages"].as_array().unwrap().len(), 1);
        assert_eq!(
            current["messages"][0]["message_id"],
            after_first["messages"][0]["message_id"]
        );
        assert_eq!(current["sessions"].as_array().unwrap().len(), 2);
        assert_ne!(first_binding.session_id, second_binding.session_id);
        drop(first_worker);
        drop(second_worker);
    });
}

#[test]
fn native_agent_facts_and_authored_references_survive_capture_and_creation_cache_loss() {
    let f = Fixture::new();
    let _client = client(&f);
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        let mut command = prepare(&handle, 10, &thread, &before["selection"]);
        command["participant"] = participant();
        let prepared = f.call(command.clone()).await.unwrap();
        let mut changed = command.clone();
        changed["participant"]["label"] = json!("Substituted participant");
        assert!(f.call(changed).await.is_err());
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
            "The original human contribution",
        )
        .await
        .unwrap();
        let request = uuid::Uuid::from_bytes([11; 16]).to_string();
        let spoof = json!({"schema":999,"participant":{"label":"Provider forgery"}});
        let captured_prompt = json!({"version":3,"type":"prompt","sessionId":binding.session_id,
            "requestId":request,"sequence":3,"text":"The original human contribution plus separately injected context",
            "lapisDesktop":spoof});
        capture_cases::batch(processor.as_mut(), &binding, 2, &captured_prompt)
            .await
            .unwrap();
        let mut text = capture_cases::text(&binding, "An associated native reply");
        text["requestId"] = json!(request);
        capture_cases::batch(processor.as_mut(), &binding, 3, &text)
            .await
            .unwrap();
        let mut terminal = capture_cases::terminal(&binding);
        terminal["requestId"] = json!(request);
        capture_cases::batch(processor.as_mut(), &binding, 4, &terminal)
            .await
            .unwrap();
        let proof = canonical_message_cases::record(&f, 11);
        let receipt: jj_store_git::repository::LocalCollabReceipt =
            serde_json::from_value(proof["receipt"].clone()).unwrap();
        let jj_collab::CollabCommandResultV1::Thread { result } = &receipt.result else {
            panic!("thread receipt");
        };
        let opened = f
            .call(conversation_read_canonical::open_read(&handle, &thread))
            .await
            .unwrap();
        let records = pages(&f, &handle, &opened).await;
        let facts = records
            .iter()
            .filter_map(|r| r["projection"]["value"].get("desktop"))
            .collect::<Vec<_>>();
        assert!(!facts.is_empty());
        for fact in &facts {
            assert_eq!(fact["participant"], participant());
            assert_eq!(fact["clientId"], "codex");
            assert!(fact.get("observedModel").is_none());
            assert!(fact["participant"].get("avatar").is_none());
        }
        let authored = facts
            .iter()
            .filter_map(|f| f.get("authored"))
            .find(|v| !v.is_null())
            .unwrap();
        assert_eq!(authored["requestId"], id(11));
        assert_eq!(authored["messageId"], proof["message"]);
        assert_eq!(authored["revision"], json!(result.message.unwrap()));
        assert_eq!(authored["threadVersion"], json!(result.version));
        let mut found_provider = false;
        for record in &records {
            if record["projection"]["type"] != "observation_batch" {
                continue;
            }
            for observation in record["projection"]["value"]["observations"]
                .as_array()
                .unwrap()
            {
                let envelope: Value =
                    serde_json::from_str(observation["payload"]["text"].as_str().unwrap()).unwrap();
                assert!(
                    envelope["binding"]["scope"]
                        .as_str()
                        .unwrap()
                        .starts_with("notes-canonical-v2:")
                );
                if envelope["frames"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|frame| frame["lapisDesktop"]["provider"] == spoof)
                {
                    found_provider = true;
                }
            }
        }
        assert!(
            found_provider,
            "a colliding provider value remains inert evidence"
        );
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        prompt(
            processor.as_mut(),
            &binding,
            12,
            "A later native contribution",
        )
        .await
        .unwrap();
        assert_eq!(
            pages(&f, &handle, &opened).await,
            records,
            "the original companion proof graph remains pinned"
        );
        f.call(json!({"type":"closeConversationRead","handle":handle,"readHandle":opened["data"]["handle"]})).await.unwrap();
        drop(processor);
    });
}

#[test]
fn participant_fields_remain_presentation_and_cannot_admit_avatar_or_executable_authority() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = setup(&f).await;
        for (field, value) in [
            ("avatar", json!("file:///private/image")),
            ("executable", json!("outside")),
            ("profileId", json!("x".repeat(65))),
            ("label", json!("")),
            ("preferredEffort", json!("unbounded")),
            ("preferredModel", json!("x".repeat(257))),
        ] {
            let mut command = prepare(&handle, 10, &thread, &before["selection"]);
            command["participant"] = participant();
            command["participant"][field] = value;
            assert!(f.call(command).await.is_err(), "{field}");
            assert!(!conversations::private(&f).exists());
            assert!(
                f.backends.owners.lock().unwrap()["main"]
                    .canonical_captures
                    .is_empty()
            );
        }
    });
}
