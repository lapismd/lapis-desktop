use super::*;
use jj_store_conversations::capture::CaptureError;
use std::sync::atomic::{AtomicUsize, Ordering};

#[test]
fn exact_monotonic_candidates_preparation_and_receipts_survive_reopen() {
    let root = tempfile::tempdir().unwrap();
    let journal = open(root.path());
    let c = candidate(1);
    assert!(matches!(run(journal.begin(&c)).unwrap(), Claim::New));
    let entry = run(journal.load(c.request())).unwrap().unwrap();
    assert_eq!(entry, EntryV1::new(c.clone()).unwrap());
    assert_eq!(
        run(journal.confirm(&c, &confirmation(&c))).err(),
        Some(CaptureError::ReceiptMismatch)
    );
    let p = prepared(&c);
    run(journal.prepared(&c, &p)).unwrap();
    let mut wrong = p.clone();
    wrong.publication_id = Some(jj_store_model::PublicationId::new([99; 16]));
    assert_eq!(
        run(journal.prepared(&c, &wrong)).err(),
        Some(CaptureError::ReceiptMismatch)
    );
    let receipt = confirmation(&c);
    run(journal.confirm(&c, &receipt)).unwrap();
    run(journal.prepared(&c, &p)).unwrap();
    run(journal.confirm(&c, &receipt)).unwrap();
    let mut wrong = receipt.clone();
    wrong.version += 1;
    assert_eq!(
        run(journal.confirm(&c, &wrong)).err(),
        Some(CaptureError::ReceiptMismatch)
    );
    let retained = run(journal.load(c.request())).unwrap().unwrap();
    drop(journal);
    let journal = open(root.path());
    let Claim::Existing(reopened) = run(journal.begin(&c)).unwrap() else {
        panic!("retained intent")
    };
    assert_eq!(*reopened, retained);
    assert_eq!(reopened.confirmation, Some(receipt));
    let mut changed = c.clone();
    changed.context.thread =
        serde_json::from_value(serde_json::json!("99999999999999999999999999999999")).unwrap();
    assert_eq!(changed.request(), c.request());
    assert_eq!(
        run(journal.begin(&changed)).err().unwrap(),
        CaptureError::ReceiptMismatch
    );
}

#[test]
fn post_write_admission_loss_retains_unknown_intent_and_unpolled_calls_write_nothing() {
    let root = tempfile::tempdir().unwrap();
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let count = Arc::new(AtomicUsize::new(0));
    let fence = Arc::new(AtomicUsize::new(usize::MAX));
    let calls = count.clone();
    let fail = fence.clone();
    let c = candidate(1);
    let journal = ProfileJournal::open(
        &profile,
        c.context.clone(),
        &provider(&c.context),
        Arc::new(move || {
            if calls.fetch_add(1, Ordering::SeqCst) + 1 >= fail.load(Ordering::SeqCst) {
                Err(CaptureError::Rejected)
            } else {
                Ok(())
            }
        }),
    )
    .unwrap();
    drop(journal.begin(&c));
    assert!(run(journal.load(c.request())).unwrap().is_none());
    count.store(0, Ordering::SeqCst);
    fence.store(2, Ordering::SeqCst);
    assert_eq!(run(journal.begin(&c)).err(), Some(CaptureError::Unknown));
    fence.store(usize::MAX, Ordering::SeqCst);
    let Claim::Existing(entry) = run(journal.begin(&c)).unwrap() else {
        panic!("never reclaim")
    };
    assert_eq!(entry.candidate, c);
    assert!(entry.prepared.is_none());
}

#[test]
fn binding_reopen_rejects_changed_thread_policy_and_lost_scope_without_reset() {
    let root = tempfile::tempdir().unwrap();
    let journal = open(root.path());
    let c = candidate(1);
    run(journal.begin(&c)).unwrap();
    drop(journal);
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let mut changed = c.context.clone();
    changed.policy = "other/v1".into();
    assert!(
        ProfileJournal::open(
            &profile,
            changed,
            &provider(&c.context),
            Arc::new(|| Ok(()))
        )
        .is_err()
    );
    let journal = open(root.path());
    assert_eq!(
        run(journal.load(c.request())).unwrap().unwrap().candidate,
        c
    );
    let path = journal_path(root.path());
    drop(journal);
    std::fs::remove_file(path.join("binding.json")).unwrap();
    assert!(
        ProfileJournal::open(
            &profile,
            c.context.clone(),
            &provider(&c.context),
            Arc::new(|| Ok(()))
        )
        .is_err()
    );
    assert!(path.join(format!("{}.json", c.request())).exists());
}
