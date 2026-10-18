use super::{conversation_reads::read, conversations::*, *};

#[test]
fn absent_conversation_read_initializes_neither_private_intent_nor_companion() {
    let f = Fixture::new();
    run(async {
        let legacy = f.call(open(1)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(read(&legacy, 3)).await.is_err());
        f.call(json!({"type":"close","handle":legacy}))
            .await
            .unwrap();
        let handle = setup(&f).await;
        assert!(f.call(read(&handle, 3)).await.unwrap()["data"].is_null());
        assert!(!private(&f).exists());
        assert!(
            jj_store_jj::local_repository::inspect_workspace(&f.vault)
                .unwrap()
                .repository
                .is_none()
        );
        f.call(prepare(&handle, 3)).await.unwrap();
        let selected = super::capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(f.call(read(&handle, 4)).await.unwrap()["data"].is_null());
        assert!(!private(&f).join(format!("{}.json", id(4))).exists());
        assert_eq!(
            super::capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
    });
}

#[test]
fn reads_prove_original_receipts_without_repairing_missing_local_confirmation() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        let original = f.call(prepare(&handle, 3)).await.unwrap();
        let mut retained = record(&f, 3);
        retained["receipt"] = Value::Null;
        replace(&f, 3, &retained);
        let path = private(&f).join(format!("{}.json", id(3)));
        let bytes = std::fs::read(&path).unwrap();
        let selected = super::capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let reply = f.call(read(&handle, 3)).await.unwrap();
        let view: Value = serde_json::from_str(reply["data"].as_str().unwrap()).unwrap();
        assert_eq!(view["conversation"], original["data"]);
        assert!(view["sessions"].as_array().unwrap().is_empty());
        assert_eq!(std::fs::read(&path).unwrap(), bytes);
        assert_eq!(
            super::capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
    });
}

#[test]
fn unknown_or_substituted_private_intents_never_return_a_valid_conversation_view() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        f.call(prepare(&handle, 3)).await.unwrap();
        let original = record(&f, 3);
        let selected = super::capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        for pointer in [
            "/source/0",
            "/actor",
            "/selection/revision",
            "/repository",
            "/receipt/intent",
            "/receipt/actor",
            "/receipt/repository",
            "/request/command/intent/title",
        ] {
            let mut changed = original.clone();
            let field = changed.pointer_mut(pointer).unwrap();
            *field = if pointer == "/source/0" {
                json!((field.as_u64().unwrap() + 1) % 256)
            } else if field.is_number() {
                json!(999)
            } else if pointer == "/receipt/intent" {
                json!(id(9).repeat(2))
            } else {
                json!("09090909090909090909090909090909")
            };
            replace(&f, 3, &changed);
            let bytes = std::fs::read(private(&f).join(format!("{}.json", id(3)))).unwrap();
            assert!(f.call(read(&handle, 3)).await.is_err(), "{pointer}");
            assert_eq!(
                std::fs::read(private(&f).join(format!("{}.json", id(3)))).unwrap(),
                bytes
            );
        }
        let mut unknown = original.clone();
        unknown["receipt"] = Value::Null;
        unknown["request"]["request_id"] = json!(id(4));
        unknown["request"]["command"]["intent"]["thread_id"] = json!(id(4));
        replace(&f, 4, &unknown);
        assert!(
            f.call(read(&handle, 4))
                .await
                .unwrap_err()
                .to_string()
                .contains("unknown")
        );
        assert_eq!(record(&f, 4), unknown);
        replace(&f, 3, &original);
        let actor = std::fs::read(private(&f).join("actor.json")).unwrap();
        std::fs::write(
            private(&f).join("actor.json"),
            serde_json::to_vec(&id(9)).unwrap(),
        )
        .unwrap();
        assert!(f.call(read(&handle, 3)).await.is_err());
        std::fs::write(private(&f).join("actor.json"), actor).unwrap();
        assert!(f.call(read(&handle, 3)).await.unwrap()["data"].is_string());
        assert_eq!(
            super::capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
    });
}

#[test]
fn conversation_reads_reject_renderer_authority_stale_handles_and_replaced_sources() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        f.call(prepare(&handle, 3)).await.unwrap();
        for key in [
            "root",
            "generation",
            "repository",
            "actor",
            "selection",
            "threadId",
            "conversationId",
        ] {
            let mut frame = read(&handle, 3);
            frame[key] = json!("outside");
            assert!(f.call(frame).await.is_err());
        }
        assert!(f.call(read(&json!(uuid::Uuid::new_v4()), 3)).await.is_err());
        f.backends.suspend("main").unwrap();
        f.host.0.lock().unwrap().ai.leave("main", true);
        assert!(f.call(read(&handle, 3)).await.is_err());
        f.activate();
        assert!(f.call(read(&handle, 3)).await.is_err());
        let fresh = f.call(open(5)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(read(&handle, 3)).await.is_err());
        assert!(f.call(read(&fresh, 3)).await.unwrap()["data"].is_string());
        std::fs::rename(&f.vault, f.vault.with_extension("retired")).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(f.call(read(&fresh, 3)).await.is_err());
    });
}

#[test]
fn reading_an_original_conversation_never_selects_a_newer_conversations_thread() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        let first = f.call(prepare(&handle, 3)).await.unwrap();
        let second = f.call(prepare(&handle, 4)).await.unwrap();
        let selected = super::capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        for (request, original) in [(3, first), (4, second)] {
            let response = f.call(read(&handle, request)).await.unwrap();
            let view: Value = serde_json::from_str(response["data"].as_str().unwrap()).unwrap();
            assert_eq!(view["conversation"], original["data"]);
            assert_eq!(view["thread"]["thread_id"], original["data"]["threadId"]);
            assert_eq!(
                view["thread"]["purpose"]["target"]["id"],
                original["data"]["conversationId"]
            );
        }
        assert_eq!(
            super::capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
    });
}
