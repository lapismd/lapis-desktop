use super::{
    canonical_capture_cases, canonical_dispatch_cases::*, canonical_message_cases, capture_cases, *,
};
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn native_dispatch_retains_one_intent_and_stop_does_not_clear_a_newer_turn() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(f.call(status(&handle, None, &thread)).await.unwrap()["data"].is_null());
        let command = begin(&handle, 10, &thread, &before["selection"], false);
        let first = f.call(command.clone()).await.unwrap();
        assert_eq!(first["data"]["fresh"], true);
        assert_eq!(first["data"]["conversation"], before["conversation"]);
        let replay = f.call(command).await.unwrap();
        assert_eq!(replay["data"]["fresh"], false);
        assert_eq!(replay["data"]["recipients"], first["data"]["recipients"]);
        assert_eq!(
            f.call(status(&handle, None, &thread)).await.unwrap(),
            replay
        );
        assert_eq!(
            f.call(begin(&handle, 12, &thread, &before["selection"], false))
                .await
                .unwrap_err()
                .kind(),
            std::io::ErrorKind::WouldBlock
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert_eq!(
            f.call(stop(&handle, 10, &thread)).await.unwrap()["data"]["stopped"],
            true
        );
        f.call(begin(&handle, 12, &thread, &before["selection"], false))
            .await
            .unwrap();
        f.call(stop(&handle, 10, &thread)).await.unwrap();
        assert_eq!(
            f.call(status(&handle, None, &thread)).await.unwrap()["data"]["requestId"],
            id(12)
        );
        assert!(!capture_cases::profile(&f).join("ai-capture-v1").exists());
    });
}

#[test]
fn native_dispatch_confirms_authorship_and_observes_only_captured_original_terminal() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        assert!(
            f.call(begin(&handle, 10, &thread, &before["selection"], true))
                .await
                .is_err()
        );
        let text = format!(
            "One prompt for {}/Note.md {}",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        );
        let written = f
            .call(canonical_message_cases::append(
                &handle,
                10,
                &thread,
                &before["selection"],
                &text,
            ))
            .await
            .unwrap();
        let current = canonical_message_cases::view(&f, &handle, &thread).await;
        let begun = f
            .call(begin(&handle, 10, &thread, &current["selection"], true))
            .await
            .unwrap();
        assert_eq!(
            begun["data"]["authored"]["messageId"],
            written["data"]["messageId"]
        );
        let prepared = f
            .call(prepare(&handle, 11, 10, &thread, &current["selection"]))
            .await
            .unwrap();
        let (binding, mut processor) = canonical_capture_cases::processor(&f, &prepared);
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        canonical_capture_cases::prompt(processor.as_mut(), &binding, 10, &text)
            .await
            .unwrap();
        let pending = f.call(status(&handle, Some(10), &thread)).await.unwrap();
        assert_eq!(pending["data"]["recipients"][0]["phase"], "prepared");
        assert_eq!(pending["data"]["settled"], false);
        let mut terminal = capture_cases::terminal(&binding);
        terminal["requestId"] = json!(uuid::Uuid::from_bytes([10; 16]).to_string());
        capture_cases::batch(processor.as_mut(), &binding, 2, &terminal)
            .await
            .unwrap();
        let completed = f.call(status(&handle, Some(10), &thread)).await.unwrap();
        assert_eq!(completed["data"]["recipients"][0]["phase"], "completed");
        assert_eq!(completed["data"]["settled"], true);
        assert_eq!(
            canonical_message_cases::view(&f, &handle, &thread).await["messages"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
        // A rejected preparation retires WorkerProcessor. Check duplication only
        // after capturing the original terminal, never resume the failed owner.
        assert!(
            canonical_capture_cases::prompt(processor.as_mut(), &binding, 10, &text)
                .await
                .is_err()
        );
        let record = saved(&f, &thread, 10);
        let safe = record["recipients"][0]["wire"]["text"].as_str().unwrap();
        assert!(safe.contains("$WORKSPACE/Note.md") && safe.contains("[REDACTED]"));
        assert!(
            !serde_json::to_string(&record)
                .unwrap()
                .contains(capture_cases::TOKEN)
        );
        assert_eq!(
            record["recipients"][0]["binding"]["worker"],
            binding.session_id
        );
        drop(processor);
        f.call(stop(&handle, 10, &thread)).await.unwrap();
        assert!(
            f.policy
                .resolve(&Fixture::context(), &binding.target_id, None)
                .is_err()
        );
    });
}

#[test]
fn native_dispatch_reload_can_inspect_and_stop_but_cannot_recreate_launch_authority() {
    let f = Fixture::new();
    let _client = canonical_capture_cases::client(&f);
    run(async {
        let (handle, thread, before, _) = canonical_capture_cases::setup(&f).await;
        let command = begin(&handle, 10, &thread, &before["selection"], false);
        f.call(command.clone()).await.unwrap();
        let plan = prepare(&handle, 11, 10, &thread, &before["selection"]);
        let prepared = f.call(plan.clone()).await.unwrap();
        assert!(f.host.0.lock().unwrap().ai.leave("main", true));
        f.backends.suspend("main").unwrap();
        f.activate();
        let fresh = f.call(open(20)).await.unwrap()["data"]["handle"].clone();
        let mut replay = command;
        replay["handle"] = fresh.clone();
        assert_eq!(f.call(replay).await.unwrap()["data"]["fresh"], false);
        let mut replay = plan;
        replay["handle"] = fresh.clone();
        assert!(f.call(replay).await.is_err());
        assert!(
            f.policy
                .resolve(
                    &Fixture::context(),
                    prepared["data"]["targetId"].as_str().unwrap(),
                    None
                )
                .is_err()
        );
        assert_eq!(
            f.call(stop(&fresh, 10, &thread)).await.unwrap()["data"]["stopped"],
            true
        );
    });
}
