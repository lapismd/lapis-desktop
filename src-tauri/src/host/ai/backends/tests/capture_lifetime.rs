use super::{capture_cases::*, *};
use tauri_plugin_lapis_ai::HostPolicy;

#[test]
fn actual_processor_survives_verified_reload_but_close_fences_and_drains_it() {
    let mut f = Fixture::new();
    run(async {
        let (old_handle, _, binding) = setup(&f).await;
        let context = Fixture::context();
        let mut processor = f.policy.processor(&context, &binding).unwrap().unwrap();
        batch(processor.as_mut(), &binding, 1, &opened(&binding))
            .await
            .unwrap();
        {
            let mut services = f.host.0.lock().unwrap();
            assert!(services.ai.leave("main", true));
            assert!(services.ai.begin_close_vault(&f.session).is_empty());
            services.vaults.close(&f.session).unwrap();
            services.ai.finish_close_vault(&f.session);
        }
        f.backends.suspend("main").unwrap();
        assert!(f.policy.authorize(&context).is_err());
        assert!(f.policy.processor(&context, &binding).is_err());
        batch(
            processor.as_mut(),
            &binding,
            2,
            &text(&binding, "Retained answer"),
        )
        .await
        .unwrap();
        let plan = {
            let mut services = f.host.0.lock().unwrap();
            f.session = services
                .vaults
                .select(Some(f.vault.clone()), None)
                .unwrap()
                .unwrap()
                .session_id;
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.prepare(vaults, "main", &f.session).unwrap()
        };
        assert!(plan.preserves_workers());
        {
            let mut services = f.host.0.lock().unwrap();
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.complete(vaults, &plan).unwrap();
        }
        let mut fresh = binding.clone();
        fresh.session_id = uuid::Uuid::new_v4().to_string();
        assert!(
            f.policy.processor(&context, &fresh).is_err(),
            "a same-generation reload still requires owner reattachment"
        );
        let attached = f.call(open(5)).await.unwrap();
        assert_ne!(attached["data"]["handle"], old_handle);
        assert!(
            f.call(json!({"type":"close","handle":old_handle}))
                .await
                .is_err()
        );
        batch(processor.as_mut(), &binding, 3, &terminal(&binding))
            .await
            .unwrap();
        let backends = f.backends.clone();
        let host = f.host.clone();
        let workers = f.workers.clone();
        let request = f.frame(json!({"type":"close","handle":attached["data"]["handle"]}));
        let closing = tokio::spawn(async move {
            super::super::commands::dispatch(backends, host, workers, Fixture::context(), request)
                .await
        });
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while f.policy.authorize_processing(&context, &binding).is_ok() {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
        assert!(
            !closing.is_finished(),
            "native close must retain the selected owner through processor drain"
        );
        assert!(
            batch(
                processor.as_mut(),
                &binding,
                4,
                &text(&binding, "after fence")
            )
            .await
            .is_err()
        );
        assert_eq!(entries(&f).len(), 3);
        drop(processor);
        tokio::time::timeout(std::time::Duration::from_secs(5), closing)
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        assert!(f.backends.processing.lock().unwrap().is_empty());
        assert!(f.backends.owners.lock().unwrap().is_empty());
    });
}

#[test]
fn physical_replacement_or_window_destruction_fences_a_real_processor_before_durability() {
    for destroy in [false, true] {
        let f = Fixture::new();
        run(async {
            let (_, _, binding) = setup(&f).await;
            let context = Fixture::context();
            let mut processor = f.policy.processor(&context, &binding).unwrap().unwrap();
            batch(processor.as_mut(), &binding, 1, &opened(&binding))
                .await
                .unwrap();
            if destroy {
                f.backends.destroy_window("main").unwrap();
            } else {
                std::fs::rename(&f.vault, f._root.path().join("parked")).unwrap();
                std::fs::create_dir(&f.vault).unwrap();
            }
            assert!(
                batch(
                    processor.as_mut(),
                    &binding,
                    2,
                    &text(&binding, "private response")
                )
                .await
                .is_err()
            );
            assert_eq!(entries(&f).len(), 1);
            drop(processor);
            super::super::revoke(&f.workers, &f.backends, "main", None)
                .await
                .unwrap();
            assert!(f.backends.owners.lock().unwrap().is_empty());
        });
    }
}
