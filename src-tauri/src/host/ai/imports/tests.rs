use super::*;
use lapis_desktop::{
    database::NativeDatabases,
    vault::{VaultManager, admission::VaultAdmissions},
    watch::WatchRegistry,
};
struct Fixture {
    _root: tempfile::TempDir,
    host: NativeHost,
    imports: Arc<NativeImports>,
    session: String,
}
impl Fixture {
    fn new() -> Self {
        let root = tempfile::tempdir().unwrap();
        let vault = root.path().join("vault");
        std::fs::create_dir(&vault).unwrap();
        let mut vaults = VaultManager::new(&root.path().join("profile")).unwrap();
        let session = vaults
            .select(Some(vault), None)
            .unwrap()
            .unwrap()
            .session_id;
        let host = NativeHost(Arc::new(Mutex::new(NativeServices {
            imports: VaultAdmissions::default(),
            ai: VaultAdmissions::default(),
            repository: Default::default(),
            vaults,
            databases: NativeDatabases::new(root.path().join("db")),
            watches: WatchRegistry::default(),
            fs_gate: Arc::new(Mutex::new(())),
        })));
        let imports = Arc::new(NativeImports {
            home: root.path().into(),
            owners: Mutex::new(HashMap::new()),
            destroyed: Mutex::new(HashSet::new()),
            transitions: Arc::new(tokio::sync::Mutex::new(())),
        });
        Self {
            _root: root,
            host,
            imports,
            session,
        }
    }
    fn lease(&self) -> VaultLease {
        let mut services = self.host.0.lock().unwrap();
        let NativeServices {
            imports, vaults, ..
        } = &mut *services;
        let plan = imports.prepare(vaults, "main", &self.session).unwrap();
        imports.complete(vaults, &plan).unwrap()
    }
    fn open(&self) -> Uuid {
        self.imports.open(&self.host, "main", self.lease()).unwrap()
    }
}
#[tokio::test]
async fn native_import_admission_is_independent_of_execution_and_old_handles_cannot_release_replacements()
 {
    let f = Fixture::new();
    let original = f.open();
    {
        let mut services = f.host.0.lock().unwrap();
        let NativeServices { ai, vaults, .. } = &mut *services;
        assert!(ai.authorize(vaults, "main").is_err());
    }
    let scope = f.imports.scope("main", original).unwrap();
    scope.check().unwrap();
    assert!(f.imports.scope("other", original).is_err());
    f.imports.drain("main", Some(original)).await.unwrap();
    let replacement = f.open();
    assert_ne!(original, replacement);
    f.imports.drain("main", Some(original)).await.unwrap();
    f.imports
        .scope("main", replacement)
        .unwrap()
        .check()
        .unwrap();
    assert!(scope.check().is_err());
}
#[tokio::test]
async fn vault_closure_and_disable_fence_source_reads_without_provider_ownership() {
    let f = Fixture::new();
    let handle = f.open();
    let scope = f.imports.scope("main", handle).unwrap();
    let work = scope.begin(scope.prepare().unwrap()).unwrap();
    f.host
        .0
        .lock()
        .unwrap()
        .imports
        .begin_close_vault(&f.session);
    assert!(work.check().is_err());
    f.imports.fence("main", None).unwrap();
    assert!(scope.prepare().is_err());
    drop(work);
    f.imports.drain("main", None).await.unwrap();
    assert!(f.imports.scope("main", handle).is_err());
}
#[tokio::test]
async fn physical_replacement_and_destroyed_window_deny_late_source_work() {
    let f = Fixture::new();
    let handle = f.open();
    let scope = f.imports.scope("main", handle).unwrap();
    let vault = f._root.path().join("vault");
    std::fs::rename(&vault, f._root.path().join("old-vault")).unwrap();
    std::fs::create_dir(&vault).unwrap();
    assert!(scope.check().is_err());
    f.imports.drain("main", None).await.unwrap();
    f.imports.destroyed.lock().unwrap().insert("main".into());
    assert!(f.imports.check_window("main").is_err());
    assert!(f.imports.scope("main", handle).is_err());
}
