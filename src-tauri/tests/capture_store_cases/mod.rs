use cap_std::{ambient_authority, fs::Dir};
use jj_store_conversations::{native_privacy::TRANSCRIPT_POLICY, store_capture::ContextV1};
use jj_store_core::*;
use jj_store_git::{GitProvider, LocalRepository, metadata::MetadataStore};
use jj_store_model::{PrincipalId, RequestId};
use lapis_desktop::vault::{VaultManager, admission::VaultAdmissions};
use std::{
    path::{Path, PathBuf},
    process::Command,
    sync::{Arc, Mutex},
};

pub fn run<T>(value: impl std::future::Future<Output = T>) -> T {
    tauri::async_runtime::block_on(value)
}
struct Authority {
    vaults: VaultManager,
    ai: VaultAdmissions,
    generation: String,
}
pub struct Host(Mutex<Authority>);
impl Host {
    pub fn current(&self) -> Result<()> {
        let mut state = self.0.lock().unwrap();
        let Authority {
            vaults,
            ai,
            generation,
        } = &mut *state;
        let lease = ai.authorize(vaults, "main").map_err(|_| Error::Denied)?;
        if lease.generation() != generation {
            return Err(Error::Denied);
        }
        Ok(())
    }
    pub fn revoke(&self) {
        self.0.lock().unwrap().ai.leave("main", false);
    }
}
#[async_trait::async_trait]
impl StoreHost for Host {
    async fn authorize(&self, _: StoreKind, _: Access) -> Result<()> {
        self.current()
    }
    fn actor(&self, _: bool) -> Result<Option<PrincipalId>> {
        Ok(Some(PrincipalId::new([9; 16])))
    }
    fn now_millis(&self) -> Result<i64> {
        Ok(12345)
    }
}
fn stores(repository: LocalRepository, host: Arc<Host>) -> Arc<RepositoryStores> {
    let provider = GitProvider::new(repository);
    let mut factories = StoreFactories::empty();
    provider.register(&mut factories, "git").unwrap();
    Arc::new(
        factories
            .loader()
            .open(
                &StoreConfig::all("git"),
                StoreContext::new(provider.scope(), host),
            )
            .unwrap(),
    )
}
pub struct Fixture {
    _root: tempfile::TempDir,
    pub vault: PathBuf,
    pub home: PathBuf,
    pub temporary: PathBuf,
    pub cache: PathBuf,
    pub profile: Dir,
    pub stores: Arc<RepositoryStores>,
    pub metadata: MetadataStore,
    pub context: ContextV1,
    pub host: Arc<Host>,
    operation: String,
}
impl Fixture {
    pub async fn new() -> Self {
        let root = tempfile::tempdir().unwrap();
        let base = root.path().canonicalize().unwrap();
        let vault = base.join("Vault 笔记");
        let home = base.join("home");
        let temporary = base.join("temporary");
        let cache = base.join("privacy-cache");
        for path in [&vault, &home, &temporary, &cache] {
            std::fs::create_dir(path).unwrap();
        }
        jj(&vault, &["git", "init", "--no-colocate"]);
        std::fs::write(vault.join("note.md"), "committed\n").unwrap();
        jj(&vault, &["describe", "-m", "source"]);
        std::fs::write(vault.join("note.md"), "dirty\n").unwrap();
        let operation = jj(&vault, &["op", "log", "-T", "id ++ '\\n'", "--limit", "1"]);
        let profile_path = base.join("profile");
        let mut vaults = VaultManager::new(&profile_path).unwrap();
        let session = vaults
            .select(Some(vault.clone()), None)
            .unwrap()
            .unwrap()
            .session_id;
        let mut ai = VaultAdmissions::default();
        let plan = ai.prepare(&vaults, "main", &session).unwrap();
        let generation = ai
            .complete(&vaults, &plan)
            .unwrap()
            .generation()
            .to_string();
        let host = Arc::new(Host(Mutex::new(Authority {
            vaults,
            ai,
            generation: generation.clone(),
        })));
        let info = jj_store_jj::local_repository::inspect_workspace(&vault).unwrap();
        assert!(info.repository.is_none());
        let metadata = info.open_metadata().unwrap().carrier().clone();
        let selected = stores(LocalRepository::new(&vault, metadata.clone()), host.clone());
        let outcome = selected
            .thread()
            .unwrap()
            .execute(&StoreRequest::new(
                RequestId::new([7; 16]),
                jj_collab::ThreadCommandV1::Create {
                    thread_id: jj_collab::ThreadId::new([7; 16]),
                    title: "Notes capture".into(),
                    baseline: None,
                },
            ))
            .await
            .unwrap();
        let StoreOutcome::Committed(receipt) = outcome else {
            panic!("thread receipt")
        };
        let context=serde_json::from_value(serde_json::json!({"repository":receipt.repository,"thread":"07070707070707070707070707070707","binding":{"scope":"vault","worker":"worker","request":"open","target":"target","window":"main","admission":generation},"policy":TRANSCRIPT_POLICY})).unwrap();
        let selected = stores(
            LocalRepository::new(&vault, metadata.clone()).bound_to(receipt.repository),
            host.clone(),
        );
        let profile = Dir::open_ambient_dir(profile_path, ambient_authority()).unwrap();
        Self {
            _root: root,
            vault,
            home,
            temporary,
            cache,
            profile,
            stores: selected,
            metadata,
            context,
            host,
            operation,
        }
    }
    pub fn reopen(&self) -> Arc<RepositoryStores> {
        let info = jj_store_jj::local_repository::inspect_workspace(&self.vault).unwrap();
        let metadata = info.open_metadata().unwrap().carrier().clone();
        stores(
            LocalRepository::new(&self.vault, metadata).bound_to(self.context.repository),
            self.host.clone(),
        )
    }
    pub fn assert_source_unchanged(&self) {
        assert_eq!(
            std::fs::read(self.vault.join("note.md")).unwrap(),
            b"dirty\n"
        );
        assert_eq!(
            jj(
                &self.vault,
                &["op", "log", "-T", "id ++ '\\n'", "--limit", "1"]
            ),
            self.operation
        );
    }
}
fn jj(path: &Path, args: &[&str]) -> String {
    let mut command = Command::new(
        std::env::var_os("JJ_STORE_TEST_STOCK_JJ").unwrap_or_else(|| "/opt/homebrew/bin/jj".into()),
    );
    command.current_dir(path).args([
        "--no-pager",
        "--config",
        "user.name='Fixture'",
        "--config",
        "user.email='fixture@invalid'",
    ]);
    if args.first() == Some(&"op") {
        command.arg("--ignore-working-copy");
    }
    let output = command
        .args(args)
        .env("JJ_CONFIG", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8(output.stdout).unwrap()
}
