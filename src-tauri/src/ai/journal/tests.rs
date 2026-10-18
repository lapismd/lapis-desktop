use super::*;
use cap_std::ambient_authority;

#[test]
fn journal_release_does_not_depend_on_an_incidental_kernel_descriptor_duplicate() {
    let root = tempfile::tempdir().unwrap();
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let context: ContextV1 = serde_json::from_value(serde_json::json!({
        "repository":"01010101010101010101010101010101",
        "thread":"02020202020202020202020202020202",
        "binding":{"scope":"vault","worker":"worker","request":"open","target":"target","window":"main","admission":"generation"},
        "policy":"fixture/v1"
    })).unwrap();
    let provider = PublicationScope {
        repository: Some(context.repository),
        authority: "git-companion:unit-fixture".into(),
    };
    let open = || ProfileJournal::open(&profile, context.clone(), &provider, Arc::new(|| Ok(())));
    let journal = open().unwrap();
    let duplicate = journal.lease.try_clone().unwrap();
    assert!(open().is_err());
    drop(journal);
    let replacement = open().expect("the journal's logical owner must release its lease");
    assert!(duplicate.metadata().is_ok());
    drop(duplicate);
    assert!(open().is_err());
    drop(replacement);
    assert!(open().is_ok());
}
