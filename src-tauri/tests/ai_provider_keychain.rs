#![cfg(target_os = "macos")]
//! Uses only a temporary profile and synthetic Keychain entry, never user keys.
use lapis_desktop::ai::configuration::{
    ProviderConfiguration, ProviderStore, Save, Secrets, device_secrets,
};
use std::sync::Arc;
use uuid::Uuid;
struct Cleanup {
    keys: Arc<dyn Secrets>,
    id: String,
}
impl Drop for Cleanup {
    fn drop(&mut self) {
        let _ = self.keys.remove(&self.id);
    }
}
#[test]
fn native_keychain_roundtrip_is_write_only_and_removal_retires_the_exact_entry() {
    let root = tempfile::tempdir().unwrap();
    let keys = device_secrets(root.path());
    let id = Uuid::new_v4();
    let _cleanup = Cleanup {
        keys: keys.clone(),
        id: id.to_string(),
    };
    let store = ProviderStore::open(root.path().into());
    let secret = format!("synthetic-keychain-test-{}", Uuid::new_v4());
    let saved = store
        .save(Save {
            request_id: id,
            expected_revision: 0,
            configuration: ProviderConfiguration {
                provider: "openai-api".into(),
                endpoint: None,
                model: Some("synthetic-model".into()),
            },
            secret: Some(secret.clone()),
            clear_secret: false,
        })
        .unwrap();
    assert!(saved.credential_available);
    assert_eq!(
        store.environment().unwrap()["OPENAI_COMPAT_API_KEY"],
        secret
    );
    assert!(!serde_json::to_string(&saved).unwrap().contains(&secret));
    assert!(
        !std::fs::read_to_string(root.path().join("ai-providers/settings.json"))
            .unwrap()
            .contains(&secret)
    );
    store
        .save(Save {
            request_id: Uuid::new_v4(),
            expected_revision: 1,
            configuration: saved.configuration,
            secret: None,
            clear_secret: true,
        })
        .unwrap();
    assert!(keys.get(&id.to_string()).is_err());
    assert!(!store.status().unwrap().credential_available);
}
