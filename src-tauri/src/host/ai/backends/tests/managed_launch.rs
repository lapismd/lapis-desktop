use super::{capture_cases, conversations, *};
use tauri_plugin_lapis_ai::HostPolicy;

fn prepare(handle: &Value, request: u8) -> Value {
    json!({
        "type":"prepareManagedCapture", "handle":handle,
        "requestId":id(request), "conversationRequestId":id(3), "clientId":"codex"
    })
}

#[test]
fn managed_capture_target_launches_only_its_admitted_client_and_requires_native_capture() {
    let f = Fixture::new();
    let (_runtime, settings, home) = super::super::super::file_profile::tests::fixture();
    f.policy.configure_file_profile(settings, home).unwrap();
    f.policy.prepare_file_profile().unwrap();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        let conversation = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let operation = prepare(&handle, 4);
        let managed = f
            .call(operation.clone())
            .await
            .expect("managed native capture must bind an admitted client");
        assert_eq!(f.call(operation.clone()).await.unwrap(), managed);
        assert!(f.call(capture_cases::prepare(&handle, 4, 3)).await.is_err());
        let binding = capture_cases::binding(&f, &managed);
        let context = Fixture::context();
        assert!(
            f.policy.processor(&context, &binding).is_err(),
            "unclaimed launch cannot construct managed capture"
        );
        assert!(
            f.policy
                .resolve(&context, &binding.target_id, Some("old-session"))
                .is_err()
        );
        let original = f.policy.resolve(&context, "codex", None).unwrap();
        let launch = f
            .policy
            .resolve(&context, &binding.target_id, None)
            .expect("prepared target must resolve its native client");
        assert_eq!(launch.directory, original.directory);
        assert_eq!(launch.prepared.directory, original.prepared.directory);
        assert_eq!(launch.prepared.executable, original.prepared.executable);
        assert_eq!(
            launch.prepared.environment.0,
            original.prepared.environment.0
        );
        assert!(launch.prepared.arguments.is_empty() && launch.resume.is_none());
        assert!(
            f.policy
                .resolve(&context, &binding.target_id, None)
                .is_err(),
            "another open cannot claim the same launch"
        );
        assert_eq!(
            f.call(operation).await.unwrap(),
            managed,
            "status-like preparation retains the spent target"
        );
        let mut processor = f
            .policy
            .processor(&context, &binding)
            .unwrap()
            .expect("managed launch always captures");
        for (index, frame) in [
            capture_cases::opened(&binding),
            capture_cases::text(&binding, "Managed conversation answer"),
            capture_cases::terminal(&binding),
        ]
        .iter()
        .enumerate()
        {
            capture_cases::batch(processor.as_mut(), &binding, index as u64 + 1, frame)
                .await
                .unwrap();
        }
        assert_eq!(capture_cases::entries(&f).len(), 3);
        let stores = capture_cases::stores(&f, &conversation);
        let snapshot = stores.agent().unwrap().snapshot().await.unwrap();
        let sessions = jj_store_core::engine::AgentReader::new(snapshot.data.as_ref())
            .list_sessions(None, 16)
            .await
            .unwrap();
        assert_eq!(sessions.selections.len(), 1);
        drop(processor);
        f.host.0.lock().unwrap().ai.leave("main", false);
        assert!(
            f.policy
                .resolve(&context, &binding.target_id, None)
                .is_err()
        );
    });
}

#[test]
fn missing_client_or_changed_private_intent_cannot_spend_or_bypass_a_managed_launch() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let managed = f.call(prepare(&handle, 4)).await.unwrap();
        let binding = capture_cases::binding(&f, &managed);
        let context = Fixture::context();
        assert!(
            f.policy
                .resolve(&context, &binding.target_id, None)
                .is_err()
        );
        let (_runtime, settings, home) = super::super::super::file_profile::tests::fixture();
        f.policy.configure_file_profile(settings, home).unwrap();
        f.policy.prepare_file_profile().unwrap();
        let original = conversations::record(&f, 3);
        let mut altered = original.clone();
        altered["receipt"]["actor"] = json!(id(9));
        conversations::replace(&f, 3, &altered);
        assert!(
            f.policy
                .resolve(&context, &binding.target_id, None)
                .is_err()
        );
        conversations::replace(&f, 3, &original);
        f.policy
            .resolve(&context, &binding.target_id, None)
            .unwrap();
        conversations::replace(&f, 3, &altered);
        assert!(f.policy.processor(&context, &binding).is_err());
        conversations::replace(&f, 3, &original);
        drop(f.policy.processor(&context, &binding).unwrap().unwrap());
        assert!(f.workers.list(&context).unwrap().is_empty());
    });
}

#[test]
fn capture_preparation_never_upgrades_an_existing_request_or_accepts_launch_authority() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let inert = f.call(capture_cases::prepare(&handle, 4, 3)).await.unwrap();
        let target = inert["data"]["targetId"].as_str().unwrap();
        assert!(f.policy.resolve(&Fixture::context(), target, None).is_err());
        assert!(f.call(prepare(&handle, 4)).await.is_err());
        for field in [
            "root",
            "executable",
            "environment",
            "actor",
            "generation",
            "window",
        ] {
            let mut operation = prepare(&handle, 5);
            operation[field] = json!("outside");
            assert!(f.call(operation).await.is_err());
        }
        let mut unknown = prepare(&handle, 5);
        unknown["clientId"] = json!("arbitrary-program");
        assert!(f.call(unknown).await.is_err());
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
    });
}
