use super::{capture_cases, conversations, *};
use jj_collab::{
    ConversationMetadataTargetV1, ConversationMetadataValueV1, ThreadActionV1, ThreadCommandV1,
    ThreadId, ThreadStateV1,
};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;

fn list(handle: &Value, cursor: Option<&str>) -> Value {
    json!({"type":"listConversations","handle":handle,"cursor":cursor})
}
fn page(reply: Value) -> (String, Value) {
    assert_eq!(reply["type"], "conversationCatalog");
    let text = reply["data"].as_str().unwrap().to_owned();
    let value = serde_json::from_str(&text).unwrap();
    (text, value)
}

#[test]
fn canonical_catalog_reads_empty_source_without_initializing_actor_or_metadata() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        let (_, catalog) = page(
            f.call(list(&handle, None))
                .await
                .expect("committed conversation discovery must support an empty source"),
        );
        assert_eq!(catalog["version"], 1);
        assert!(catalog["conversations"].as_array().unwrap().is_empty());
        assert!(catalog["nextCursor"].is_null());
        assert!(!conversations::private(&f).exists());
        assert!(capture_cases::metadata(&f).read().unwrap().is_none());
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
    });
}

#[test]
fn canonical_catalog_uses_committed_thread_metadata_without_private_creation_records() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        let conversation = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let second = f.call(conversations::prepare(&handle, 4)).await.unwrap();
        let deleted = f.call(conversations::prepare(&handle, 10)).await.unwrap();
        let stores = capture_cases::stores(&f, &conversation);
        let thread = stores.thread().unwrap();
        let snapshot = thread.snapshot().await.unwrap();
        let state = ThreadStateV1::read(snapshot.data.root.clone(), &snapshot.data.graph).unwrap();
        let first_id = serde_json::from_value(conversation["data"]["threadId"].clone()).unwrap();
        let second_id = serde_json::from_value(second["data"]["threadId"].clone()).unwrap();
        let deleted_id = serde_json::from_value(deleted["data"]["threadId"].clone()).unwrap();
        let jj_collab::CollabObjectV1::ThreadVersion(created) =
            snapshot.data.graph.get(state.threads[&first_id]).unwrap()
        else {
            panic!("native conversation header");
        };
        let created_at = created.accepted_at_millis;
        for (n, mut command) in [
            (
                8,
                ThreadCommandV1::Lifecycle {
                    thread_id: second_id,
                    expected: state.threads[&second_id],
                    action: ThreadActionV1::Activate,
                },
            ),
            (
                11,
                ThreadCommandV1::Lifecycle {
                    thread_id: deleted_id,
                    expected: state.threads[&deleted_id],
                    action: ThreadActionV1::Activate,
                },
            ),
            (
                12,
                ThreadCommandV1::Lifecycle {
                    thread_id: deleted_id,
                    expected: state.threads[&deleted_id],
                    action: ThreadActionV1::Tombstone,
                },
            ),
            (
                5,
                ThreadCommandV1::SetMetadata {
                    thread_id: first_id,
                    expected_thread: state.threads[&first_id],
                    expected_metadata: None,
                    target: ConversationMetadataTargetV1::Conversation {
                        id: conversation["data"]["conversationId"]
                            .as_str()
                            .unwrap()
                            .into(),
                    },
                    value: Box::new(ConversationMetadataValueV1 {
                        custom_title: Some("A canonical native title".into()),
                        ..Default::default()
                    }),
                },
            ),
            (
                6,
                ThreadCommandV1::Lifecycle {
                    thread_id: second_id,
                    expected: state.threads[&second_id],
                    action: ThreadActionV1::Archive,
                },
            ),
            (
                7,
                ThreadCommandV1::CreateAnnotation {
                    thread_id: ThreadId::new([7; 16]),
                    title: "Not a conversation".into(),
                },
            ),
        ] {
            if let ThreadCommandV1::Lifecycle {
                thread_id,
                expected,
                ..
            } = &mut command
            {
                let current = thread.snapshot().await.unwrap();
                let state =
                    ThreadStateV1::read(current.data.root.clone(), &current.data.graph).unwrap();
                *expected = state.threads[thread_id];
            }
            assert!(matches!(
                thread
                    .execute(&StoreRequest::new(RequestId::new([n; 16]), command))
                    .await
                    .unwrap(),
                StoreOutcome::Committed(_)
            ));
        }
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let (before, catalog) = page(f.call(list(&handle, None)).await.unwrap());
        let rows = catalog["conversations"].as_array().unwrap();
        assert_eq!(rows.len(), 2);
        let first = rows
            .iter()
            .find(|r| r["target"]["id"] == conversation["data"]["conversationId"])
            .unwrap();
        assert_eq!(first["threadId"], conversation["data"]["threadId"]);
        assert_eq!(first["title"], "A canonical native title");
        assert_eq!(first["createdAtMillis"], created_at);
        assert_eq!(
            first["updatedAtMillis"], 12345,
            "native timestamps may go backwards; the catalog must not rewrite them"
        );
        let archived = rows
            .iter()
            .find(|r| r["target"]["id"] == second["data"]["conversationId"])
            .unwrap();
        assert_eq!(archived["status"], "archived");
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        assert_eq!(
            page(f.call(list(&handle, None)).await.unwrap()).0,
            before,
            "private recovery records cannot become catalog authority"
        );
        assert!(!conversations::private(&f).exists());
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
fn canonical_catalog_pages_are_bound_to_the_original_thread_selection() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        for n in 3..36 {
            f.call(conversations::prepare(&handle, n)).await.unwrap();
        }
        let (_, first) = page(f.call(list(&handle, None)).await.unwrap());
        let rows = first["conversations"].as_array().unwrap();
        assert_eq!(rows.len(), 32);
        let cursor = first["nextCursor"].as_str().unwrap();
        let (_, second) = page(f.call(list(&handle, Some(cursor))).await.unwrap());
        let last = second["conversations"].as_array().unwrap();
        assert_eq!(last.len(), 1);
        assert!(!rows.iter().any(|r| r["threadId"] == last[0]["threadId"]));
        assert!(second["nextCursor"].is_null());
        assert_eq!(first["selection"], second["selection"]);
        f.call(conversations::prepare(&handle, 36)).await.unwrap();
        assert!(
            f.call(list(&handle, Some(cursor))).await.is_err(),
            "a changed source must refuse continuation rather than mix catalog pages"
        );
    });
}

#[test]
fn canonical_catalog_rejects_foreign_frames_and_stale_backend_handles() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        for cursor in ["not-json", "{}", "{\"version\":2}", &"x".repeat(2049)] {
            assert!(f.call(list(&handle, Some(cursor))).await.is_err());
        }
        for field in ["root", "actor", "repository", "selection", "generation"] {
            let mut command = list(&handle, None);
            command[field] = json!("foreign");
            assert!(f.call(command).await.is_err());
        }
        assert!(
            f.call(list(&json!(uuid::Uuid::new_v4()), None))
                .await
                .is_err()
        );
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        assert!(f.call(list(&handle, None)).await.is_err());
    });
}
