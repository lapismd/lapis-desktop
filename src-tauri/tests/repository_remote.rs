use jj_vault::{Binding, GitCredentials, RemoteTarget};
use lapis_desktop::repository::{forges::RemoteAccess, remote};
use std::fs;
fn setup() -> (tempfile::TempDir, Binding) {
    let temp = tempfile::tempdir().unwrap();
    let base = temp.path().canonicalize().unwrap();
    let binding = Binding {
        vault_id: "vault".into(),
        root: base.join("notes"),
        state: base.join("private/history"),
    };
    fs::create_dir(&binding.root).unwrap();
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            jj_store_jj::vault_workspace::Session::open(binding.clone())
                .await
                .unwrap();
        });
    (temp, binding)
}
fn resolved() -> RemoteAccess {
    RemoteAccess {
        account: "account-handle".into(),
        project: "owner/notes".into(),
        target: RemoteTarget {
            url: "https://github.com/owner/notes.git".into(),
            branch: "main".into(),
        },
        can_push: true,
        credentials: GitCredentials::token("private-synthetic-token").unwrap(),
    }
}
#[test]
fn connection_configuration_has_exact_revisions_and_no_credential_or_in_vault_state() {
    let (_temp, binding) = setup();
    assert_eq!(remote::read(&binding).unwrap().revision, 0);
    let first = remote::configure(&binding, 0, resolved()).unwrap();
    assert_eq!(first.revision, 1);
    assert!(remote::configure(&binding, 0, resolved()).is_err());
    let text = fs::read_to_string(binding.state.join("remote-backup.json")).unwrap();
    assert!(!text.contains("private-synthetic-token"));
    assert!(!text.contains("access_token"));
    assert_eq!(
        remote::read(&binding)
            .unwrap()
            .configuration
            .unwrap()
            .project,
        "owner/notes"
    );
    let removed = remote::disconnect(&binding, 1).unwrap();
    assert_eq!(removed.revision, 2);
    assert!(removed.configuration.is_none());
    assert!(remote::observed(&binding, 1, None, true).is_err());
    assert_eq!(fs::read_dir(&binding.root).unwrap().count(), 0);
}
#[test]
fn pending_publication_cannot_be_rebound_and_credential_urls_fail_closed() {
    let (_temp, binding) = setup();
    remote::configure(&binding, 0, resolved()).unwrap();
    fs::create_dir(binding.state.join("remote-push-receipts")).unwrap();
    fs::write(
        binding.state.join("remote-push-receipts/active.json"),
        "original-intent",
    )
    .unwrap();
    assert!(remote::disconnect(&binding, 1).is_err());
    assert!(remote::configure(&binding, 1, resolved()).is_err());
    let path = binding.state.join("remote-backup.json");
    let mut saved: serde_json::Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    saved["state"]["configuration"]["target"]["url"] =
        serde_json::json!("https://secret@github.com/owner/notes.git");
    fs::write(path, serde_json::to_vec(&saved).unwrap()).unwrap();
    assert!(remote::read(&binding).is_err());
}
