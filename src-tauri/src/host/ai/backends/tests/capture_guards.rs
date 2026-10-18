use super::{capture_cases::*, *};
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn capture_preparations_are_exact_bounded_and_idle_plans_do_not_block_close() {
    let f = Fixture::new();
    run(async {
        let (handle, _, binding) = setup(&f).await;
        let first = f.call(prepare(&handle, 4, 3)).await.unwrap();
        assert_eq!(first["data"]["targetId"], binding.target_id);
        assert!(f.call(prepare(&handle, 4, 9)).await.is_err());
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        for request in 5..68 {
            f.call(prepare(&handle, request, 3)).await.unwrap();
        }
        assert!(f.call(prepare(&handle, 68, 3)).await.is_err());
        assert_eq!(f.call(prepare(&handle, 4, 3)).await.unwrap(), first);
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
        assert!(!profile(&f).join("ai-capture-v1").exists());
        assert!(f.backends.processing.lock().unwrap().is_empty());
        tokio::time::timeout(
            std::time::Duration::from_secs(5),
            f.call(json!({"type":"close","handle":handle})),
        )
        .await
        .unwrap()
        .unwrap();
        f.call(json!({"type":"select","requestId":id(70),"expectedRevision":1,"backend":"vault-files"})).await.unwrap();
    });
}

#[test]
fn unknown_original_conversation_is_not_published_by_capture_preparation() {
    let f = Fixture::new();
    run(async {
        privacy(&f);
        let handle = super::conversations::setup(&f).await;
        assert!(f.call(prepare(&handle, 4, 3)).await.is_err());
        let first = f
            .call(super::conversations::prepare(&handle, 3))
            .await
            .unwrap();
        let mut record = super::conversations::record(&f, 3);
        record["receipt"] = Value::Null;
        record["request"]["request_id"] = json!(id(9));
        record["repository"] = first["data"]["repository"].clone();
        record["request"]["command"]["intent"]["thread_id"] = json!(id(9));
        super::conversations::replace(&f, 9, &record);
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        assert!(f.call(prepare(&handle, 4, 9)).await.is_err());
        assert!(f.call(prepare(&handle, 4, 9)).await.is_err());
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
        assert!(
            f.backends.owners.lock().unwrap()["main"]
                .captures
                .is_empty()
        );
        assert!(!profile(&f).join("ai-capture-v1").exists());
    });
}

#[test]
fn changed_private_preparation_or_binding_rejects_the_factory_without_a_retained_permit() {
    let f = Fixture::new();
    run(async {
        let (handle, _, binding) = setup(&f).await;
        let original = super::conversations::record(&f, 3);
        for path in [
            "/source/0",
            "/actor",
            "/selection/revision",
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
                json!(id(9))
            };
            super::conversations::replace(&f, 3, &changed);
            assert!(f.call(prepare(&handle, 4, 3)).await.is_err(), "{path}");
            assert!(
                f.policy.processor(&Fixture::context(), &binding).is_err(),
                "{path}"
            );
            assert!(f.backends.processing.lock().unwrap().is_empty(), "{path}");
        }
        super::conversations::replace(&f, 3, &original);
        for index in 0..3 {
            let mut changed = binding.clone();
            match index {
                0 => changed.target_id = uuid::Uuid::new_v4().to_string(),
                1 => changed.admission = "other".into(),
                _ => changed.session_id = "bad\nworker".into(),
            }
            assert!(f.policy.processor(&Fixture::context(), &changed).is_err());
        }
        let context = HostContext {
            window: "main".into(),
            url: "tauri://localhost/other".into(),
        };
        assert!(f.policy.processor(&context, &binding).is_err());
        assert!(f.backends.processing.lock().unwrap().is_empty());
        assert!(!profile(&f).join("ai-capture-v1").exists());
    });
}

#[test]
fn missing_native_privacy_cache_refuses_factory_and_releases_the_temporary_permit() {
    let f = Fixture::new();
    run(async {
        let (_, _, binding) = setup(&f).await;
        let temporary = f._root.path().join("temporary");
        std::fs::remove_dir(&temporary).unwrap();
        assert!(f.policy.processor(&Fixture::context(), &binding).is_err());
        assert!(
            f.policy
                .authorize_processing(&Fixture::context(), &binding)
                .is_err()
        );
        assert!(f.backends.processing.lock().unwrap().is_empty());
        assert!(!profile(&f).join("ai-capture-v1").exists());
        std::fs::create_dir(temporary).unwrap();
        assert!(
            f.policy
                .processor(&Fixture::context(), &binding)
                .unwrap()
                .is_some()
        );
    });
}

#[test]
fn privacy_collision_stops_before_any_journal_candidate_or_agent_publication() {
    let f = Fixture::new();
    run(async {
        let (_, _, binding) = setup(&f).await;
        let mut processor = f
            .policy
            .processor(&Fixture::context(), &binding)
            .unwrap()
            .unwrap();
        let home = f._root.path().join("home").canonicalize().unwrap();
        let mut frame = opened(&binding);
        frame["payload"] = json!({home.to_str().unwrap():"one", "$HOME":"two"});
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        assert!(
            batch(processor.as_mut(), &binding, 1, &frame)
                .await
                .is_err()
        );
        assert!(
            batch(processor.as_mut(), &binding, 1, &opened(&binding))
                .await
                .is_err()
        );
        assert!(entries(&f).is_empty());
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
    });
}

#[test]
fn unknown_journal_outcome_never_falls_back_or_replays_the_failed_batch() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    run(async {
        let (_, _, binding) = setup(&f).await;
        let mut processor = f
            .policy
            .processor(&Fixture::context(), &binding)
            .unwrap()
            .unwrap();
        batch(processor.as_mut(), &binding, 1, &opened(&binding))
            .await
            .unwrap();
        let first = entries(&f).remove(0);
        let directory = std::fs::read_dir(profile(&f).join("ai-capture-v1"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        let path = directory.join(format!("{}.json", first.candidate.context.request(2)));
        std::fs::create_dir(&path).unwrap();
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o700)).unwrap();
        let selected = metadata(&f).read().unwrap().unwrap().commit();
        let frame = text(&binding, "Safe private answer");
        assert_eq!(
            batch(processor.as_mut(), &binding, 2, &frame)
                .await
                .err()
                .unwrap()
                .0,
            "native_capture_unknown"
        );
        assert!(
            batch(processor.as_mut(), &binding, 2, &frame)
                .await
                .is_err()
        );
        assert!(
            path.is_dir(),
            "the unreadable retained candidate cannot be replaced"
        );
        assert_eq!(metadata(&f).read().unwrap().unwrap().commit(), selected);
    });
}
