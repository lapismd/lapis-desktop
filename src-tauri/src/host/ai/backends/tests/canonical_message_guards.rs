use super::{canonical_message_cases::*, capture_cases, conversations, *};
use jj_collab::{ThreadActionV1, ThreadCommandV1, ThreadId, ThreadStateV1};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;

#[test]
fn canonical_authorship_absence_and_rejected_members_do_not_allocate_an_actor_or_message() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, stores) = setup(&f).await;
        assert!(matches!(
            stores
                .thread()
                .unwrap()
                .execute(&StoreRequest::new(
                    RequestId::new([7; 16]),
                    ThreadCommandV1::CreateAnnotation {
                        thread_id: ThreadId::new([7; 16]),
                        title: "Annotation purpose".into()
                    }
                ))
                .await
                .unwrap(),
            StoreOutcome::Committed(_)
        ));
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        let current = view(&f, &handle, &thread).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(f.call(status(&handle, 10, &thread)).await.unwrap()["data"].is_null());
        for (target, selection) in [
            (thread.clone(), json!([])),
            (thread.clone(), json!([0])),
            (json!(id(7)), current["selection"].clone()),
            (json!(id(99)), current["selection"].clone()),
        ] {
            assert!(
                f.call(append(
                    &handle,
                    10,
                    &target,
                    &selection,
                    "Refuse unavailable member"
                ))
                .await
                .is_err()
            );
            assert!(!conversations::private(&f).exists());
            assert!(!path(&f, 10).parent().unwrap().exists());
        }
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        for (request, action) in [
            (8, ThreadActionV1::Activate),
            (9, ThreadActionV1::Archive),
            (20, ThreadActionV1::Tombstone),
        ] {
            let snapshot = stores.thread().unwrap().snapshot().await.unwrap();
            let state =
                ThreadStateV1::read(snapshot.data.root.clone(), &snapshot.data.graph).unwrap();
            assert!(matches!(
                stores
                    .thread()
                    .unwrap()
                    .execute(&StoreRequest::new(
                        RequestId::new([request; 16]),
                        ThreadCommandV1::Lifecycle {
                            thread_id: ThreadId::new([6; 16]),
                            expected: state.threads[&ThreadId::new([6; 16])],
                            action
                        }
                    ))
                    .await
                    .unwrap(),
                StoreOutcome::Committed(_)
            ));
            if action == ThreadActionV1::Activate {
                continue;
            }
            let unavailable = view(&f, &handle, &thread).await;
            assert!(
                f.call(append(
                    &handle,
                    10,
                    &thread,
                    &unavailable["selection"],
                    "Unavailable lifecycle"
                ))
                .await
                .is_err()
            );
            assert!(!conversations::private(&f).exists());
            assert!(!path(&f, 10).exists());
        }
    });
}

#[test]
fn canonical_authorship_preserves_recorded_targets_and_refuses_surplus_authority() {
    let f = Fixture::new();
    run(async {
        let (handle, _, stores) = setup(&f).await;
        let thread = json!(id(7));
        assert!(matches!(
            stores
                .thread()
                .unwrap()
                .execute(&StoreRequest::new(
                    RequestId::new([7; 16]),
                    ThreadCommandV1::CreateConversation {
                        thread_id: ThreadId::new([7; 16]),
                        title: "A recorded native source".into(),
                        target: jj_collab::ConversationMetadataTargetV1::Recorded {
                            session: jj_agent::AgentSessionId::new([8; 16])
                        }
                    }
                ))
                .await
                .unwrap(),
            StoreOutcome::Committed(_)
        ));
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        let before = view(&f, &handle, &thread).await;
        let command = append(
            &handle,
            10,
            &thread,
            &before["selection"],
            "An authored note on a recorded source",
        );
        for field in [
            "root",
            "actor",
            "repository",
            "conversationId",
            "target",
            "manifest",
            "generation",
            "executable",
        ] {
            let mut invalid = command.clone();
            invalid["message"][field] = json!("outside");
            assert!(f.call(invalid).await.is_err(), "{field}");
        }
        for text in ["", "  \n", "nul\0text"] {
            let mut invalid = command.clone();
            invalid["message"]["text"] = json!(text);
            assert!(f.call(invalid).await.is_err());
        }
        assert!(!conversations::private(&f).exists());
        let written = f.call(command).await.unwrap();
        assert_eq!(
            written["data"]["conversation"]["target"],
            before["conversation"]["target"]
        );
        assert_eq!(
            written["data"]["conversation"]["target"]["type"],
            "recorded"
        );
        assert!(written["data"]["receipt"].is_string());
        assert!(
            f.call(status(&json!(uuid::Uuid::new_v4()), 10, &thread))
                .await
                .is_err()
        );
        std::fs::rename(&f.vault, f.vault.with_extension("retired")).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(f.call(status(&handle, 10, &thread)).await.is_err());
    });
}
