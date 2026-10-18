mod files;
mod process;
mod records;
use cap_std::{ambient_authority, fs::Dir};
use jj_store_conversations::store_capture::*;
use jj_store_core::PublicationScope;
use lapis_desktop::ai::journal::ProfileJournal;
use sha2::{Digest, Sha256};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};

pub(super) fn context() -> ContextV1 {
    serde_json::from_value(serde_json::json!({"repository":"01010101010101010101010101010101","thread":"02020202020202020202020202020202","binding":{"scope":"vault","worker":"worker","request":"open","target":"target","window":"main","admission":"generation"},"policy":"fixture/v1"})).unwrap()
}
pub(super) fn provider(c: &ContextV1) -> PublicationScope {
    PublicationScope {
        repository: Some(c.repository),
        authority: "git-companion:private-fixture".into(),
    }
}
fn candidate(ordinal: u64) -> CandidateV1 {
    let context = context();
    let capture=serde_json::to_vec(&serde_json::json!({"schema":1,"policy":context.policy,"binding":context.binding,"ordinal":ordinal,"publication":{"kind":"facts"},"frames":[{"version":3,"type":"opened","sessionId":"worker","requestId":"open","adapterSessionId":"provider"}]})).unwrap();
    CandidateV1 {
        schema: 1,
        context,
        ordinal,
        capture_digest: Sha256::new_with_prefix(b"jj-store/native-capture/v1\0")
            .chain_update(&capture)
            .finalize()
            .into(),
        capture,
    }
}
fn prepared(c: &CandidateV1) -> PreparedV1 {
    serde_json::from_value(serde_json::json!({"schema":1,"capture_digest":c.capture_digest,"request_id":c.request(),"publication_id":null,"command":{"kind":"capture","binding":{"thread_id":c.context.thread,"observed_thread":{"kind":"thread_version","id":"0303030303030303030303030303030303030303030303030303030303030303"},"observed_assignment":null}}})).unwrap()
}
fn confirmation(c: &CandidateV1) -> ConfirmationV1 {
    serde_json::from_value(serde_json::json!({"schema":1,"request_id":c.request(),"actor":"04040404040404040404040404040404","repository":c.context.repository,"version":1,"selection":[1],"provider_receipt":[2],"root":"0505050505050505050505050505050505050505050505050505050505050505","batch":c.batch_id()})).unwrap()
}
fn open(root: &Path) -> ProfileJournal {
    let profile = Dir::open_ambient_dir(root, ambient_authority()).unwrap();
    let c = context();
    ProfileJournal::open(&profile, c.clone(), &provider(&c), Arc::new(|| Ok(()))).unwrap()
}
fn journal_path(root: &Path) -> PathBuf {
    std::fs::read_dir(root.join("ai-capture-v1"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path()
}
fn run<T>(value: impl std::future::Future<Output = T>) -> T {
    tauri::async_runtime::block_on(value)
}
