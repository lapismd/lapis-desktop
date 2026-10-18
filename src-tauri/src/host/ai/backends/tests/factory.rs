use super::{capture_cases::*, *};
use jj_agent::AgentObjectV1;
use jj_store_conversations::store_capture::{Journal, StoreCapture};
use jj_store_core::engine::AgentReader;
use lapis_desktop::ai::journal::ProfileJournal;
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn ordinary_native_factory_publishes_sanitized_capture_to_selected_agent_and_thread_stores() {
    let f = Fixture::new();
    run(async {
        let (_, conversation, binding) = setup(&f).await;
        let context = Fixture::context();
        let mut processor = f
            .policy
            .processor(&context, &binding)
            .unwrap()
            .expect("real selected-store processor");
        let vault = f.vault.canonicalize().unwrap().display().to_string();
        let home = f
            ._root
            .path()
            .join("home")
            .canonicalize()
            .unwrap()
            .display()
            .to_string();
        let temporary = f
            ._root
            .path()
            .join("temporary")
            .canonicalize()
            .unwrap()
            .display()
            .to_string();
        let mut facts = opened(&binding);
        facts["payload"] = json!({format!("{home}/private"):[format!("{vault}/note.md"),format!("{temporary}/file"),TOKEN]});
        let raw = format!("Safe answer {vault}/note.md {home}/config {temporary}/file {TOKEN} /");
        let split = "Safe answer ".len() + vault.len() / 2;
        let frames = [
            facts,
            text(&binding, &raw[..split]),
            text(&binding, &raw[split..]),
            terminal(&binding),
        ];
        for (index, frame) in frames.iter().enumerate() {
            let output = batch(processor.as_mut(), &binding, index as u64 + 1, frame)
                .await
                .unwrap();
            let saved = serde_json::to_string(&json!([output.before, output.frame])).unwrap();
            for private in [&vault, &home, &temporary, TOKEN] {
                assert!(!saved.contains(private));
            }
        }
        let retained = entries(&f);
        assert_eq!(retained.len(), 4);
        for entry in &retained {
            entry.validate().unwrap();
            assert!(entry.prepared.is_some() && entry.confirmation.is_some());
            let safe = String::from_utf8_lossy(&entry.candidate.capture);
            for private in [&vault, &home, &temporary, TOKEN] {
                assert!(!safe.contains(private));
            }
        }
        let capture = retained[0].candidate.context.clone();
        let stores = stores(&f, &conversation);
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
            panic!("session");
        };
        let state =
            jj_collab::ThreadStateV1::read(threads.data.root.clone(), &threads.data.graph).unwrap();
        let reference = state.assignments[&session.session_id];
        let jj_collab::CollabObjectV1::ThreadLink(link) =
            threads.data.graph.get(reference).unwrap()
        else {
            panic!("primary thread link");
        };
        assert_eq!(link.thread_id, capture.thread);
        assert!(link.active);
        assert!(
            matches!(link.target, jj_collab::ThreadLinkTargetV1::Session {session_id, primary: true, ..} if session_id == session.session_id)
        );
        let transcript = reader
            .transcript_range(
                session.transcripts[0],
                capture.source(),
                1,
                None,
                16,
                64 * 1024,
            )
            .await
            .unwrap();
        let text: String = transcript
            .chunks
            .iter()
            .map(|chunk| String::from_utf8_lossy(chunk.payload.bytes()))
            .collect();
        assert!(text.contains("Safe answer"));
        assert!(text.contains("$WORKSPACE/note.md"));
        assert!(text.contains("[REDACTED]"));
        for private in [&vault, &home, &temporary, TOKEN] {
            assert!(!text.contains(private));
        }
        drop(processor);
        let profile = Dir::open_ambient_dir(profile(&f), ambient_authority()).unwrap();
        let journal = Arc::new(
            ProfileJournal::open(
                &profile,
                capture,
                stores.agent().unwrap().scope(),
                Arc::new(|| Ok(())),
            )
            .unwrap(),
        );
        let sink = StoreCapture::new(journal.context().clone(), stores, journal.clone()).unwrap();
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        for entry in retained {
            let receipt = sink.recover(entry.candidate.ordinal).await.unwrap();
            assert_eq!(
                Some(receipt),
                journal
                    .load(entry.candidate.request())
                    .await
                    .unwrap()
                    .unwrap()
                    .confirmation
            );
        }
        assert_eq!(
            metadata(&f).read().unwrap().unwrap().commit(),
            selected,
            "original receipt recovery never publishes again"
        );
        assert!(
            f.workers.targets(&context).unwrap().is_empty(),
            "capture preparation grants no executable"
        );
    });
}
