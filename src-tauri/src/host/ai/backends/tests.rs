mod cancellation;
mod capture_cases;
mod capture_guards;
mod capture_lifetime;
mod capture_privacy;
mod conversation_cancel;
mod conversation_read_content;
mod conversation_read_guards;
mod conversation_read_lifetime;
mod conversation_read_ranges;
mod conversation_reads;
mod conversations;
mod factory;
mod ownership;
mod processing;
use super::{NativeBackends, commands::dispatch};
use crate::host::{
    ai::policy::DesktopAiPolicy,
    state::{NativeHost, NativeServices},
};
use cap_std::{ambient_authority, fs::Dir};
use lapis_desktop::{
    database::NativeDatabases,
    vault::{VaultManager, admission::VaultAdmissions},
    watch::WatchRegistry,
};
use serde_json::{Value, json};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri_plugin_lapis_ai::{AcpHost, Config, HostContext};

struct Fixture {
    _root: tempfile::TempDir,
    vault: PathBuf,
    session: String,
    host: NativeHost,
    backends: Arc<NativeBackends>,
    workers: Arc<AcpHost>,
    policy: DesktopAiPolicy,
}
impl Fixture {
    fn new() -> Self {
        let root = tempfile::tempdir().unwrap();
        let profile = root.path().join("profile");
        let vault = root.path().join("vault");
        std::fs::create_dir(&vault).unwrap();
        let mut vaults = VaultManager::new(&profile).unwrap();
        let session = vaults
            .select(Some(vault.clone()), None)
            .unwrap()
            .unwrap()
            .session_id;
        let host = NativeHost(Arc::new(Mutex::new(NativeServices {
            ai: VaultAdmissions::default(),
            repository: Default::default(),
            vaults,
            databases: NativeDatabases::new(profile.join("databases")),
            watches: WatchRegistry::default(),
            fs_gate: Arc::new(Mutex::new(())),
        })));
        let backends = Arc::new(NativeBackends::new(
            Dir::open_ambient_dir(&profile, ambient_authority()).unwrap(),
        ));
        let policy = DesktopAiPolicy::default();
        let workers = Arc::new(AcpHost::new(Arc::new(policy.clone()), Config::default()).unwrap());
        policy
            .initialize(host.clone(), &workers, backends.clone())
            .unwrap();
        let value = Self {
            _root: root,
            vault,
            session,
            host,
            backends,
            workers,
            policy,
        };
        value.activate();
        value
    }
    fn activate(&self) -> String {
        let mut services = self.host.0.lock().unwrap();
        let NativeServices { ai, vaults, .. } = &mut *services;
        let plan = ai.prepare(vaults, "main", &self.session).unwrap();
        ai.complete(vaults, &plan).unwrap().generation().into()
    }
    fn context() -> HostContext {
        HostContext {
            window: "main".into(),
            url: "tauri://localhost/index.html".into(),
        }
    }
    fn frame(&self, operation: Value) -> String {
        json!({"version":1,"sessionId":self.session,"operation":operation}).to_string()
    }
    async fn call(&self, operation: Value) -> std::io::Result<Value> {
        let text = dispatch(
            self.backends.clone(),
            self.host.clone(),
            self.workers.clone(),
            Self::context(),
            self.frame(operation),
        )
        .await?;
        let value: Value = serde_json::from_str(&text).unwrap();
        assert_eq!(value["version"], 1);
        Ok(value["data"].clone())
    }
    fn blocking_jobs(&self) -> usize {
        self.backends
            .blocking_started
            .load(std::sync::atomic::Ordering::Acquire)
    }
    async fn wait_for_blocking_job(&self, before: usize) {
        // A Tokio mutex can reserve its next grant before the waiting future
        // resumes. Observe actual native worker entry before cancelling IPC.
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while self.blocking_jobs() == before {
                tokio::task::yield_now().await;
            }
        })
        .await
        .unwrap();
    }
}
fn run<T>(future: impl std::future::Future<Output = T>) -> T {
    tauri::async_runtime::block_on(future)
}
fn id(n: u8) -> String {
    jj_store_model::RequestId::new([n; 16]).to_string()
}
fn open(n: u8) -> Value {
    json!({"type":"open","requestId":id(n)})
}
fn select(n: u8, revision: u32) -> Value {
    json!({"type":"select","requestId":id(n),"expectedRevision":revision,"backend":"vault-files"})
}

#[test]
fn native_backend_owner_is_constructed_without_opening_a_writer() {
    let profile = tempfile::tempdir().unwrap();
    let _owner =
        NativeBackends::new(Dir::open_ambient_dir(profile.path(), ambient_authority()).unwrap());
    assert!(!profile.path().join("ai-backends-v1").exists());
}
#[test]
fn backend_frames_reject_authority_and_noncanonical_operations() {
    let f = Fixture::new();
    run(async {
        for extra in ["root", "generation", "window", "cache", "url", "metadata"] {
            let mut value: Value = serde_json::from_str(&f.frame(json!({"type":"read"}))).unwrap();
            value[extra] = json!("outside");
            assert!(super::frames::Request::decode(&value.to_string()).is_err());
            let frame = f.frame(json!({"type":"read",extra:"outside"}));
            assert!(super::frames::Request::decode(&frame).is_err());
        }
        for operation in [
            json!({"type":"select","requestId":id(1),"expectedRevision":-1,"backend":"jj"}),
            json!({"type":"open","requestId":"arbitrary"}),
            json!({"type":"execute"}),
        ] {
            assert!(f.call(operation).await.is_err());
        }
        let mut value: Value = serde_json::from_str(&f.frame(open(1))).unwrap();
        value["version"] = json!(2);
        assert!(super::frames::Request::decode(&value.to_string()).is_err());
        assert!(super::frames::Request::decode(&" ".repeat(4097)).is_err());
        for (window, url) in [
            ("other", "tauri://localhost"),
            ("main", "https://example.com"),
            ("main", "tauri://user@localhost"),
        ] {
            assert!(
                dispatch(
                    f.backends.clone(),
                    f.host.clone(),
                    f.workers.clone(),
                    HostContext {
                        window: window.into(),
                        url: url.into()
                    },
                    f.frame(open(1))
                )
                .await
                .is_err()
            );
        }
        let mut stale: Value = serde_json::from_str(&f.frame(open(1))).unwrap();
        stale["sessionId"] = json!("stale");
        assert!(
            dispatch(
                f.backends.clone(),
                f.host.clone(),
                f.workers.clone(),
                Fixture::context(),
                stale.to_string()
            )
            .await
            .is_err()
        );
        assert!(f.backends.owners.lock().unwrap().is_empty());
    });
}
