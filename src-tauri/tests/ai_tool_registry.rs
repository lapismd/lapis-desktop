use lapis_desktop::ai::tools::{Owner, Registry, ToolSpec};
use serde_json::json;
use std::{
    io,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
};
use uuid::Uuid;

fn owner() -> Owner {
    Owner {
        window: "main".into(),
        session: "original".into(),
        generation: "first".into(),
    }
}
fn tool() -> ToolSpec {
    ToolSpec {
        name: "notes.read".into(),
        description: "Read".into(),
        input_schema: json!({"type":"object"}),
    }
}
#[tokio::test]
async fn registry_fences_original_scope_and_never_reuses_request_identity() {
    let registry = Registry::default();
    let request = Uuid::new_v4();
    registry
        .open(
            request,
            owner(),
            vec![tool()],
            Arc::new(|| Ok(())),
            Arc::new(|_| Ok(())),
        )
        .await
        .unwrap();
    let binding = registry.binding(request, &owner()).unwrap();
    let (config, _) = binding.launch().unwrap();
    let mut other = owner();
    other.generation = "second".into();
    assert!(registry.binding(request, &other).is_err());
    assert!(registry.close(request, "other", "original").await.is_err());
    registry.fence("main", Some("first")).unwrap();
    assert!(binding.arm(Uuid::new_v4()).is_err());
    registry.drain("main", Some("first")).await.unwrap();
    assert!(!config.exists());
    assert!(registry.binding(request, &owner()).is_err());
    registry.close(request, "main", "original").await.unwrap();
    assert!(
        registry
            .open(
                request,
                other,
                vec![tool()],
                Arc::new(|| Ok(())),
                Arc::new(|_| Ok(()))
            )
            .await
            .is_err()
    );
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn lost_open_reply_and_late_setup_are_still_fenced_and_cleaned_by_original_request() {
    let registry = Arc::new(Registry::default());
    let request = Uuid::new_v4();
    let checks = Arc::new(AtomicUsize::new(0));
    let checked = checks.clone();
    let (started, starting) = std::sync::mpsc::channel();
    let (release, released) = std::sync::mpsc::channel();
    let released = std::sync::Mutex::new(released);
    let opening = registry.clone();
    let task = tokio::spawn(async move {
        opening
            .open(
                request,
                owner(),
                vec![tool()],
                Arc::new(move || {
                    // The first check is pre-reservation; block the owned setup's next check.
                    if checked.fetch_add(1, Ordering::SeqCst) == 1 {
                        started.send(()).map_err(|_| io::Error::other("closed"))?;
                        released
                            .lock()
                            .unwrap()
                            .recv()
                            .map_err(|_| io::Error::other("closed"))?;
                    }
                    Ok(())
                }),
                Arc::new(|_| Ok(())),
            )
            .await
    });
    tokio::task::spawn_blocking(move || {
        starting
            .recv_timeout(std::time::Duration::from_secs(2))
            .unwrap()
    })
    .await
    .unwrap();
    // Drop the waiting caller, not its independently owned setup.
    task.abort();
    registry.fence("main", Some("first")).unwrap();
    release.send(()).unwrap();
    registry.close(request, "main", "original").await.unwrap();
    assert!(registry.binding(request, &owner()).is_err());
    assert!(checks.load(Ordering::SeqCst) >= 2);
}
#[tokio::test]
async fn dropping_registry_retires_retained_binding_and_preserves_no_launch_authority() {
    let registry = Registry::default();
    let request = Uuid::new_v4();
    registry
        .open(
            request,
            owner(),
            vec![tool()],
            Arc::new(|| Ok(())),
            Arc::new(|_| Ok(())),
        )
        .await
        .unwrap();
    let binding = registry.binding(request, &owner()).unwrap();
    drop(registry);
    assert!(binding.launch().is_err());
    binding.close().await.unwrap();
}
