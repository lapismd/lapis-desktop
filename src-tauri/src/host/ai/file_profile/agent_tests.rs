use super::*;
use lapis_desktop::ai::configuration::{ProviderConfiguration, Save};
#[test]
fn prepared_vault_snapshot_survives_another_vault_refresh_without_fallback() {
    let (temp, settings, home) = tests::fixture();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    for (vault, provider) in [("one", "local"), ("two", "paired")] {
        files
            .providers()
            .unwrap()
            .for_agent(vault, "same-id")
            .unwrap()
            .save(Save {
                request_id: uuid::Uuid::new_v4(),
                expected_revision: 0,
                configuration: ProviderConfiguration {
                    provider: provider.into(),
                    ..Default::default()
                },
                secret: None,
                clear_secret: false,
            })
            .unwrap();
    }
    let environments = || {
        BTreeMap::from([
            (
                "local".into(),
                Some(BTreeMap::from([(
                    "BUZZ_AGENT_MODEL".into(),
                    "one-model".into(),
                )])),
            ),
            (
                "paired".into(),
                Some(BTreeMap::from([(
                    "BUZZ_AGENT_MODEL".into(),
                    "two-model".into(),
                )])),
            ),
        ])
    };
    let retained = files
        .snapshot(Some("one"), environments())
        .unwrap()
        .unwrap();
    files.prepare_profiles(Some("two"), environments()).unwrap();
    let later = files
        .launch("local:profile:same-id", temp.path())
        .unwrap()
        .unwrap();
    assert_eq!(
        later.prepared.environment.0["BUZZ_AGENT_MODEL"],
        "two-model"
    );
    let earlier = retained
        .launch("local:profile:same-id", temp.path())
        .unwrap()
        .unwrap();
    assert_eq!(
        earlier.prepared.environment.0["BUZZ_AGENT_MODEL"],
        "one-model"
    );
    assert!(
        retained
            .launch("local:profile:unknown", temp.path())
            .unwrap()
            .is_none()
    );
    assert!(
        retained
            .targets()
            .iter()
            .any(|target| target.id == "local:profile:same-id")
    );
    assert_eq!(earlier.directory, temp.path());
    assert_eq!(earlier.prepared.directory, temp.path());
    assert!(earlier.resume.is_none());
}

#[test]
fn scoped_profiles_launch_exact_config_and_unknown_profiles_never_fall_back() {
    let (temp, settings, home) = tests::fixture();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    let base = files.providers().unwrap();
    for (vault, id, provider) in [
        ("one", "a", "local"),
        ("one", "b", "paired"),
        ("two", "foreign", "local"),
    ] {
        base.for_agent(vault, id)
            .unwrap()
            .save(Save {
                request_id: uuid::Uuid::new_v4(),
                expected_revision: 0,
                configuration: ProviderConfiguration {
                    provider: provider.into(),
                    ..Default::default()
                },
                secret: None,
                clear_secret: false,
            })
            .unwrap();
    }
    let environments = || {
        BTreeMap::from([
            (
                "local".into(),
                Some(BTreeMap::from([(
                    "BUZZ_AGENT_MODEL".into(),
                    "local-model".into(),
                )])),
            ),
            (
                "paired".into(),
                Some(BTreeMap::from([(
                    "BUZZ_AGENT_MODEL".into(),
                    "paired-model".into(),
                )])),
            ),
        ])
    };
    files.prepare_profiles(Some("one"), environments()).unwrap();
    assert!(files.contains("codex"));
    assert!(!files.contains("local"));
    for (id, model) in [("a", "local-model"), ("b", "paired-model")] {
        let launch = files
            .launch(&format!("local:profile:{id}"), temp.path())
            .unwrap()
            .unwrap();
        assert_eq!(launch.prepared.environment.0["BUZZ_AGENT_MODEL"], model);
        assert_eq!(launch.prepared.environment.0["JJ_ACP_RUNNER"], "local");
    }
    for target in [
        "local:profile:foreign",
        "local:profile:missing",
        "local:profile:../a",
    ] {
        assert!(files.launch(target, temp.path()).unwrap().is_none());
    }
    files.prepare_profiles(Some("two"), environments()).unwrap();
    assert!(!files.contains("local:profile:a"));
    assert!(files.contains("local:profile:foreign"));
    files
        .prepare_profiles(Some("one"), BTreeMap::new())
        .unwrap();
    assert!(!files.contains("local:profile:a"));
    assert!(files.contains("codex"));
}
