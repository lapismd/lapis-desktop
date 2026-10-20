use super::{
    capture_cases,
    conversation_edits::{edit, path, view},
    conversations, *,
};
fn status(handle: &Value, request: u8, thread: &Value) -> Value {
    json!({"type":"canonicalConversationEditStatus","handle":handle,"requestId":id(request),"threadId":thread})
}

#[test]
fn canonical_edit_refuses_foreign_authority_and_absent_sources_without_initialization() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        let missing = json!({"conversation":{"threadId":id(8)},"selection":[1,2,3]});
        let rename = json!({"type":"rename","title":"A title"});
        assert!(f.call(status(&handle, 5, &json!(id(8)))).await.unwrap()["data"].is_null());
        assert!(
            f.call(edit(&handle, 5, &missing, rename.clone()))
                .await
                .is_err()
        );
        assert!(!conversations::private(&f).exists());
        assert!(!path(&f, 5).parent().unwrap().exists());
        assert!(capture_cases::metadata(&f).read().unwrap().is_none());
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let observed = view(&f, &handle, &created["data"]["threadId"]).await;
        let native = capture_cases::stores(&f, &created);
        native
            .thread()
            .unwrap()
            .execute(&jj_store_core::StoreRequest::new(
                jj_store_model::RequestId::new([8; 16]),
                jj_collab::ThreadCommandV1::CreateAnnotation {
                    thread_id: jj_collab::ThreadId::new([8; 16]),
                    title: "Annotation only".into(),
                },
            ))
            .await
            .unwrap();
        let current = view(&f, &handle, &created["data"]["threadId"]).await;
        let mut annotation = edit(&handle, 5, &current, rename.clone());
        annotation["edit"]["threadId"] = json!(id(8));
        assert!(f.call(annotation).await.is_err());
        assert!(
            f.call(edit(&handle, 5, &observed, rename.clone()))
                .await
                .is_err()
        );
        for field in [
            "actor",
            "repository",
            "root",
            "generation",
            "expectedThread",
        ] {
            let mut frame = edit(&handle, 5, &current, rename.clone());
            frame["edit"][field] = json!("foreign");
            assert!(f.call(frame).await.is_err(), "{field}");
        }
        for title in [
            "".to_owned(),
            " ".into(),
            "bad\nname".into(),
            "x".repeat(1025),
        ] {
            assert!(
                f.call(edit(
                    &handle,
                    5,
                    &current,
                    json!({"type":"rename","title":title})
                ))
                .await
                .is_err()
            );
        }
        assert!(!path(&f, 5).parent().unwrap().exists());
    });
}

#[test]
fn canonical_edit_cannot_write_before_native_privacy_is_available() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let observed = view(&f, &handle, &created["data"]["threadId"]).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            f.call(edit(
                &handle,
                5,
                &observed,
                json!({"type":"rename","title":capture_cases::TOKEN})
            ))
            .await
            .is_err()
        );
        assert!(!path(&f, 5).parent().unwrap().exists());
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
    });
}

#[test]
fn canonical_lifecycle_retains_native_transitions_and_rejects_stale_selection() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let thread = &created["data"]["threadId"];
        let original = view(&f, &handle, thread).await;
        assert!(
            f.call(edit(
                &handle,
                4,
                &original,
                json!({"type":"lifecycle","action":"archive"})
            ))
            .await
            .is_err()
        );
        assert!(!path(&f, 4).exists());
        for (request, action, expected) in [
            (5, "activate", "active"),
            (6, "archive", "archived"),
            (7, "restore", "idle"),
            (8, "tombstone", "tombstoned"),
        ] {
            let current = view(&f, &handle, thread).await;
            let reply = f
                .call(edit(
                    &handle,
                    request,
                    &current,
                    json!({"type":"lifecycle","action":action}),
                ))
                .await
                .unwrap();
            assert!(reply["data"]["receipt"].is_string());
            assert_eq!(
                view(&f, &handle, thread).await["thread"]["status"],
                expected
            );
        }
        assert!(
            f.call(edit(
                &handle,
                10,
                &original,
                json!({"type":"rename","title":"Stale title"})
            ))
            .await
            .is_err()
        );
        assert!(!path(&f, 10).exists());
        let file = path(&f, 8);
        let original_record = std::fs::read(&file).unwrap();
        let mut altered: Value = serde_json::from_slice(&original_record).unwrap();
        altered["identity"]["target"]["id"] = json!("a-substituted-native-target");
        std::fs::write(&file, serde_json::to_vec(&altered).unwrap()).unwrap();
        assert!(f.call(status(&handle, 8, thread)).await.is_err());
        std::fs::write(&file, original_record).unwrap();
        assert!(f.call(status(&handle, 8, thread)).await.unwrap()["data"]["receipt"].is_string());
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        assert!(f.call(status(&handle, 8, thread)).await.is_err());
    });
}
