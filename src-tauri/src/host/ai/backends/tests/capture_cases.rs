use super::*;
use jj_store_conversations::store_capture::EntryV1;
use jj_store_core::{
    Access, RepositoryStores, StoreConfig, StoreContext, StoreFactories, StoreHost, StoreKind,
};
use jj_store_git::{GitProvider, LocalRepository, metadata::MetadataStore};
use jj_store_model::PrincipalId;
use tauri_plugin_lapis_ai::{
    HostPolicy, SessionBinding,
    runtime::{Error, FrameBatch, FrameInput, FramePublication, SessionProcessor},
};

pub const TOKEN: &str = concat!("ghp_", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K");
pub fn privacy(f: &Fixture) {
    let home = f._root.path().join("home");
    let temporary = f._root.path().join("temporary");
    std::fs::create_dir(&home).unwrap();
    std::fs::create_dir(&temporary).unwrap();
    f.backends
        .privacy
        .set(super::super::privacy::Roots::new(home, temporary).unwrap())
        .ok()
        .unwrap();
}
pub fn prepare(handle: &Value, request: u8, conversation: u8) -> Value {
    json!({"type":"prepareCapture","handle":handle,"requestId":id(request),"conversationRequestId":id(conversation)})
}
pub async fn setup(f: &Fixture) -> (Value, Value, SessionBinding) {
    privacy(f);
    let handle = super::conversations::setup(f).await;
    let conversation = f
        .call(super::conversations::prepare(&handle, 3))
        .await
        .unwrap();
    let prepared = f.call(prepare(&handle, 4, 3)).await.unwrap();
    let binding = binding(f, &prepared);
    (handle, conversation, binding)
}
pub fn binding(f: &Fixture, prepared: &Value) -> SessionBinding {
    SessionBinding {
        session_id: uuid::Uuid::new_v4().to_string(),
        request_id: "native-open".into(),
        target_id: prepared["data"]["targetId"].as_str().unwrap().into(),
        admission: f.policy.authorize(&Fixture::context()).unwrap(),
    }
}
pub fn opened(binding: &SessionBinding) -> Value {
    json!({"version":3,"type":"opened","sessionId":binding.session_id,"requestId":binding.request_id,"adapterSessionId":"provider","sequence":2})
}
pub fn text(binding: &SessionBinding, text: &str) -> Value {
    json!({"version":3,"type":"activity","sessionId":binding.session_id,"requestId":"turn","sequence":81,"update":{"sessionUpdate":"agent_message_chunk","content":{"type":"text","text":text}}})
}
pub fn terminal(binding: &SessionBinding) -> Value {
    json!({"version":3,"type":"record","sessionId":binding.session_id,"requestId":"turn","sequence":82,"record":{"status":"completed"}})
}
pub async fn batch(
    processor: &mut dyn SessionProcessor,
    binding: &SessionBinding,
    ordinal: u64,
    frame: &Value,
) -> std::result::Result<FrameBatch, Error> {
    processor
        .process_batch(FrameInput {
            session_id: &binding.session_id,
            ordinal,
            publication: if ordinal == 1 {
                FramePublication::Facts
            } else {
                FramePublication::Event {
                    sequence: ordinal - 1,
                }
            },
            frame,
        })
        .await
}
pub fn metadata(f: &Fixture) -> MetadataStore {
    jj_store_jj::local_repository::inspect_workspace(&f.vault)
        .unwrap()
        .open_metadata()
        .unwrap()
        .carrier()
        .clone()
}
struct Host {
    backends: Arc<NativeBackends>,
    host: NativeHost,
    actor: PrincipalId,
}
#[async_trait::async_trait]
impl StoreHost for Host {
    async fn authorize(&self, kind: StoreKind, _: Access) -> jj_store_core::Result<()> {
        if !matches!(kind, StoreKind::Agent | StoreKind::Thread) {
            return Err(jj_store_core::Error::Denied);
        }
        self.backends
            .current(&self.host, "main")
            .map(|_| ())
            .map_err(|_| jj_store_core::Error::Denied)
    }
    fn actor(&self, _: bool) -> jj_store_core::Result<Option<PrincipalId>> {
        Ok(Some(self.actor))
    }
    fn now_millis(&self) -> jj_store_core::Result<i64> {
        Ok(12345)
    }
}
pub fn stores(f: &Fixture, conversation: &Value) -> Arc<RepositoryStores> {
    let repository = serde_json::from_value(conversation["data"]["repository"].clone()).unwrap();
    let actor =
        serde_json::from_value(super::conversations::record(f, 3)["actor"].clone()).unwrap();
    let provider =
        GitProvider::new(LocalRepository::new(&f.vault, metadata(f)).bound_to(repository));
    let mut factories = StoreFactories::empty();
    provider.add_agent_store(&mut factories, "git").unwrap();
    provider.add_thread_store(&mut factories, "git").unwrap();
    let mut config = StoreConfig::default();
    config.enable(StoreKind::Agent, "git");
    config.enable(StoreKind::Thread, "git");
    Arc::new(
        factories
            .loader()
            .open(
                &config,
                StoreContext::new(
                    provider.scope(),
                    Arc::new(Host {
                        backends: f.backends.clone(),
                        host: f.host.clone(),
                        actor,
                    }),
                ),
            )
            .unwrap(),
    )
}
pub fn entries(f: &Fixture) -> Vec<EntryV1> {
    let root = profile(f).join("ai-capture-v1");
    let mut entries = Vec::new();
    for directory in std::fs::read_dir(root).unwrap() {
        for item in std::fs::read_dir(directory.unwrap().path()).unwrap() {
            let path = item.unwrap().path();
            if path.extension().is_some_and(|s| s == "json")
                && path.file_name().unwrap() != "binding.json"
            {
                entries.push(EntryV1::decode(&std::fs::read(path).unwrap()).unwrap());
            }
        }
    }
    entries.sort_by_key(|entry| entry.candidate.ordinal);
    entries
}
pub fn profile(f: &Fixture) -> PathBuf {
    super::conversations::private(f)
        .parent()
        .unwrap()
        .to_owned()
}
