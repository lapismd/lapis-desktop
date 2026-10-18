use super::*;
use std::process::Command;

fn jj(f: &Fixture, args: &[&str]) -> String {
    let mut command = Command::new("/opt/homebrew/bin/jj");
    command.current_dir(&f.vault).arg("--no-pager");
    if args.first() == Some(&"op") {
        command.arg("--ignore-working-copy");
    }
    let output = command
        .args(args)
        .env("JJ_CONFIG", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8(output.stdout).unwrap()
}
pub(super) async fn setup(f: &Fixture) -> Value {
    jj(f, &["git", "init", "--no-colocate"]);
    f.call(json!({"type":"select","requestId":id(1),"expectedRevision":0,"backend":"jj"}))
        .await
        .unwrap();
    f.call(open(2)).await.unwrap()["data"]["handle"].clone()
}
pub(super) fn prepare(handle: &Value, request: u8) -> Value {
    json!({"type":"prepareConversation","handle":handle,"requestId":id(request),"title":"Notes conversation"})
}
pub(super) fn status(handle: &Value, request: u8) -> Value {
    json!({"type":"conversationStatus","handle":handle,"requestId":id(request)})
}
fn private(f: &Fixture) -> PathBuf {
    std::fs::read_dir(f._root.path().join("profile/ai-backends-v1"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path()
        .join("conversations-v1")
}
fn record(f: &Fixture, request: u8) -> Value {
    serde_json::from_slice(
        &std::fs::read(private(f).join(format!("{}.json", id(request)))).unwrap(),
    )
    .unwrap()
}
fn replace(f: &Fixture, request: u8, value: &Value) {
    use std::os::unix::fs::PermissionsExt;
    let path = private(f).join(format!("{}.json", id(request)));
    std::fs::write(&path, serde_json::to_vec(value).unwrap()).unwrap();
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600)).unwrap();
}

#[test]
fn admitted_native_conversation_preparation_publishes_once_and_recovers_original_receipt() {
    let f = Fixture::new();
    jj(&f, &["git", "init", "--no-colocate"]);
    std::fs::write(f.vault.join("note.md"), "dirty notes\n").unwrap();
    let before = jj(&f, &["op", "log", "--limit", "1", "-T", "id"]);
    run(async {
        f.call(json!({"type":"select","requestId":id(1),"expectedRevision":0,"backend":"jj"}))
            .await
            .unwrap();
        let opened = f.call(open(2)).await.unwrap();
        let operation = json!({"type":"prepareConversation","handle":opened["data"]["handle"],"requestId":id(3),"title":"Notes conversation"});
        let first = f
            .call(operation.clone())
            .await
            .expect("ordinary native host must prepare a durable conversation");
        assert_eq!(first["type"], "conversation");
        let info = jj_store_jj::local_repository::inspect_workspace(&f.vault).unwrap();
        let metadata = info.open_metadata().unwrap().carrier().clone();
        let committed = metadata.read().unwrap().unwrap().commit();
        assert_eq!(f.call(operation).await.unwrap(), first);
        assert_eq!(f.call(json!({"type":"conversationStatus","handle":opened["data"]["handle"],"requestId":id(3)})).await.unwrap(), first);
        assert_eq!(metadata.read().unwrap().unwrap().commit(), committed);
        assert!(!f.vault.join("lapis").exists());
        assert_eq!(
            std::fs::read(f.vault.join("note.md")).unwrap(),
            b"dirty notes\n"
        );
        assert_eq!(jj(&f, &["op", "log", "--limit", "1", "-T", "id"]), before);
        f.call(json!({"type":"close","handle":opened["data"]["handle"]}))
            .await
            .unwrap();
        let reopened = f.call(open(4)).await.unwrap();
        assert_eq!(
            f.call(status(&reopened["data"]["handle"], 3))
                .await
                .unwrap(),
            first
        );
    });
}

#[test]
fn lost_local_confirmation_recovers_original_provider_receipt_without_publication() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        let first = f.call(prepare(&handle, 3)).await.unwrap();
        let mut retained = record(&f, 3);
        retained["receipt"] = Value::Null;
        replace(&f, 3, &retained);
        let info = jj_store_jj::local_repository::inspect_workspace(&f.vault).unwrap();
        let metadata = info.open_metadata().unwrap().carrier().clone();
        let pin = metadata.read().unwrap().unwrap().commit();
        assert_eq!(f.call(status(&handle, 3)).await.unwrap(), first);
        assert!(record(&f, 3)["receipt"].is_object());
        assert_eq!(metadata.read().unwrap().unwrap().commit(), pin);
    });
}

#[test]
fn prepared_unknown_intent_is_retained_and_never_executed_on_retry_or_status() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        let first = f.call(prepare(&handle, 3)).await.unwrap();
        let mut retained = record(&f, 3);
        retained["receipt"] = Value::Null;
        retained["request"]["request_id"] = json!(id(4));
        retained["repository"] = first["data"]["repository"].clone();
        retained["request"]["command"]["intent"]["thread_id"] = json!(id(4));
        replace(&f, 4, &retained);
        let info = jj_store_jj::local_repository::inspect_workspace(&f.vault).unwrap();
        let metadata = info.open_metadata().unwrap().carrier().clone();
        let pin = metadata.read().unwrap().unwrap().commit();
        let pending = f.call(status(&handle, 4)).await.unwrap();
        assert!(pending["data"]["receipt"].is_null());
        assert_eq!(pending["data"]["threadId"], id(4));
        assert_eq!(f.call(prepare(&handle, 4)).await.unwrap(), pending);
        assert_eq!(metadata.read().unwrap().unwrap().commit(), pin);
    });
}

#[test]
fn substituted_preparations_and_receipts_cannot_claim_an_original_result() {
    let f = Fixture::new();
    run(async {
        let handle = setup(&f).await;
        let first = f.call(prepare(&handle, 3)).await.unwrap();
        let original = record(&f, 3);
        let mut changed = prepare(&handle, 3);
        changed["title"] = json!("A different intent");
        assert!(f.call(changed).await.is_err());
        for path in [
            "/source/0",
            "/actor",
            "/selection/revision",
            "/repository",
            "/receipt/intent",
            "/receipt/actor",
            "/receipt/repository",
        ] {
            let mut changed = original.clone();
            let field = changed.pointer_mut(path).unwrap();
            *field = if path == "/source/0" {
                json!((field.as_u64().unwrap() + 1) % 256)
            } else if field.is_number() {
                json!(999)
            } else if path == "/receipt/intent" {
                json!(id(9).repeat(2))
            } else {
                json!("09090909090909090909090909090909")
            };
            replace(&f, 3, &changed);
            assert!(f.call(status(&handle, 3)).await.is_err(), "{path}");
        }
        // The provider's original receipt must also prove an unconfirmed command.
        let mut changed = original.clone();
        changed["receipt"] = Value::Null;
        changed["request"]["command"]["intent"]["title"] = json!("Substituted command");
        replace(&f, 3, &changed);
        assert!(f.call(status(&handle, 3)).await.is_err());
        replace(&f, 3, &original);
        let actor = std::fs::read(private(&f).join("actor.json")).unwrap();
        std::fs::write(
            private(&f).join("actor.json"),
            serde_json::to_vec(&id(9)).unwrap(),
        )
        .unwrap();
        assert!(f.call(status(&handle, 3)).await.is_err());
        std::fs::write(private(&f).join("actor.json"), actor).unwrap();
        assert_eq!(f.call(status(&handle, 3)).await.unwrap(), first);
    });
}

#[test]
fn preparation_requires_an_explicit_current_jj_owner_and_missing_status_is_read_only() {
    let f = Fixture::new();
    run(async {
        let legacy = f.call(open(1)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(prepare(&legacy, 3)).await.is_err());
        f.call(json!({"type":"close","handle":legacy}))
            .await
            .unwrap();
        let handle = setup(&f).await;
        assert!(f.call(status(&handle, 3)).await.unwrap()["data"].is_null());
        assert!(!private(&f).exists());
        assert!(
            jj_store_jj::local_repository::inspect_workspace(&f.vault)
                .unwrap()
                .repository
                .is_none()
        );
        for title in ["", " ", "bad\nname"] {
            let mut op = prepare(&handle, 3);
            op["title"] = json!(title);
            assert!(f.call(op).await.is_err());
        }
        assert!(!private(&f).exists());
        for key in [
            "root",
            "actor",
            "threadId",
            "conversationId",
            "generation",
            "repository",
        ] {
            let mut op = prepare(&handle, 3);
            op[key] = json!("outside");
            assert!(f.call(op).await.is_err());
        }
        assert!(
            f.call(prepare(&json!(uuid::Uuid::new_v4()), 3))
                .await
                .is_err()
        );
        f.backends.suspend("main").unwrap();
        f.host.0.lock().unwrap().ai.leave("main", true);
        assert!(f.call(prepare(&handle, 3)).await.is_err());
        f.activate();
        assert!(
            f.call(prepare(&handle, 3)).await.is_err(),
            "re-admission still requires explicit owner reattachment"
        );
        let replacement = f.call(open(4)).await.unwrap()["data"]["handle"].clone();
        assert!(f.call(prepare(&handle, 3)).await.is_err());
        f.call(prepare(&replacement, 3)).await.unwrap();
        std::fs::rename(&f.vault, f.vault.with_extension("retired")).unwrap();
        std::fs::create_dir(&f.vault).unwrap();
        assert!(f.call(status(&replacement, 3)).await.is_err());
    });
}
