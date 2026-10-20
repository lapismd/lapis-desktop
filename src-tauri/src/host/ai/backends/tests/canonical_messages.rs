use super::{canonical_message_cases::*, capture_cases, conversations, *};

#[test]
fn canonical_authorship_keeps_opaque_source_identity_after_creation_cache_loss() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, _) = setup(&f).await;
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        let before = view(&f, &handle, &thread).await;
        let dirty = b"Unsnapshotted editor change\n";
        std::fs::write(f.vault.join("Note.md"), dirty).unwrap();
        let text = format!(
            "Review {}/Note.md {}\n\nAnd retain the original source.",
            f.vault.canonicalize().unwrap().display(),
            capture_cases::TOKEN
        );
        let command = append(&handle, 10, &thread, &before["selection"], &text);
        let first = f.call(command.clone()).await.unwrap();
        assert_eq!(first["type"], "canonicalConversationMessage");
        assert_eq!(first["data"]["conversation"], before["conversation"]);
        assert_eq!(
            first["data"]["conversation"]["target"]["id"],
            "external:canonical-authorship"
        );
        assert!(first["data"]["receipt"].is_string());
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let current = view(&f, &handle, &thread).await;
        assert_eq!(current["messages"].as_array().unwrap().len(), 1);
        assert_eq!(
            current["messages"][0]["message_id"],
            first["data"]["messageId"]
        );
        let body = current["messages"][0]["body"].as_str().unwrap();
        assert!(body.contains("$WORKSPACE/Note.md") && body.contains("[REDACTED]"));
        assert!(!body.contains(capture_cases::TOKEN));
        let saved = std::fs::read_to_string(path(&f, 10)).unwrap();
        assert!(!saved.contains(capture_cases::TOKEN));
        assert!(!saved.contains(f.vault.canonicalize().unwrap().to_str().unwrap()));
        assert!(
            !conversations::private(&f)
                .join(format!("{}.json", id(3)))
                .exists()
        );
        assert_eq!(f.call(command.clone()).await.unwrap(), first);
        assert_eq!(f.call(status(&handle, 10, &thread)).await.unwrap(), first);
        std::fs::remove_dir_all(conversations::private(&f)).unwrap();
        assert_eq!(f.call(status(&handle, 10, &thread)).await.unwrap(), first);
        assert_eq!(f.call(command).await.unwrap(), first);
        assert!(!conversations::private(&f).exists());
        assert_eq!(
            capture_cases::metadata(&f)
                .read()
                .unwrap()
                .unwrap()
                .commit(),
            selected
        );
        assert_eq!(std::fs::read(f.vault.join("Note.md")).unwrap(), dirty);
        assert!(f.workers.list(&Fixture::context()).unwrap().is_empty());
    });
}

#[test]
fn canonical_authorship_restores_only_original_receipts_and_never_replays_an_unknown_command() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, _) = setup(&f).await;
        let before = view(&f, &handle, &thread).await;
        let text = "A retained canonical message\n\nWith Markdown **content**.";
        let first = f
            .call(append(&handle, 10, &thread, &before["selection"], text))
            .await
            .unwrap();
        let mut lost = record(&f, 10);
        lost["receipt"] = Value::Null;
        replace(&f, 10, &lost);
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        assert_eq!(f.call(status(&handle, 10, &thread)).await.unwrap(), first);
        let current = view(&f, &handle, &thread).await;
        let pending = unpublished(lost, 11, &current);
        replace(&f, 11, &pending);
        let unknown = f.call(status(&handle, 11, &thread)).await.unwrap();
        assert!(unknown["data"]["receipt"].is_null());
        assert_eq!(
            f.call(append(&handle, 11, &thread, &current["selection"], text))
                .await
                .unwrap(),
            unknown
        );
        assert_eq!(
            view(&f, &handle, &thread).await["messages"]
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
        assert_eq!(record(&f, 11), pending);
        f.call(json!({"type":"close","handle":handle}))
            .await
            .unwrap();
        let fresh = f.call(open(12)).await.unwrap()["data"]["handle"].clone();
        assert_eq!(f.call(status(&fresh, 10, &thread)).await.unwrap(), first);
        assert_eq!(f.call(status(&fresh, 11, &thread)).await.unwrap(), unknown);
    });
}

#[test]
fn canonical_authorship_cannot_change_the_original_text_selection_or_native_proof() {
    let f = Fixture::new();
    run(async {
        let (handle, thread, _) = setup(&f).await;
        let before = view(&f, &handle, &thread).await;
        let text = "Keep this exact native intent";
        let command = append(&handle, 10, &thread, &before["selection"], text);
        f.call(command.clone()).await.unwrap();
        let original = record(&f, 10);
        let selected = capture_cases::metadata(&f)
            .read()
            .unwrap()
            .unwrap()
            .commit();
        let mut changed_text = command.clone();
        changed_text["message"]["text"] = json!("Replacement");
        assert!(f.call(changed_text).await.is_err());
        let mut changed_selection = command.clone();
        changed_selection["message"]["expectedSelection"] = json!([0]);
        assert!(f.call(changed_selection).await.is_err());
        for field in [
            "actor",
            "identity",
            "source",
            "selection",
            "observed",
            "fingerprint",
            "seed",
            "receipt",
            "request",
        ] {
            let mut changed = original.clone();
            match field {
                "actor" => changed[field] = json!(id(99)),
                "identity" => changed[field]["target"]["id"] = json!("substituted opaque target"),
                "source" | "observed" | "fingerprint" | "seed" => {
                    changed[field][0] = json!((original[field][0].as_u64().unwrap() + 1) % 256)
                }
                "selection" => changed[field]["revision"] = json!(999),
                "receipt" => changed[field]["actor"] = json!(id(99)),
                "request" => {
                    changed[field]["command"]["intent"]["body"] = json!("Substituted body")
                }
                _ => unreachable!(),
            }
            replace(&f, 10, &changed);
            assert!(
                f.call(status(&handle, 10, &thread)).await.is_err(),
                "{field}"
            );
            assert!(f.call(command.clone()).await.is_err(), "{field}");
            assert_eq!(
                capture_cases::metadata(&f)
                    .read()
                    .unwrap()
                    .unwrap()
                    .commit(),
                selected
            );
        }
        replace(&f, 10, &original);
        assert!(f.call(status(&handle, 10, &thread)).await.unwrap()["data"]["receipt"].is_string());
    });
}
