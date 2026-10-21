use super::*;
use std::collections::BTreeMap;
use uuid::Uuid;
#[derive(Default)]
struct Keys(Mutex<BTreeMap<String, String>>);
impl Secrets for Keys {
    fn supported(&self) -> bool {
        true
    }
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>> {
        self.0
            .lock()
            .unwrap()
            .get(id)
            .cloned()
            .map(Zeroizing::new)
            .ok_or_else(unavailable)
    }
    fn set(&self, id: &str, value: &str) -> io::Result<()> {
        self.0.lock().unwrap().insert(id.into(), value.into());
        Ok(())
    }
    fn remove(&self, id: &str) -> io::Result<()> {
        self.0.lock().unwrap().remove(id);
        Ok(())
    }
}
fn command(request: Uuid, revision: u64, secret: Option<&str>) -> Save {
    Save {
        request_id: request,
        expected_revision: revision,
        configuration: ProviderConfiguration {
            provider: "openai-api".into(),
            endpoint: None,
            model: Some("sample-model".into()),
        },
        secret: secret.map(str::to_owned),
        clear_secret: false,
    }
}
#[test]
fn provider_credentials_are_write_only_and_exact_retries_never_advance_settings_twice() {
    let directory = tempfile::tempdir().unwrap();
    let keys = Arc::new(Keys::default());
    let store = ProviderStore::with_secrets(directory.path().into(), keys.clone());
    let id = Uuid::new_v4();
    let saved = store
        .save(command(id, 0, Some("private-provider-test-key")))
        .unwrap();
    assert_eq!(saved.revision, 1);
    assert!(saved.credential_available);
    assert_eq!(
        store
            .save(command(id, 0, Some("private-provider-test-key")))
            .unwrap()
            .revision,
        1
    );
    assert!(
        store
            .save(command(id, 0, Some("changed-provider-test-key")))
            .is_err()
    );
    assert!(store.save(command(Uuid::new_v4(), 0, None)).is_err());
    let encoded = serde_json::to_string(&store.status().unwrap()).unwrap();
    let disk = fs::read_to_string(directory.path().join("ai-providers/settings.json")).unwrap();
    assert!(!encoded.contains("private-provider-test-key"));
    assert!(!disk.contains("private-provider-test-key"));
    assert_eq!(
        store.environment().unwrap()["OPENAI_COMPAT_API_KEY"],
        "private-provider-test-key"
    );
    let mut clear = command(Uuid::new_v4(), 1, None);
    clear.clear_secret = true;
    assert!(!store.save(clear).unwrap().credential_available);
    assert!(store.environment().is_err());
    assert!(keys.0.lock().unwrap().is_empty());
}
#[test]
fn missing_credentials_and_invalid_endpoints_cannot_start_a_local_agent() {
    let directory = tempfile::tempdir().unwrap();
    let store = ProviderStore::with_secrets(directory.path().into(), Arc::new(Keys::default()));
    assert!(store.environment().is_err());
    for endpoint in [
        "https://user:secret@example.com/v1",
        "http://example.com/v1",
        "https://example.com/v1?key=secret",
    ] {
        let mut save = command(Uuid::new_v4(), 0, Some("private-provider-test-key"));
        save.configuration.endpoint = Some(endpoint.into());
        assert!(store.save(save).is_err());
    }
    assert_eq!(store.status().unwrap().revision, 0);
    assert!(
        store
            .status()
            .unwrap()
            .providers
            .iter()
            .all(|provider| provider.id != "chatgpt-plan")
    );
}

#[test]
fn cloud_provider_requires_a_model_before_saving_credentials() {
    let directory = tempfile::tempdir().unwrap();
    let keys = Arc::new(Keys::default());
    let store = ProviderStore::with_secrets(directory.path().into(), keys.clone());
    let mut save = command(Uuid::new_v4(), 0, Some("private-provider-test-key"));
    save.configuration.model = None;
    let error = store.save(save).err().expect("missing model must reject");
    assert_eq!(error.kind(), io::ErrorKind::InvalidInput);
    assert!(error.to_string().contains("default model"));
    assert_eq!(store.status().unwrap().revision, 0);
    assert!(keys.0.lock().unwrap().is_empty());
    assert!(!directory.path().join("ai-providers/settings.json").exists());

    let mut save = command(Uuid::new_v4(), 0, Some("private-provider-test-key"));
    save.configuration.provider = "openai-compat".into();
    save.configuration.endpoint = Some("https://provider.example/v1".into());
    save.configuration.model = Some("qwen3.8-max".into());
    store.save(save).unwrap();
    assert_eq!(
        store.environment().unwrap()["BUZZ_AGENT_MODEL"],
        "qwen3.8-max"
    );
}

#[test]
fn managed_compute_does_not_require_a_provider_model() {
    for provider in ["local", "paired"] {
        let directory = tempfile::tempdir().unwrap();
        let store = ProviderStore::with_secrets(directory.path().into(), Arc::new(Keys::default()));
        let mut save = command(Uuid::new_v4(), 0, None);
        save.configuration.provider = provider.into();
        save.configuration.model = None;
        assert_eq!(store.save(save).unwrap().revision, 1);
        assert!(store.compute_selected().unwrap());
    }
}

#[test]
fn legacy_missing_model_blocks_launch_but_retains_receipt_replay_and_key_removal() {
    let directory = tempfile::tempdir().unwrap();
    let keys = Arc::new(Keys::default());
    let store = ProviderStore::with_secrets(directory.path().into(), keys.clone());
    let request = Uuid::new_v4();
    let mut legacy = command(request, 0, None);
    legacy.configuration.model = None;
    let mut digest = Sha256::new();
    digest.update(serde_json::to_vec(&legacy.configuration).unwrap());
    digest.update(0u64.to_be_bytes());
    digest.update([0, 0]);
    keys.set("old-key", "private-provider-test-key").unwrap();
    store
        .persist(&State {
            revision: 1,
            configuration: legacy.configuration.clone(),
            credentials: BTreeMap::from([("openai-api".into(), "old-key".into())]),
            last_request: Some(request),
            last_digest: format!("{:x}", digest.finalize()),
            ..State::default()
        })
        .unwrap();
    let error = store
        .environment()
        .err()
        .expect("missing model must block launch");
    assert!(error.to_string().contains("default model"));
    assert_eq!(store.save(legacy).unwrap().revision, 1);

    let mut clear = command(Uuid::new_v4(), 1, None);
    clear.configuration.model = None;
    clear.clear_secret = true;
    let saved = store.save(clear).unwrap();
    assert_eq!(saved.revision, 2);
    assert!(!saved.credential_available);
    assert!(keys.0.lock().unwrap().is_empty());
}
