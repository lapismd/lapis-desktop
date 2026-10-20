use super::{
    canonical_capture_cases, canonical_dispatch_cases::*, canonical_message_cases, capture_cases, *,
};
use jj_collab::{ThreadCommandV1, ThreadId};
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn journalled_plan_transfers_once_and_replay_does_not_need_the_old_graph_selection() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        f.call(begin(&handle, 10, &thread, &before["selection"], false))
            .await
            .unwrap();
        let command = prepare(&handle, 11, 10, &thread, &before["selection"]);
        let prepared = f.call(command.clone()).await.unwrap();
        assert_eq!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .len(),
            1
        );
        let (binding, mut processor) = canonical_capture_cases::processor(&f, &prepared);
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
        assert!(
            f.policy.processor(&Fixture::context(), &binding).is_err(),
            "the factory transfer itself is single-use"
        );
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        assert_ne!(current["selection"], before["selection"]);
        assert_eq!(
            f.call(command).await.unwrap(),
            prepared,
            "the original durable reservation survives metadata advancement"
        );
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
        assert!(
            f.policy
                .resolve(&Fixture::context(), &binding.target_id, None)
                .is_err()
        );
        drop(processor);
        assert_eq!(
            f.call(status(&handle, Some(10), &thread)).await.unwrap()["data"]["recipients"][0]["phase"],
            "bound"
        );
        f.call(stop(&handle, 10, &thread)).await.unwrap();
    });
}

#[test]
fn more_than_sixty_four_spent_plans_do_not_fill_the_volatile_queue_or_erase_unknown_turns() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, _, _, stores) = canonical_capture_cases::setup(&f).await;
        for n in 16..=80u8 {
            let thread = ThreadId::new([n; 16]);
            assert!(matches!(
                stores
                    .thread()
                    .unwrap()
                    .execute(&StoreRequest::new(
                        RequestId::new([n; 16]),
                        ThreadCommandV1::CreateConversation {
                            thread_id: thread,
                            title: format!("Lifecycle {n}"),
                            target: jj_collab::ConversationMetadataTargetV1::Conversation {
                                id: format!("native:lifetime:{n}")
                            }
                        }
                    ))
                    .await
                    .unwrap(),
                StoreOutcome::Committed(_)
            ));
            let thread = json!(thread);
            let view = canonical_message_cases::view(&f, &handle, &thread).await;
            let mut dispatch = begin(&handle, n + 100, &thread, &view["selection"], false);
            dispatch["input"]["recipients"][0]["requestId"] = json!(id(n + 170));
            f.call(dispatch).await.unwrap();
            let prepared = f
                .call(prepare(
                    &handle,
                    n + 170,
                    n + 100,
                    &thread,
                    &view["selection"],
                ))
                .await
                .unwrap();
            let (binding, processor) = canonical_capture_cases::processor(&f, &prepared);
            assert!(
                f.backends.owners.lock().unwrap()["main"]
                    .canonical_captures
                    .is_empty()
            );
            drop(processor);
            assert!(
                f.policy
                    .resolve(&Fixture::context(), &binding.target_id, None)
                    .is_err()
            );
            let pending = f
                .call(status(&handle, Some(n + 100), &thread))
                .await
                .unwrap();
            assert_eq!(pending["data"]["recipients"][0]["phase"], "reserved");
            assert_eq!(pending["data"]["settled"], false);
            assert_eq!(
                f.call(begin(&handle, 254, &thread, &view["selection"], false))
                    .await
                    .unwrap_err()
                    .kind(),
                std::io::ErrorKind::WouldBlock
            );
        }
    });
}

#[test]
fn failed_processor_allocation_spends_the_grant_and_does_not_refund_it() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        f.call(begin(&handle, 10, &thread, &before["selection"], false))
            .await
            .unwrap();
        let command = prepare(&handle, 11, 10, &thread, &before["selection"]);
        let prepared = f.call(command.clone()).await.unwrap();
        let binding = capture_cases::binding(&f, &prepared);
        f.policy
            .resolve(&Fixture::context(), &binding.target_id, None)
            .unwrap();
        let mut permits = Vec::new();
        for n in 0..64 {
            let mut other = binding.clone();
            other.session_id = format!("held-native-worker-{n}");
            permits.push(
                f.backends
                    .register_processing(&f.host, &Fixture::context(), &other)
                    .unwrap(),
            );
        }
        assert!(f.policy.processor(&Fixture::context(), &binding).is_err());
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .is_empty()
        );
        drop(permits);
        assert_eq!(f.call(command).await.unwrap(), prepared);
        assert!(
            f.policy
                .resolve(&Fixture::context(), &binding.target_id, None)
                .is_err()
        );
        assert!(f.policy.processor(&Fixture::context(), &binding).is_err());
        f.call(stop(&handle, 10, &thread)).await.unwrap();
    });
}

#[test]
fn full_queue_rejects_a_new_target_but_can_read_a_retired_reservation_without_restoring_it() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, _, _, stores) = canonical_capture_cases::setup(&f).await;
        let mut retired = None;
        for n in 15..=80u8 {
            let thread = ThreadId::new([n; 16]);
            assert!(matches!(
                stores
                    .thread()
                    .unwrap()
                    .execute(&StoreRequest::new(
                        RequestId::new([n; 16]),
                        ThreadCommandV1::CreateConversation {
                            thread_id: thread,
                            title: format!("Queue {n}"),
                            target: jj_collab::ConversationMetadataTargetV1::Conversation {
                                id: format!("native:queue:{n}")
                            }
                        }
                    ))
                    .await
                    .unwrap(),
                StoreOutcome::Committed(_)
            ));
            let thread = json!(thread);
            let view = canonical_message_cases::view(&f, &handle, &thread).await;
            let mut dispatch = begin(&handle, n + 100, &thread, &view["selection"], false);
            dispatch["input"]["recipients"][0]["requestId"] = json!(id(n + 170));
            f.call(dispatch).await.unwrap();
            let command = prepare(&handle, n + 170, n + 100, &thread, &view["selection"]);
            if n == 80 {
                assert_eq!(
                    f.call(command).await.unwrap_err().kind(),
                    std::io::ErrorKind::WouldBlock
                );
                let pending = f
                    .call(status(&handle, Some(n + 100), &thread))
                    .await
                    .unwrap();
                assert!(pending["data"]["recipients"][0]["targetId"].is_null());
                assert_eq!(pending["data"]["recipients"][0]["phase"], "planned");
                assert!(
                    !capture_cases::profile(&f)
                        .join("canonical-dispatch-requests-v1")
                        .join(format!("{}.json", id(n + 170)))
                        .exists()
                );
            } else {
                let prepared = f.call(command.clone()).await.unwrap();
                if n == 15 {
                    let (_, processor) = canonical_capture_cases::processor(&f, &prepared);
                    drop(processor);
                    retired = Some((command, prepared));
                }
            }
        }
        assert_eq!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .len(),
            64
        );
        let (command, prepared) = retired.unwrap();
        assert_eq!(f.call(command).await.unwrap(), prepared);
        assert_eq!(
            f.backends.owners.lock().unwrap()["main"]
                .canonical_captures
                .len(),
            64
        );
        assert!(
            f.policy
                .resolve(
                    &Fixture::context(),
                    prepared["data"]["targetId"].as_str().unwrap(),
                    None
                )
                .is_err()
        );
    });
}
