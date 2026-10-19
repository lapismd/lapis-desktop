use super::*;
#[test]
fn interrupted_install_never_replays_or_replaces_the_selected_client() {
    let directory = tempfile::tempdir().unwrap();
    let owner = Tooling::open(directory.path().into()).unwrap();
    let selected = RequestId::new([1; 16]);
    let pending = RequestId::new([2; 16]);
    owner
        .update(|state| {
            state.selected = Some(selected);
            state.requests.insert(
                pending,
                Outcome {
                    version: 1,
                    request_id: pending,
                    runtime_id: "codex".into(),
                    state: "installing".into(),
                    error: None,
                },
            );
            Ok(())
        })
        .unwrap();
    let reopened = Tooling::open(directory.path().into()).unwrap();
    assert_eq!(reopened.outcome(pending).unwrap().state, "interrupted");
    assert_eq!(read(&reopened.root).unwrap().selected, Some(selected));
    assert_eq!(
        selected_paths(directory.path()).unwrap()[0],
        paths::prefix(&reopened.root, selected).join("bin")
    );
    assert!(!paths::prefix(&reopened.root, pending).exists());
}
#[tokio::test]
async fn repeated_request_returns_the_original_receipt_without_starting_npm() {
    let directory = tempfile::tempdir().unwrap();
    let owner = Tooling::open(directory.path().into()).unwrap();
    let request = RequestId::new([3; 16]);
    owner
        .update(|state| {
            state.requests.insert(
                request,
                Outcome {
                    version: 1,
                    request_id: request,
                    runtime_id: "codex".into(),
                    state: "failed".into(),
                    error: Some("fixture".into()),
                },
            );
            Ok(())
        })
        .unwrap();
    assert_eq!(
        owner.install(request).await.unwrap().error.as_deref(),
        Some("fixture")
    );
    assert!(!owner.root.join("tooling").exists());
}
#[test]
fn invalid_client_journal_does_not_fall_back_to_unselected_staging() {
    let directory = tempfile::tempdir().unwrap();
    let root = directory.path().join("ai-clients");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("state.json"), "invalid").unwrap();
    assert!(Tooling::open(directory.path().into()).is_err());
    assert!(selected_paths(directory.path()).is_err());
}
