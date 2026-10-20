use super::{capture_cases, conversations, *};

pub(super) async fn view(f: &Fixture, handle: &Value, thread: &Value) -> Value {
    let reply = f
        .call(json!({"type":"readCanonicalConversation","handle":handle,"threadId":thread}))
        .await
        .unwrap();
    serde_json::from_str(reply["data"].as_str().unwrap()).unwrap()
}
pub(super) fn edit(handle: &Value, request: u8, view: &Value, action: Value) -> Value {
    json!({"type":"editCanonicalConversation","handle":handle,"edit":{
        "requestId":id(request),"threadId":view["conversation"]["threadId"],
        "expectedSelection":view["selection"],"action":action
    }})
}
fn status(handle: &Value, request: u8, thread: &Value) -> Value {
    json!({"type":"canonicalConversationEditStatus","handle":handle,
        "requestId":id(request),"threadId":thread})
}
pub(super) fn path(f: &Fixture, request: u8) -> PathBuf {
    conversations::private(f)
        .parent()
        .unwrap()
        .join("conversation-edits-v1")
        .join(format!("{}.json", id(request)))
}
fn replace(f: &Fixture, request: u8, record: &Value) {
    use std::os::unix::fs::PermissionsExt;
    let path = path(f, request);
    std::fs::write(&path, serde_json::to_vec(record).unwrap()).unwrap();
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600)).unwrap();
}

#[test]
fn canonical_rename_uses_native_metadata_after_private_creation_loss() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let thread = &created["data"]["threadId"];
        let original = view(&f, &handle, thread).await;
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        std::fs::write(f.vault.join("Note.md"), "unsnapshotted note\n").unwrap();
        let title = format!(
            "Review {} {}",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        );
        let command = edit(
            &handle,
            5,
            &original,
            json!({"type":"rename","title":title}),
        );
        let written = f
            .call(command.clone())
            .await
            .expect("canonical rename must publish without a private creation record");
        assert_eq!(written["type"], "conversationEdit");
        assert!(written["data"]["receipt"].is_string());
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let after = view(&f, &handle, thread).await;
        assert_eq!(after["conversation"], original["conversation"]);
        let title = after["metadata"]["value"]["custom_title"].as_str().unwrap();
        assert!(title.contains("$WORKSPACE"));
        assert!(title.contains("[REDACTED]"));
        let retained = std::fs::read_to_string(path(&f, 5)).unwrap();
        assert!(!retained.contains(capture_cases::TOKEN));
        assert!(!retained.contains(f.vault.canonicalize().unwrap().to_str().unwrap()));
        assert_eq!(f.call(command).await.unwrap(), written);
        assert_eq!(f.call(status(&handle, 5, thread)).await.unwrap(), written);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert_eq!(
            std::fs::read(f.vault.join("Note.md")).unwrap(),
            b"unsnapshotted note\n"
        );
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
        let reset = f
            .call(edit(
                &handle,
                6,
                &after,
                json!({"type":"rename","title":null}),
            ))
            .await
            .unwrap();
        assert!(reset["data"]["receipt"].is_string());
        assert!(view(&f, &handle, thread).await["metadata"]["value"]["custom_title"].is_null());
    });
}

#[test]
fn canonical_edit_recovers_original_receipt_and_never_replays_unknown_work() {
    let f = Fixture::new();
    run(async {
        capture_cases::privacy(&f);
        let handle = conversations::setup(&f).await;
        let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
        let thread = &created["data"]["threadId"];
        let observed = view(&f, &handle, thread).await;
        let command = edit(
            &handle,
            5,
            &observed,
            json!({"type":"rename","title":"Confirmed title"}),
        );
        let written = f.call(command.clone()).await.unwrap();
        let original: Value = serde_json::from_slice(&std::fs::read(path(&f, 5)).unwrap()).unwrap();
        let mut retained = original.clone();
        retained["receipt"] = Value::Null;
        replace(&f, 5, &retained);
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert_eq!(f.call(status(&handle, 5, thread)).await.unwrap(), written);
        retained["request"]["request_id"] = json!(id(6));
        replace(&f, 6, &retained);
        let pending = f.call(status(&handle, 6, thread)).await.unwrap();
        assert!(pending["data"]["receipt"].is_null());
        let mut unknown = command.clone();
        unknown["edit"]["requestId"] = json!(id(6));
        assert_eq!(f.call(unknown).await.unwrap(), pending);
        let mut changed = command;
        changed["edit"]["action"]["title"] = json!("Changed intent");
        assert!(f.call(changed).await.is_err());
        for pointer in [
            "/source/0",
            "/selection/revision",
            "/actor",
            "/identity/repository",
            "/identity/target/id",
            "/identity/threadId",
            "/receipt/intent",
        ] {
            let mut changed = original.clone();
            let value = changed.pointer_mut(pointer).unwrap();
            *value = if value.is_number() {
                json!(999)
            } else if pointer == "/receipt/intent" {
                json!(id(9).repeat(2))
            } else {
                json!(id(9))
            };
            replace(&f, 5, &changed);
            assert!(
                f.call(status(&handle, 5, thread)).await.is_err(),
                "{pointer}"
            );
        }
        replace(&f, 5, &original);
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert!(
            !conversations::private(&f).exists(),
            "receipt recovery must not regenerate actor/cache files"
        );
    });
}
