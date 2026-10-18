use super::{capture_cases::*, *};
use tauri_plugin_lapis_ai::HostPolicy;

pub(super) fn read(handle: &Value, request: u8) -> Value {
    json!({"type":"readConversation","handle":handle,"requestId":id(request)})
}
#[test]
fn ordinary_conversation_read_returns_exact_thread_and_sanitized_capture_without_publication() {
    let f = Fixture::new();
    run(async {
        let (handle, conversation, binding) = setup(&f).await;
        let mut processor = f
            .policy
            .processor(&Fixture::context(), &binding)
            .unwrap()
            .unwrap();
        batch(processor.as_mut(), &binding, 1, &opened(&binding))
            .await
            .unwrap();
        let vault = f.vault.canonicalize().unwrap().display().to_string();
        batch(
            processor.as_mut(),
            &binding,
            2,
            &text(
                &binding,
                &format!("Native safe answer {vault}/note.md {TOKEN}"),
            ),
        )
        .await
        .unwrap();
        batch(processor.as_mut(), &binding, 3, &terminal(&binding))
            .await
            .unwrap();
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        let retained =
            std::fs::read(super::conversations::private(&f).join(format!("{}.json", id(3))))
                .unwrap();
        let reply = f
            .call(read(&handle, 3))
            .await
            .expect("ordinary native read must expose the real persisted conversation");
        assert_eq!(reply["type"], "conversationView");
        let encoded = reply["data"]
            .as_str()
            .expect("native JSON text preserves full-width numbers");
        let snapshot: Value = serde_json::from_str(encoded).unwrap();
        assert_eq!(snapshot["version"], 1);
        assert_eq!(snapshot["conversation"], conversation["data"]);
        assert_eq!(
            snapshot["thread"]["thread_id"],
            conversation["data"]["threadId"]
        );
        assert_eq!(snapshot["sessions"].as_array().unwrap().len(), 1);
        assert!(encoded.contains("Native safe answer"));
        assert!(encoded.contains("$WORKSPACE/note.md"));
        assert!(encoded.contains("[REDACTED]"));
        assert!(!encoded.contains(&vault));
        assert!(!encoded.contains(TOKEN));
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
        assert_eq!(
            std::fs::read(super::conversations::private(&f).join(format!("{}.json", id(3))))
                .unwrap(),
            retained
        );
    });
}
