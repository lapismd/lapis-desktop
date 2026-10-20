use super::*;

#[test]
fn opencode_and_cursor_are_admitted_without_codex_and_keep_fixed_launch_policy() {
    let (temp, settings, home) = tests::fixture();
    let bin = temp.path().join("bin");
    std::fs::remove_file(bin.join("codex-acp")).unwrap();
    for command in ["opencode", "cursor-agent"] {
        std::fs::write(bin.join(command), "fixture, never executed").unwrap();
    }
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    files.prepare().unwrap();
    let ids: Vec<_> = files
        .targets()
        .into_iter()
        .map(|target| target.id)
        .collect();
    assert_eq!(ids, ["cursor", "opencode"]);
    assert!(files.launch("codex", temp.path()).unwrap().is_none());
    for target in ids {
        let launch = files.launch(&target, temp.path()).unwrap().unwrap();
        assert_eq!(launch.prepared.environment.0["JJ_ACP_RUNNER"], target);
        assert_eq!(launch.prepared.environment.0["JJ_ACP_CONTROL_VERSION"], "3");
        assert!(launch.prepared.arguments.is_empty());
        assert!(launch.resume.is_none());
        assert_eq!(launch.prepared.environment.0.len(), 6);
    }
}

#[test]
fn removing_one_adapter_does_not_disable_the_others() {
    let (temp, settings, home) = tests::fixture();
    let bin = temp.path().join("bin");
    std::fs::write(bin.join("opencode"), "fixture, never executed").unwrap();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    files.prepare().unwrap();
    assert!(files.contains("codex"));
    assert!(files.contains("opencode"));
    std::fs::remove_file(bin.join("opencode")).unwrap();
    files.prepare().unwrap();
    assert!(files.contains("codex"));
    assert!(!files.contains("opencode"));
    assert!(files.launch("opencode", temp.path()).unwrap().is_none());
}

#[test]
fn compute_launch_keeps_all_caches_managed_and_restricted_local_has_no_tool_launch() {
    let (temp, settings, home) = tests::fixture();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    let plan = files.compute_plan().unwrap();
    assert!(plan.directory.starts_with(temp.path().join("ai-compute")));
    for key in [
        "HOME",
        "HF_HOME",
        "HF_HUB_CACHE",
        "MESH_LLM_NATIVE_RUNTIME_CACHE_DIR",
    ] {
        assert!(
            std::path::Path::new(&plan.environment.0[key])
                .starts_with(temp.path().join("ai-compute"))
        );
    }
    files
        .providers()
        .unwrap()
        .save(lapis_desktop::ai::configuration::Save {
            request_id: uuid::Uuid::new_v4(),
            expected_revision: 0,
            configuration: lapis_desktop::ai::configuration::ProviderConfiguration {
                provider: "local".into(),
                ..Default::default()
            },
            secret: None,
            clear_secret: false,
        })
        .unwrap();
    files
        .prepare_with_compute(Some(BTreeMap::from([
            ("BUZZ_AGENT_PROVIDER".into(), "openai".into()),
            (
                "OPENAI_COMPAT_API_KEY".into(),
                "synthetic-inference-token".into(),
            ),
        ])))
        .unwrap();
    assert!(files.contains("local"));
    let launch = files
        .launch("local:restricted", temp.path())
        .unwrap()
        .unwrap();
    assert_eq!(launch.prepared.environment.0["BUZZ_AGENT_NO_HINTS"], "1");
    assert_eq!(launch.prepared.environment.0["JJ_ACP_RUNNER"], "local");
    assert!(!launch.prepared.environment.0.contains_key("JJ_ACP_TOOLS"));
    files.prepare().unwrap();
    assert!(
        !files.contains("local"),
        "Stopped compute cannot retain an old launch token"
    );
}

#[test]
fn invalid_provider_settings_do_not_disable_independent_installed_clients() {
    let (temp, settings, home) = tests::fixture();
    std::fs::create_dir(temp.path().join("ai-providers")).unwrap();
    std::fs::write(temp.path().join("ai-providers/settings.json"), b"malformed").unwrap();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    files.prepare().unwrap();
    assert!(files.contains("codex"));
    assert!(!files.contains("local"));
}
