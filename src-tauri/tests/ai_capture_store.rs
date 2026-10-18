mod capture_store_cases;
use capture_store_cases::*;
use jj_agent::AgentObjectV1;
use jj_store_conversations::{
    capture::{Binding, CaptureError},
    native_privacy::{TRANSCRIPT_POLICY, TranscriptSanitizer},
    store_capture::*,
};
use jj_store_core::engine::AgentReader;
use lapis_desktop::ai::{capture::ManagedCapture, journal::ProfileJournal};
use serde_json::json;
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use tauri_plugin_lapis_ai::runtime::{FrameInput, FramePublication, SessionProcessor};

#[test]
fn notes_capture_private_journal_and_real_jj_agent_thread_receipts_survive_reopen() {
    run(async {
        for lose_receipt in [false, true] {
            let f = Fixture::new().await;
            let blocked = Arc::new(AtomicBool::new(lose_receipt));
            let check = blocked.clone();
            let metadata = f.metadata.clone();
            let authority = f.host.clone();
            let journal = Arc::new(
                ProfileJournal::open(
                    &f.profile,
                    f.context.clone(),
                    f.stores.agent().unwrap().scope(),
                    Arc::new(move || {
                        authority.current().map_err(|_| CaptureError::Rejected)?;
                        if check.load(Ordering::SeqCst)
                            && metadata
                                .read()
                                .map_err(|_| CaptureError::Unknown)?
                                .and_then(|p| {
                                    p.selection(jj_store_git::metadata::Domain::Agent).cloned()
                                })
                                .is_some_and(|s| s.version > 0)
                        {
                            return Err(CaptureError::Rejected);
                        }
                        Ok(())
                    }),
                )
                .unwrap(),
            );
            let sink =
                StoreCapture::new(f.context.clone(), f.stores.clone(), journal.clone()).unwrap();
            let privacy = TranscriptSanitizer::new(&f.vault, &f.home, &f.temporary, &f.cache)
                .unwrap()
                .for_secrets(&["fixture-private-token".into()])
                .unwrap();
            let mut processor = ManagedCapture::with_native_privacy(
                Binding {
                    scope: f.context.binding.scope.clone(),
                    worker: "worker".into(),
                    request: "open".into(),
                    target: "target".into(),
                    window: "main".into(),
                    admission: f.context.binding.admission.clone(),
                },
                Arc::new(privacy),
                Box::new(sink),
            )
            .unwrap();
            assert_eq!(f.context.policy, TRANSCRIPT_POLICY);
            let facts = json!({"version":3,"type":"opened","sessionId":"worker","requestId":"open","adapterSessionId":"provider","sequence":2});
            let output = processor
                .process_batch(FrameInput {
                    session_id: "worker",
                    ordinal: 1,
                    publication: FramePublication::Facts,
                    frame: &facts,
                })
                .await;
            let entry = journal.load(f.context.request(1)).await;
            if lose_receipt {
                assert_eq!(output.err().unwrap().0, "native_capture_unknown");
                assert!(
                    entry.is_err(),
                    "revoked admission cannot inspect retained capture"
                );
                blocked.store(false, Ordering::SeqCst);
            } else {
                output.unwrap();
                assert!(entry.unwrap().unwrap().confirmation.is_some());
                let text = json!({"version":3,"type":"activity","sessionId":"worker","requestId":"turn","sequence":81,"update":{"sessionUpdate":"agent_message_chunk","content":{"type":"text","text":format!("Safe answer {} fixture-private-token",f.vault.display())}}});
                let terminal = json!({"version":3,"type":"record","sessionId":"worker","requestId":"turn","sequence":82,"record":{"status":"completed"}});
                for (ordinal, frame) in [(2, &text), (3, &terminal)] {
                    let batch = processor
                        .process_batch(FrameInput {
                            session_id: "worker",
                            ordinal,
                            publication: FramePublication::Event {
                                sequence: ordinal - 1,
                            },
                            frame,
                        })
                        .await
                        .unwrap();
                    for value in batch.before.iter().chain(std::iter::once(&batch.frame)) {
                        let value = serde_json::to_string(value).unwrap();
                        assert!(!value.contains("fixture-private-token"));
                        assert!(!value.contains(f.vault.to_str().unwrap()));
                    }
                    let entry = journal
                        .load(f.context.request(ordinal))
                        .await
                        .unwrap()
                        .unwrap();
                    assert!(entry.confirmation.is_some());
                    let evidence = String::from_utf8_lossy(&entry.candidate.capture);
                    assert!(!evidence.contains("fixture-private-token"));
                    assert!(!evidence.contains(f.vault.to_str().unwrap()));
                }
            }
            let retained = journal.load(f.context.request(1)).await.unwrap().unwrap();
            assert!(retained.prepared.is_some());
            if lose_receipt {
                assert!(retained.confirmation.is_none());
            }
            drop(processor);
            drop(journal);
            let stores = f.reopen();
            let journal = Arc::new(
                ProfileJournal::open(
                    &f.profile,
                    f.context.clone(),
                    stores.agent().unwrap().scope(),
                    Arc::new(|| Ok(())),
                )
                .unwrap(),
            );
            let sink =
                StoreCapture::new(f.context.clone(), stores.clone(), journal.clone()).unwrap();
            let selected = f.metadata.read().unwrap().unwrap().commit();
            let receipt = sink.recover(1).await.unwrap();
            assert_eq!(
                Some(receipt.clone()),
                journal
                    .load(f.context.request(1))
                    .await
                    .unwrap()
                    .unwrap()
                    .confirmation
            );
            assert_eq!(sink.recover(1).await.unwrap(), receipt);
            assert_eq!(
                f.metadata.read().unwrap().unwrap().commit(),
                selected,
                "receipt recovery publishes nothing"
            );
            let agent = stores.agent().unwrap().snapshot().await.unwrap();
            let threads = stores.thread().unwrap().snapshot().await.unwrap();
            assert_eq!(agent.selection, threads.selection);
            let reader = AgentReader::new(agent.data.as_ref());
            let sessions = reader.list_sessions(None, 16).await.unwrap();
            assert_eq!(sessions.selections.len(), 1);
            let AgentObjectV1::SessionSnapshot(session) = agent
                .data
                .read_object(sessions.selections[0].1)
                .await
                .unwrap()
            else {
                panic!("session")
            };
            assert!(
                jj_collab::ThreadStateV1::read(threads.data.root.clone(), &threads.data.graph)
                    .unwrap()
                    .assignments
                    .contains_key(&session.session_id)
            );
            if !lose_receipt {
                let transcript = reader
                    .transcript_range(
                        session.transcripts[0],
                        f.context.source(),
                        1,
                        None,
                        16,
                        4096,
                    )
                    .await
                    .unwrap();
                let text = String::from_utf8_lossy(transcript.chunks[0].payload.bytes());
                assert!(text.contains("Safe answer"));
                assert!(!text.contains("fixture-private-token"));
            }
            f.assert_source_unchanged();
            f.host.revoke();
            assert_eq!(sink.recover(1).await.err(), Some(CaptureError::Unknown));
        }
    });
}
