use cap_std::{ambient_authority, fs::Dir};
use jj_store_conversations::{capture::CaptureError, store_capture::*};
use jj_store_core::PublicationScope;
use lapis_desktop::ai::journal::ProfileJournal;
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
mod journal_cases;
use journal_cases::{context, provider};
#[test]
fn journal_requires_current_admission_and_exclusive_backend_scope_lease() {
    let root = tempfile::tempdir().unwrap();
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let current = Arc::new(AtomicBool::new(true));
    let state = current.clone();
    let c = context();
    let journal = ProfileJournal::open(
        &profile,
        c.clone(),
        &provider(&c),
        Arc::new(move || {
            if state.load(Ordering::SeqCst) {
                Ok(())
            } else {
                Err(CaptureError::Rejected)
            }
        }),
    )
    .unwrap();
    assert!(ProfileJournal::open(&profile, c.clone(), &provider(&c), Arc::new(|| Ok(()))).is_err());
    current.store(false, Ordering::SeqCst);
    assert_eq!(
        tauri::async_runtime::block_on(journal.load(c.request(1))).err(),
        Some(CaptureError::Rejected)
    );
    drop(journal);
    assert!(ProfileJournal::open(&profile, c.clone(), &provider(&c), Arc::new(|| Ok(()))).is_ok());
    assert!(
        ProfileJournal::open(
            &profile,
            c.clone(),
            &PublicationScope {
                repository: None,
                authority: "unbound".into()
            },
            Arc::new(|| Ok(()))
        )
        .is_err()
    );
    assert!(
        ProfileJournal::open(
            &profile,
            c.clone(),
            &provider(&c),
            Arc::new(|| Err(CaptureError::Rejected))
        )
        .is_err()
    );
}
