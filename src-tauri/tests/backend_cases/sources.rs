use super::*;
use jj_store_model::RequestId;
use lapis_desktop::ai::backend::Backend;
#[test]
fn jj_selection_and_owner_are_read_only_and_reject_replaced_source_witnesses() {
    let f = Fixture::new();
    let p = f.open();
    assert!(p.select(RequestId::new([1; 16]), 0, Backend::Jj).is_err());
    assert_eq!(p.read().unwrap().backend, Backend::VaultFiles);
    jj(&f.vault, &["git", "init", "--no-colocate"]);
    std::fs::write(f.vault.join("note.md"), b"dirty\n").unwrap();
    let before = jj(&f.vault, &["op", "log", "-T", "id", "--limit", "1"]);
    let info = jj_store_jj::local_repository::inspect_workspace(&f.vault).unwrap();
    assert!(info.repository.is_none());
    let receipt = p.select(RequestId::new([2; 16]), 0, Backend::Jj).unwrap();
    let owner = p.open_scope().unwrap();
    let call = owner.begin().unwrap();
    assert_eq!(owner.selection(), &receipt.selection);
    assert!(call.repository_metadata().unwrap().is_some());
    assert!(
        jj_store_jj::local_repository::inspect_workspace(&f.vault)
            .unwrap()
            .repository
            .is_none()
    );
    assert_eq!(std::fs::read(f.vault.join("note.md")).unwrap(), b"dirty\n");
    assert_eq!(
        jj(&f.vault, &["op", "log", "-T", "id", "--limit", "1"]),
        before
    );
    let path = info.metadata.join("store/git_target");
    let original = std::fs::read(&path).unwrap();
    std::fs::write(&path, b"changed\n").unwrap();
    assert!(call.check().is_err());
    assert!(owner.begin().is_err());
    drop(call);
    run(owner.drain()).unwrap();
    drop(owner);
    assert_eq!(p.read().unwrap().backend, Backend::Jj);
    assert!(p.open_scope().is_err());
    assert_eq!(p.status(receipt.request_id).unwrap(), Some(receipt));
    std::fs::write(path, original).unwrap();
    assert!(p.open_scope().is_ok());
}
