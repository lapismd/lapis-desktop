use super::{canonical_message_cases, capture_cases, *};
use jj_collab::{ThreadActionV1, ThreadCommandV1, ThreadId, ThreadStateV1};
use jj_store_core::{RepositoryStores, StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use tauri_plugin_lapis_ai::{
    HostPolicy, SessionBinding,
    runtime::{RequestInput, SessionProcessor, SessionRequest},
};

pub fn client(f: &Fixture) -> tempfile::TempDir {
    let (root, settings, home) = super::super::super::file_profile::tests::fixture();
    f.policy.configure_file_profile(settings, home).unwrap();
    f.policy.prepare_file_profile().unwrap();
    root
}
pub async fn setup(f: &Fixture) -> (Value, Value, Value, Arc<RepositoryStores>) {
    let (handle, thread, stores) = canonical_message_cases::setup(f).await;
    std::fs::remove_dir_all(super::conversations::private(f)).unwrap();
    let view = canonical_message_cases::view(f, &handle, &thread).await;
    (handle, thread, view, stores)
}
pub fn prepare(handle: &Value, request: u8, thread: &Value, selection: &Value) -> Value {
    json!({"type":"prepareCanonicalManagedCapture", "handle":handle, "requestId":id(request),
        "threadId":thread, "expectedSelection":selection, "clientId":"codex"})
}
pub fn processor(f: &Fixture, prepared: &Value) -> (SessionBinding, Box<dyn SessionProcessor>) {
    let binding = capture_cases::binding(f, prepared);
    f.policy
        .resolve(&Fixture::context(), &binding.target_id, None)
        .unwrap();
    let processor = f
        .policy
        .processor(&Fixture::context(), &binding)
        .unwrap()
        .unwrap();
    (binding, processor)
}
pub async fn prompt(
    processor: &mut dyn SessionProcessor,
    binding: &SessionBinding,
    request: u8,
    text: &str,
) -> Result<(), tauri_plugin_lapis_ai::runtime::Error> {
    processor
        .prepare_request(RequestInput {
            session_id: &binding.session_id,
            request_id: &uuid::Uuid::from_bytes([request; 16]).to_string(),
            request: &SessionRequest::Prompt {
                text: text.into(),
                context: Some("Separate injected context".into()),
                max_duration_ms: 1000,
            },
        })
        .await
}
pub async fn lifecycle(
    stores: &RepositoryStores,
    thread: ThreadId,
    request: u8,
    action: ThreadActionV1,
) {
    let pin = stores.thread().unwrap().snapshot().await.unwrap();
    let state = ThreadStateV1::read(pin.data.root.clone(), &pin.data.graph).unwrap();
    assert!(matches!(
        stores
            .thread()
            .unwrap()
            .execute(&StoreRequest::new(
                RequestId::new([request; 16]),
                ThreadCommandV1::Lifecycle {
                    thread_id: thread,
                    expected: state.threads[&thread],
                    action
                }
            ))
            .await
            .unwrap(),
        StoreOutcome::Committed(_)
    ));
}
