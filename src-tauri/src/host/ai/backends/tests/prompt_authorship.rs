use super::{capture_cases, conversation_reads, conversations, *};
use tauri_plugin_lapis_ai::{
    HostPolicy, SessionBinding,
    runtime::{RequestInput, SessionProcessor, SessionRequest},
};

async fn setup(f: &Fixture) -> (Value, SessionBinding, Box<dyn SessionProcessor>) {
    let (_runtime, settings, home) = super::super::super::file_profile::tests::fixture();
    f.policy.configure_file_profile(settings, home).unwrap();
    f.policy.prepare_file_profile().unwrap();
    capture_cases::privacy(f);
    let handle = conversations::setup(f).await;
    f.call(conversations::prepare(&handle, 3)).await.unwrap();
    let prepared = f
        .call(json!({"type":"prepareManagedCapture", "handle":handle,
            "requestId":id(4),"conversationRequestId":id(3),"clientId":"codex"}))
        .await
        .unwrap();
    let binding = capture_cases::binding(f, &prepared);
    f.policy
        .resolve(&Fixture::context(), &binding.target_id, None)
        .unwrap();
    let processor = f
        .policy
        .processor(&Fixture::context(), &binding)
        .unwrap()
        .unwrap();
    (handle, binding, processor)
}
fn prompt(text: String) -> SessionRequest {
    SessionRequest::Prompt {
        text,
        context: Some("Injected context is not human authorship".into()),
        max_duration_ms: 1000,
    }
}
async fn prepare(
    processor: &mut dyn SessionProcessor,
    binding: &SessionBinding,
    request: u8,
    input: &SessionRequest,
) -> Result<(), tauri_plugin_lapis_ai::runtime::Error> {
    let request = uuid::Uuid::from_bytes([request; 16]).to_string();
    processor
        .prepare_request(RequestInput {
            session_id: &binding.session_id,
            request_id: &request,
            request: input,
        })
        .await
}
async fn view(f: &Fixture, handle: &Value) -> Value {
    let reply = f.call(conversation_reads::read(handle, 3)).await.unwrap();
    serde_json::from_str(reply["data"].as_str().unwrap()).unwrap()
}

#[test]
fn managed_prompt_preparation_persists_sanitized_authorship_before_it_returns() {
    let f = Fixture::new();
    run(async {
        let (handle, binding, mut processor) = setup(&f).await;
        capture_cases::batch(
            processor.as_mut(),
            &binding,
            1,
            &capture_cases::opened(&binding),
        )
        .await
        .unwrap();
        let dirty = b"Keep this unsnapshotted note\n";
        std::fs::write(f.vault.join("Note.md"), dirty).unwrap();
        let request = prompt(format!(
            "Please review {}/Note.md {}",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        ));
        prepare(processor.as_mut(), &binding, 5, &request)
            .await
            .unwrap();
        let snapshot = view(&f, &handle).await;
        assert_eq!(
            snapshot["messages"].as_array().unwrap().len(),
            1,
            "returning from preparation must confirm native human authorship"
        );
        let body = snapshot["messages"][0]["body"].as_str().unwrap();
        assert!(body.contains("$WORKSPACE/Note.md") && body.contains("[REDACTED]"));
        assert!(!body.contains("Injected context"));
        assert!(!body.contains(capture_cases::TOKEN));
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        prepare(processor.as_mut(), &binding, 5, &request)
            .await
            .unwrap();
        assert_eq!(view(&f, &handle).await, snapshot);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert!(
            prepare(
                processor.as_mut(),
                &binding,
                5,
                &prompt("Changed intent".into())
            )
            .await
            .is_err()
        );
        assert_eq!(std::fs::read(f.vault.join("Note.md")).unwrap(), dirty);
        drop(processor);
    });
}

#[test]
fn context_only_and_control_requests_do_not_fabricate_human_messages() {
    let f = Fixture::new();
    run(async {
        let (handle, binding, mut processor) = setup(&f).await;
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        prepare(processor.as_mut(), &binding, 5, &SessionRequest::Status {})
            .await
            .unwrap();
        prepare(processor.as_mut(), &binding, 6, &prompt(String::new()))
            .await
            .unwrap();
        prepare(processor.as_mut(), &binding, 7, &prompt(" \n".into()))
            .await
            .unwrap();
        assert!(
            view(&f, &handle).await["messages"]
                .as_array()
                .unwrap()
                .is_empty()
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        drop(processor);
    });
}

#[test]
fn managed_authorship_rejects_foreign_worker_invalid_request_and_revoked_owner() {
    let f = Fixture::new();
    run(async {
        let (handle, binding, mut processor) = setup(&f).await;
        let request = prompt("Keep the native binding".into());
        assert!(
            processor
                .prepare_request(RequestInput {
                    session_id: "foreign-worker",
                    request_id: &id(5),
                    request: &request,
                })
                .await
                .is_err()
        );
        assert!(
            processor
                .prepare_request(RequestInput {
                    session_id: &binding.session_id,
                    request_id: &id(5),
                    request: &request,
                })
                .await
                .is_err(),
            "UUID aliases cannot bypass a prompt's original identity"
        );
        assert!(
            processor
                .prepare_request(RequestInput {
                    session_id: &binding.session_id,
                    request_id: "not-a-native-uuid",
                    request: &request,
                })
                .await
                .is_err()
        );
        assert!(
            view(&f, &handle).await["messages"]
                .as_array()
                .unwrap()
                .is_empty()
        );
        f.host.0.lock().unwrap().ai.leave("main", false);
        assert!(
            prepare(processor.as_mut(), &binding, 5, &request)
                .await
                .is_err()
        );
        drop(processor);
    });
}

#[test]
fn unknown_original_authorship_cannot_confirm_managed_prompt_preparation() {
    let f = Fixture::new();
    run(async {
        let (handle, binding, mut processor) = setup(&f).await;
        let text = "Retain the unknown original authorship";
        f.call(json!({"type":"appendConversationMessage", "handle":handle,
            "requestId":id(5),"conversationRequestId":id(3),"text":text}))
            .await
            .unwrap();
        let original: Value =
            serde_json::from_slice(&std::fs::read(super::authored_messages::path(&f, 5)).unwrap())
                .unwrap();
        super::authored_messages::replace(
            &f,
            6,
            &super::authored_messages::unpublished(original, 6),
        );
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let error = prepare(processor.as_mut(), &binding, 6, &prompt(text.into())).await;
        assert!(
            error.is_err(),
            "an unknown original receipt must prevent provider dispatch"
        );
        let status = f
            .call(json!({"type":"conversationMessageStatus", "handle":handle,
            "requestId":id(6),"conversationRequestId":id(3)}))
            .await
            .unwrap();
        assert!(status["data"]["receipt"].is_null());
        assert_eq!(
            view(&f, &handle).await["messages"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        drop(processor);
    });
}
