use super::{capture_cases, conversation_reads, conversations, *};

fn append(handle: &Value, request: u8, conversation: u8, text: &str) -> Value {
    json!({"type":"appendConversationMessage","handle":handle,
        "requestId":id(request),"conversationRequestId":id(conversation),"text":text})
}
fn status(handle: &Value, request: u8, conversation: u8) -> Value {
    json!({"type":"conversationMessageStatus","handle":handle,
        "requestId":id(request),"conversationRequestId":id(conversation)})
}
pub(super) fn path(f: &Fixture, request: u8) -> PathBuf {
    conversations::private(f)
        .parent()
        .unwrap()
        .join("conversation-messages-v1")
        .join(format!("{}.json", id(request)))
}
pub(super) fn replace(f: &Fixture, request: u8, value: &Value) {
    use std::os::unix::fs::PermissionsExt;
    let path = path(f, request);
    std::fs::write(&path, serde_json::to_vec(value).unwrap()).unwrap();
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600)).unwrap();
}
pub(super) fn unpublished(mut record: Value, request: u8) -> Value {
    use sha2::{Digest, Sha256};
    // Build a valid interrupted intent with a different original request.
    // The digest is bound into its native message ID, not just a mutable field.
    let mut digest = Sha256::new();
    digest.update(b"lapis-native-authored-message-identity-v1\0");
    digest.update(serde_json::from_value::<[u8; 16]>(record["seed"].clone()).unwrap());
    digest.update(serde_json::from_value::<[u8; 32]>(record["fingerprint"].clone()).unwrap());
    let request_id: jj_store_model::RequestId = serde_json::from_value(json!(id(request))).unwrap();
    digest.update(request_id.as_bytes());
    digest.update(
        uuid::Uuid::parse_str(record["conversation"].as_str().unwrap())
            .unwrap()
            .as_bytes(),
    );
    let actor: jj_store_model::PrincipalId =
        serde_json::from_value(record["actor"].clone()).unwrap();
    digest.update(actor.as_bytes());
    let mut message = [0; 16];
    message.copy_from_slice(&digest.finalize()[..16]);
    record["message"] = serde_json::to_value(jj_collab::HumanMessageId::new(message)).unwrap();
    record["request"]["command"]["intent"]["message_id"] = record["message"].clone();
    record["request"]["request_id"] = json!(id(request));
    record["receipt"] = Value::Null;
    record
}

#[test]
fn native_authored_message_is_sanitized_and_published_once_without_a_provider() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let dirty = b"Keep this unsnapshotted edit\n";
        std::fs::write(f.vault.join("Note.md"), dirty).unwrap();
        let text = format!(
            "User message about {}/Note.md {}",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        );
        let command = append(&handle, 5, 3, &text);
        let first = f
            .call(command.clone())
            .await
            .expect("native authored writes must use the selected real ThreadStore");
        assert_eq!(first["type"], "conversationMessage");
        assert!(first["data"]["receipt"].is_string());
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert_eq!(f.call(command).await.unwrap(), first);
        assert_eq!(f.call(status(&handle, 5, 3)).await.unwrap(), first);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        let encoded = f.call(conversation_reads::read(&handle, 3)).await.unwrap()["data"]
            .as_str()
            .unwrap()
            .to_owned();
        let view: Value = serde_json::from_str(&encoded).unwrap();
        assert_eq!(view["messages"].as_array().unwrap().len(), 1);
        assert_eq!(
            view["messages"][0]["message_id"],
            first["data"]["messageId"]
        );
        assert!(
            view["messages"][0]["body"]
                .as_str()
                .unwrap()
                .contains("$WORKSPACE/Note.md")
        );
        assert!(encoded.contains("[REDACTED]"));
        assert!(!encoded.contains(capture_cases::TOKEN));
        assert!(view["sessions"].as_array().unwrap().is_empty());
        let private = std::fs::read_to_string(path(&f, 5)).unwrap();
        assert!(!private.contains(capture_cases::TOKEN));
        assert!(!private.contains(f.vault.canonicalize().unwrap().to_str().unwrap()));
        assert!(
            f.call(append(&handle, 5, 3, "Changed original intent"))
                .await
                .is_err()
        );
        assert_eq!(std::fs::read(f.vault.join("Note.md")).unwrap(), dirty);
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
    });
}

#[test]
fn native_authored_message_recovers_lost_confirmation_and_never_replays_unknown_intent() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let text = "Exact authored message\n\nWith a second paragraph.";
        let first = f.call(append(&handle, 5, 3, text)).await.unwrap();
        let mut record: Value =
            serde_json::from_slice(&std::fs::read(path(&f, 5)).unwrap()).unwrap();
        record["receipt"] = Value::Null;
        replace(&f, 5, &record);
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert_eq!(f.call(status(&handle, 5, 3)).await.unwrap(), first);
        replace(&f, 6, &unpublished(record, 6));
        let pending = f.call(status(&handle, 6, 3)).await.unwrap();
        assert!(pending["data"]["receipt"].is_null());
        assert_eq!(f.call(append(&handle, 6, 3, text)).await.unwrap(), pending);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        let reopened = f.call(open(7)).await.unwrap()["data"]["handle"].clone();
        assert_eq!(f.call(status(&reopened, 5, 3)).await.unwrap(), first);
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
fn authored_message_frames_reject_substituted_authority_and_keep_other_frames_small() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        assert!(f.call(status(&handle, 5, 3)).await.is_err());
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        assert!(f.call(status(&handle, 5, 3)).await.unwrap()["data"].is_null());
        assert!(!path(&f, 5).parent().unwrap().exists());
        for text in ["", " ", "bad\0text"] {
            assert!(f.call(append(&handle, 5, 3, text)).await.is_err());
        }
        for field in [
            "root",
            "actor",
            "threadId",
            "messageId",
            "generation",
            "repository",
            "expectedThread",
        ] {
            let mut command = append(&handle, 5, 3, "Human text");
            command[field] = json!("substituted");
            assert!(f.call(command).await.is_err());
        }
        let mut oversized = conversations::prepare(&handle, 8);
        oversized["title"] = json!("x".repeat(4096));
        assert!(f.call(oversized).await.is_err());
        let long = "A long authored paragraph. ".repeat(400);
        assert!(f.call(append(&handle, 5, 3, &long)).await.unwrap()["data"]["receipt"].is_string());
        let before = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            f.call(append(&handle, 9, 3, &"x".repeat(256 * 1024 + 1)))
                .await
                .is_err()
        );
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            before
        );
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        assert!(f.call(append(&handle, 10, 3, "After close")).await.is_err());
    });
}

#[test]
fn authored_message_receipts_cannot_be_substituted_or_rebound_to_another_conversation() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let first = f
            .call(append(&handle, 5, 3, "Original authored text"))
            .await
            .unwrap();
        let original: Value = serde_json::from_slice(&std::fs::read(path(&f, 5)).unwrap()).unwrap();
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        for key in [
            "/actor",
            "/source/0",
            "/seed/0",
            "/fingerprint/0",
            "/conversation",
            "/conversation_request_id",
            "/selection/revision",
            "/repository",
            "/receipt/actor",
            "/receipt/request_id",
            "/receipt/intent",
            "/receipt/repository",
        ] {
            let mut altered = original.clone();
            let field = altered.pointer_mut(key).unwrap();
            *field = if key.ends_with("/0") {
                json!((field.as_u64().unwrap() + 1) % 256)
            } else if field.is_number() {
                json!(999)
            } else if key == "/receipt/intent" {
                json!(id(9).repeat(2))
            } else {
                json!(id(9))
            };
            replace(&f, 5, &altered);
            assert!(f.call(status(&handle, 5, 3)).await.is_err(), "{key}");
        }
        replace(&f, 5, &original);
        assert_eq!(f.call(status(&handle, 5, 3)).await.unwrap(), first);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        f.call(conversations::prepare(&handle, 6)).await.unwrap();
        assert!(f.call(status(&handle, 5, 6)).await.is_err());
    });
}

#[test]
fn authored_message_cannot_write_before_native_privacy_is_available() {
    let f = Fixture::new();
    run(async {
        let handle = conversations::setup(&f).await;
        f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert!(
            f.call(append(&handle, 5, 3, capture_cases::TOKEN))
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
