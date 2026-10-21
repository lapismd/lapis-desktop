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
fn save(id: Uuid, model: &str, key: &str) -> Save {
    Save {
        request_id: id,
        expected_revision: 0,
        configuration: ProviderConfiguration {
            provider: "openai-compat".into(),
            endpoint: Some(format!("https://{model}.example/v1")),
            model: Some(model.into()),
        },
        secret: Some(key.into()),
        clear_secret: false,
    }
}
#[test]
fn agent_configs_and_credentials_are_isolated_across_profiles_and_vaults() {
    let dir = tempfile::tempdir().unwrap();
    let keys = Arc::new(Keys::default());
    let base = ProviderStore::with_secrets(dir.path().into(), keys.clone());
    let a = base.for_agent("vault-one", "research").unwrap();
    let b = base.for_agent("vault-one", "writing").unwrap();
    let other = base.for_agent("vault-two", "research").unwrap();
    let request = Uuid::new_v4();
    for (store, model, key) in [
        (&a, "qwen", "synthetic-a"),
        (&b, "small", "synthetic-b"),
        (&other, "other", "synthetic-c"),
    ] {
        assert_eq!(store.save(save(request, model, key)).unwrap().revision, 1);
        assert_eq!(store.save(save(request, model, key)).unwrap().revision, 1);
        assert_eq!(store.environment().unwrap()["BUZZ_AGENT_MODEL"], model);
        assert_eq!(store.environment().unwrap()["OPENAI_COMPAT_API_KEY"], key);
        assert!(
            !serde_json::to_string(&store.status().unwrap())
                .unwrap()
                .contains(key)
        );
    }
    assert_eq!(keys.0.lock().unwrap().len(), 3);
    assert_eq!(base.status().unwrap().revision, 0);
    assert_eq!(
        base.agent_ids("vault-one").unwrap(),
        ["research", "writing"]
    );
    let mut clear = save(Uuid::new_v4(), "qwen", "unused");
    clear.expected_revision = 1;
    clear.secret = None;
    clear.clear_secret = true;
    a.save(clear).unwrap();
    assert!(a.environment().is_err());
    assert_eq!(
        b.environment().unwrap()["OPENAI_COMPAT_API_KEY"],
        "synthetic-b"
    );
    assert_eq!(
        other.environment().unwrap()["OPENAI_COMPAT_API_KEY"],
        "synthetic-c"
    );
}
#[test]
fn profile_paths_reject_traversal_and_symlinked_ancestors_without_writing() {
    let dir = tempfile::tempdir().unwrap();
    let base = ProviderStore::with_secrets(dir.path().into(), Arc::new(Keys::default()));
    for id in ["", "../outside", "a/b", "a:tools:x"] {
        assert!(base.for_agent("vault", id).is_err());
        assert!(base.for_agent(id, "profile").is_err());
    }
    let outside = tempfile::tempdir().unwrap();
    fs::create_dir_all(&base.root).unwrap();
    std::os::unix::fs::symlink(outside.path(), base.root.join("agents")).unwrap();
    assert!(base.for_agent("vault", "profile").is_err());
    assert!(base.agent_ids("vault").is_err());
    assert_eq!(fs::read_dir(outside.path()).unwrap().count(), 0);
}
