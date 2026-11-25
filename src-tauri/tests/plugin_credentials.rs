#![cfg(target_os = "macos")]

use lapis_app_core::credentials::{ScopedCredentialStore, SecretBytes, SecretName};
use lapis_desktop::credentials::plugin_scope;
use std::sync::Arc;

struct Cleanup(Arc<dyn ScopedCredentialStore>, SecretName);

impl Drop for Cleanup {
    fn drop(&mut self) {
        let _ = self.0.delete(&self.1);
    }
}

#[test]
fn macos_plugin_scopes_persist_and_keep_identical_names_isolated() {
    let profile = tempfile::tempdir().unwrap();
    let root = profile.path().canonicalize().unwrap();
    let name = SecretName::new("fixture-token").unwrap();
    let first_id = SecretName::new("fixture-one").unwrap();
    let second_id = SecretName::new("fixture-two").unwrap();
    let first = Cleanup(plugin_scope(&root, &first_id).unwrap(), name.clone());
    let second = Cleanup(plugin_scope(&root, &second_id).unwrap(), name.clone());
    for (id, value) in [(&first_id, b"one"), (&second_id, b"two")] {
        let store = plugin_scope(&root, id).unwrap();
        assert!(store.get(&name).unwrap().is_none());
        store
            .set(&name, &SecretBytes::new(value.to_vec()).unwrap())
            .unwrap();
    }
    assert_eq!(first.0.get(&name).unwrap().unwrap().expose_secret(), b"one");
    assert_eq!(
        second.0.get(&name).unwrap().unwrap().expose_secret(),
        b"two"
    );
    first.0.delete(&name).unwrap();
    assert!(first.0.get(&name).unwrap().is_none());
    assert_eq!(
        second.0.get(&name).unwrap().unwrap().expose_secret(),
        b"two"
    );
}
