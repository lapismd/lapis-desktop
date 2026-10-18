use super::*;
use tauri_plugin_lapis_ai::{HostPolicy, SessionBinding};

fn binding(f: &Fixture) -> SessionBinding {
    SessionBinding {
        session_id: uuid::Uuid::new_v4().to_string(),
        request_id: "native-open".into(),
        target_id: "native-conversation".into(),
        admission: f.policy.authorize(&Fixture::context()).unwrap(),
    }
}
#[test]
fn a_capture_permit_requires_an_explicit_backend_and_matches_every_native_binding_field() {
    let f = Fixture::new();
    run(async {
        let context = Fixture::context();
        let original = binding(&f);
        assert!(f.policy.authorize_processing(&context, &original).is_err());
        assert!(
            f.backends
                .register_processing(&f.host, &context, &original)
                .is_err()
        );
        let legacy = f.call(open(1)).await.unwrap();
        assert!(
            f.backends
                .register_processing(&f.host, &context, &original)
                .is_err()
        );
        f.call(json!({"type":"close","handle":legacy["data"]["handle"]}))
            .await
            .unwrap();
        f.call(select(2, 0)).await.unwrap();
        f.call(open(3)).await.unwrap();
        assert!(f.policy.authorize_processing(&context, &original).is_err());
        let permit = f
            .backends
            .register_processing(&f.host, &context, &original)
            .unwrap();
        assert_eq!(
            f.policy.authorize_processing(&context, &original).unwrap(),
            original.admission
        );
        assert!(
            f.backends
                .register_processing(&f.host, &context, &original)
                .is_err()
        );
        for field in 0..4 {
            let mut changed = original.clone();
            match field {
                0 => changed.session_id = uuid::Uuid::new_v4().to_string(),
                1 => changed.request_id = "other-open".into(),
                2 => changed.target_id = "other-target".into(),
                _ => changed.admission = "replacement".into(),
            }
            assert!(f.policy.authorize_processing(&context, &changed).is_err());
        }
        for (window, url) in [
            ("other", context.url.as_str()),
            ("main", "tauri://localhost/other"),
            ("main", "https://example.com"),
        ] {
            assert!(
                f.policy
                    .authorize_processing(
                        &HostContext {
                            window: window.into(),
                            url: url.into()
                        },
                        &original
                    )
                    .is_err()
            );
        }
        permit.check().unwrap();
        drop(permit);
        assert!(f.policy.authorize_processing(&context, &original).is_err());
        assert!(f.workers.targets(&context).unwrap().is_empty());
        assert!(f.workers.list(&context).unwrap().is_empty());
        // A retained permit cannot substitute for a prepared conversation target.
        // Rejected construction must never select a raw fallback.
        assert_eq!(
            f.policy.processor(&context, &original).err().unwrap().0,
            "capture_backend_not_admitted"
        );
        assert!(f.policy.authorize_processing(&context, &original).is_err());
    });
}

#[test]
fn exact_capture_survives_reload_and_closed_vault_token_without_renderer_authority() {
    let mut f = Fixture::new();
    run(async {
        f.call(select(1, 0)).await.unwrap();
        let first = f.call(open(2)).await.unwrap();
        let context = Fixture::context();
        let original = binding(&f);
        let permit = f
            .backends
            .register_processing(&f.host, &context, &original)
            .unwrap();
        {
            let mut services = f.host.0.lock().unwrap();
            assert!(services.ai.leave("main", true));
            assert!(services.ai.begin_close_vault(&f.session).is_empty());
            services.vaults.close(&f.session).unwrap();
            services.ai.finish_close_vault(&f.session);
        }
        f.backends.suspend("main").unwrap();
        permit.check().unwrap();
        assert_eq!(
            f.policy.authorize_processing(&context, &original).unwrap(),
            original.admission
        );
        assert!(f.policy.authorize(&context).is_err());
        assert!(f.call(json!({"type":"read"})).await.is_err());
        assert!(
            f.backends
                .register_processing(&f.host, &context, &original)
                .is_err()
        );
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
        assert!(f.policy.authorize(&context).is_err());
        permit.check().unwrap();
        assert_eq!(
            f.policy.authorize_processing(&context, &original).unwrap(),
            original.admission
        );
        {
            let mut services = f.host.0.lock().unwrap();
            let NativeServices { ai, vaults, .. } = &mut *services;
            ai.complete(vaults, &plan).unwrap();
        }
        let next = binding(&f);
        assert!(
            f.backends
                .register_processing(&f.host, &context, &next)
                .is_err(),
            "new construction requires the replacement renderer's reattached owner"
        );
        let attached = f.call(open(3)).await.unwrap();
        assert_ne!(attached["data"]["handle"], first["data"]["handle"]);
        let next_permit = f
            .backends
            .register_processing(&f.host, &context, &next)
            .unwrap();
        permit.check().unwrap();
        assert_eq!(
            f.policy.authorize_processing(&context, &original).unwrap(),
            original.admission
        );
        drop(next_permit);
        drop(permit);
        f.call(json!({"type":"close","handle":attached["data"]["handle"]}))
            .await
            .unwrap();
    });
}

#[test]
fn retirement_fences_capture_and_retains_the_backend_lease_until_the_native_permit_drops() {
    let f = Fixture::new();
    run(async {
        f.call(select(1, 0)).await.unwrap();
        f.call(open(2)).await.unwrap();
        let context = Fixture::context();
        let original = binding(&f);
        let permit = f
            .backends
            .register_processing(&f.host, &context, &original)
            .unwrap();
        let backends = f.backends.clone();
        let workers = f.workers.clone();
        let closing =
            tokio::spawn(
                async move { super::super::revoke(&workers, &backends, "main", None).await },
            );
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while permit.check().is_ok() {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
        assert!(f.policy.authorize_processing(&context, &original).is_err());
        assert!(!closing.is_finished());
        assert!(!f.backends.owners.lock().unwrap().is_empty());
        drop(permit);
        closing.await.unwrap().unwrap();
        assert!(f.backends.owners.lock().unwrap().is_empty());
        assert!(f.policy.authorize_processing(&context, &original).is_err());
    });
}

#[test]
fn physical_failure_or_terminal_window_fence_revoke_retained_capture_without_renderer_help() {
    for destroy in [false, true] {
        let f = Fixture::new();
        run(async {
            f.call(select(1, 0)).await.unwrap();
            f.call(open(2)).await.unwrap();
            let context = Fixture::context();
            let original = binding(&f);
            let permit = f
                .backends
                .register_processing(&f.host, &context, &original)
                .unwrap();
            f.host.0.lock().unwrap().ai.leave("main", true);
            f.host.0.lock().unwrap().vaults.close(&f.session).unwrap();
            if destroy {
                f.backends.destroy_window("main").unwrap();
            } else {
                std::fs::rename(&f.vault, f._root.path().join("parked")).unwrap();
                std::fs::create_dir(&f.vault).unwrap();
            }
            assert!(f.policy.authorize_processing(&context, &original).is_err());
            assert!(permit.check().is_err());
            drop(permit);
            super::super::revoke(&f.workers, &f.backends, "main", None)
                .await
                .unwrap();
            assert!(f.backends.owners.lock().unwrap().is_empty());
        });
    }
}

#[test]
fn capture_permits_are_bounded_and_dropped_entries_do_not_hold_capacity_or_a_writer_lease() {
    let f = Fixture::new();
    run(async {
        f.call(select(1, 0)).await.unwrap();
        let opened = f.call(open(2)).await.unwrap();
        let context = Fixture::context();
        let mut permits = Vec::new();
        for _ in 0..64 {
            permits.push(
                f.backends
                    .register_processing(&f.host, &context, &binding(&f))
                    .unwrap(),
            );
        }
        let extra = binding(&f);
        assert!(
            f.backends
                .register_processing(&f.host, &context, &extra)
                .is_err()
        );
        assert!(f.policy.authorize_processing(&context, &extra).is_err());
        permits.pop();
        let last = f
            .backends
            .register_processing(&f.host, &context, &extra)
            .unwrap();
        last.check().unwrap();
        drop(last);
        drop(permits);
        assert!(f.backends.processing.lock().unwrap().is_empty());
        f.call(json!({"type":"close","handle":opened["data"]["handle"]}))
            .await
            .unwrap();
        f.call(select(3, 1)).await.unwrap();
    });
}
