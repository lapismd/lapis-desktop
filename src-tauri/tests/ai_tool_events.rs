use lapis_desktop::ai::tools::{Binding, Limits, ToolSpec};
use std::sync::Arc;
fn tool() -> ToolSpec {
    ToolSpec {
        name: "notes.read".into(),
        description: "Read".into(),
        input_schema: serde_json::json!({"type":"object"}),
    }
}
fn limits() -> Limits {
    Limits::default()
}
#[tokio::test]
async fn fencing_releases_host_event_handles_before_cleanup_or_unknown_effect_drain() {
    let owner = Arc::new(());
    let weak = Arc::downgrade(&owner);
    let binding = Binding::open(
        vec![tool()],
        Arc::new(|| Ok(())),
        Arc::new(move |_| {
            std::hint::black_box(&owner);
            Ok(())
        }),
        limits(),
    )
    .await
    .unwrap();
    assert!(weak.upgrade().is_some());
    binding.fence().unwrap();
    assert!(weak.upgrade().is_none());
    binding.close().await.unwrap();
}
