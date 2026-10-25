use super::DesktopAiPolicy;
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::{
    database::NativeDatabases, vault::VaultManager, vault::admission::VaultAdmissions,
    watch::WatchRegistry,
};
use std::sync::{Arc, Mutex};
use tauri_plugin_lapis_ai::{AcpHost, Config, HostContext, HostPolicy};
use tempfile::{TempDir, tempdir};

struct Fixture {
    _profile: TempDir,
    root: TempDir,
    host: NativeHost,
    policy: DesktopAiPolicy,
    workers: Arc<AcpHost>,
    session: String,
}
fn fixture() -> Fixture {
    let profile = tempdir().unwrap();
    let root = tempdir().unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let session = vaults
        .select(Some(root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let host = NativeHost(Arc::new(Mutex::new(NativeServices {
        core_vaults: lapis_desktop::vault::services::VaultServices::default(),
        imports: VaultAdmissions::default(),
        ai: VaultAdmissions::default(),
        repository: lapis_desktop::repository::RepositoryAdmissions::default(),
        vaults,
        databases: NativeDatabases::default(),
        watches: WatchRegistry::default(),
        fs_gate: Arc::new(Mutex::new(())),
    })));
    let policy = DesktopAiPolicy::default();
    let workers = Arc::new(AcpHost::new(Arc::new(policy.clone()), Config::default()).unwrap());
    let backends = Arc::new(crate::host::ai::owner::NativeAiOwner::default());
    policy.initialize(host.clone(), &workers, backends).unwrap();
    Fixture {
        _profile: profile,
        root,
        host,
        policy,
        workers,
        session,
    }
}
fn caller() -> HostContext {
    HostContext {
        window: "main".into(),
        url: "tauri://localhost/index.html".into(),
    }
}
fn activate(fixture: &Fixture) -> String {
    let mut services = fixture.host.0.lock().unwrap();
    let NativeServices { ai, vaults, .. } = &mut *services;
    let plan = ai.prepare(vaults, "main", &fixture.session).unwrap();
    ai.complete(vaults, &plan).unwrap().generation().to_owned()
}

#[test]
fn native_ai_policy_is_lazy_and_remains_without_execution_targets() {
    let fixture = fixture();
    assert!(fixture.policy.authorize(&caller()).is_err());
    let generation = activate(&fixture);
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), generation);
    assert!(fixture.workers.targets(&caller()).unwrap().is_empty());
    assert!(fixture.workers.list(&caller()).unwrap().is_empty());
    for resume in [None, Some("old-controller-session")] {
        assert_eq!(
            fixture
                .policy
                .resolve(&caller(), "arbitrary-program", resume)
                .err()
                .unwrap()
                .0,
            "agent_not_admitted"
        );
        let error = tauri::async_runtime::block_on(fixture.workers.open(
            &caller(),
            "no-program-probe",
            "arbitrary-program",
            resume.map(str::to_owned),
        ))
        .err()
        .unwrap();
        assert_eq!(error.0, "agent_not_admitted");
    }
    assert!(fixture.workers.list(&caller()).unwrap().is_empty());
}

#[test]
fn native_ai_policy_rejects_other_windows_and_remote_or_credential_origins() {
    let fixture = fixture();
    let generation = activate(&fixture);
    let mut context = caller();
    context.window = "other".into();
    assert!(fixture.policy.authorize(&context).is_err());
    for url in [
        "https://example.com",
        "file:///etc/passwd",
        "tauri://user@localhost",
        "http://127.0.0.1:1432/",
    ] {
        context = caller();
        context.url = url.into();
        assert!(fixture.policy.authorize(&context).is_err());
    }
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), generation);
}

#[test]
fn revoked_native_root_cannot_recover_an_old_generation() {
    let mut fixture = fixture();
    let old = activate(&fixture);
    {
        let mut services = fixture.host.0.lock().unwrap();
        services.vaults.close(&fixture.session).unwrap();
    }
    assert!(fixture.policy.authorize(&caller()).is_err());
    fixture.session = fixture
        .host
        .0
        .lock()
        .unwrap()
        .vaults
        .select(Some(fixture.root.path().into()), None)
        .unwrap()
        .unwrap()
        .session_id;
    let new = activate(&fixture);
    assert_ne!(old, new);
    tauri::async_runtime::block_on(fixture.workers.revoke("main", Some(&old))).unwrap();
    assert_eq!(fixture.policy.authorize(&caller()).unwrap(), new);
}

#[test]
fn native_ai_policy_owner_cannot_be_rebound_to_another_host() {
    let first = fixture();
    let second = fixture();
    let generation = activate(&first);
    assert!(
        first
            .policy
            .initialize(
                second.host,
                &first.workers,
                second.policy.0.backends.get().unwrap().clone()
            )
            .is_err()
    );
    assert_eq!(first.policy.authorize(&caller()).unwrap(), generation);
}

#[test]
fn local_processing_requires_current_admission_and_an_explicit_target() {
    let fixture = fixture();
    let generation = activate(&fixture);
    let mut binding = tauri_plugin_lapis_ai::SessionBinding {
        session_id: "owned-worker".into(),
        request_id: "owned-open".into(),
        target_id: "future-admitted-target".into(),
        admission: generation,
    };
    assert_eq!(
        fixture
            .policy
            .processor(&caller(), &binding)
            .err()
            .map(|error| error.0),
        Some("agent_not_admitted")
    );
    binding.admission = "stale-generation".into();
    assert_eq!(
        fixture
            .policy
            .processor(&caller(), &binding)
            .err()
            .map(|error| error.0),
        Some("admission_revoked")
    );
    fixture.host.0.lock().unwrap().ai.leave("main", false);
    assert!(fixture.policy.processor(&caller(), &binding).is_err());
    assert!(fixture.workers.list(&caller()).is_err());
}

#[test]
fn codex_tool_alias_is_native_scoped_single_claim_and_never_constructs_jj_capture() {
    let fixture = fixture();
    let (_runtime, settings, home) = super::super::file_profile::tests::fixture();
    fixture
        .policy
        .configure_file_profile(settings, home)
        .unwrap();
    fixture.policy.prepare_file_profile().unwrap();
    let generation = activate(&fixture);
    let request = uuid::Uuid::new_v4();
    let owner = lapis_desktop::ai::tools::Owner {
        window: "main".into(),
        session: fixture.session.clone(),
        generation: generation.clone(),
    };
    let backends = fixture.policy.0.backends.get().unwrap();
    tauri::async_runtime::block_on(backends.tools.open(
        request,
        owner,
        vec![lapis_desktop::ai::tools::ToolSpec {
            name: "notes.read".into(),
            description: "Read".into(),
            input_schema: serde_json::json!({"type":"object"}),
        }],
        Arc::new(|| Ok(())),
        Arc::new(|_| Ok(())),
    ))
    .unwrap();
    assert_eq!(
        fixture
            .policy
            .targets(&caller())
            .unwrap()
            .iter()
            .map(|t| t.id.as_str())
            .collect::<Vec<_>>(),
        vec!["codex"]
    );
    let alias = format!("codex:tools:{request}");
    assert!(
        fixture
            .policy
            .resolve(&caller(), &alias, Some("resume"))
            .is_err()
    );
    let launch = fixture.policy.resolve(&caller(), &alias, None).unwrap();
    assert_eq!(
        launch.directory,
        fixture.root.path().canonicalize().unwrap()
    );
    assert!(launch.prepared.arguments.is_empty());
    assert!(
        launch
            .prepared
            .environment
            .0
            .contains_key("LAPIS_NOTES_TOOL_SOCKET")
    );
    assert_eq!(
        launch.prepared.environment.0["LAPIS_NOTES_TOOL_CREDENTIAL"].len(),
        64
    );
    let config = std::fs::read_to_string(&launch.prepared.environment.0["JJ_ACP_TOOLS"]).unwrap();
    assert!(!config.contains(&launch.prepared.environment.0["LAPIS_NOTES_TOOL_CREDENTIAL"]));
    let binding = tauri_plugin_lapis_ai::SessionBinding {
        session_id: "worker".into(),
        request_id: "open".into(),
        target_id: alias.clone(),
        admission: generation,
    };
    assert!(
        fixture
            .policy
            .processor(&caller(), &binding)
            .unwrap()
            .is_none()
    );
    // Configuration refresh only changes new admission, not the owned worker.
    std::fs::remove_file(_runtime.path().join("bin/codex-acp")).unwrap();
    fixture.policy.prepare_file_profile().unwrap();
    assert!(
        fixture
            .policy
            .authorize_processing(&caller(), &binding)
            .is_ok()
    );
    assert!(fixture.policy.resolve(&caller(), &alias, None).is_err());
    assert!(
        fixture
            .policy
            .resolve(&caller(), "codex:tools:invalid", None)
            .is_err()
    );
    tauri::async_runtime::block_on(backends.tools.close(request, "main", &fixture.session))
        .unwrap();
    assert!(fixture.policy.processor(&caller(), &binding).is_err());
}
#[test]
fn core_profile_denies_legacy_acp_execution_for_the_same_admitted_vault() {
    let fixture = fixture();
    activate(&fixture);
    fixture
        .policy
        .select_turn_owner(crate::host::ai::turns::TurnOwner::Core)
        .unwrap();
    assert!(fixture.policy.authorize(&caller()).is_err());
    assert!(fixture.policy.targets(&caller()).is_err());
    assert!(fixture.policy.resolve(&caller(), "codex", None).is_err());
}
