use super::*;
use jj_store_model::RequestId;
use lapis_desktop::ai::backend::Backend;
#[test]
fn missing_partial_corrupt_and_symlinked_state_never_fall_back_to_legacy() {
    for fault in [
        "missing-head",
        "missing-preparation",
        "corrupt",
        "symlink",
        "oversized",
    ] {
        let f = Fixture::new();
        let p = f.open();
        assert!(!f.profile.join("ai-backends-v1").exists());
        assert_eq!(p.read().unwrap().revision, 0);
        assert!(!f.profile.join("ai-backends-v1").exists());
        let id = RequestId::new([1; 16]);
        p.select(id, 0, Backend::VaultFiles).unwrap();
        let dir = f.config();
        match fault {
            "missing-head" => std::fs::remove_file(dir.join("selection.json")).unwrap(),
            "missing-preparation" => std::fs::remove_file(dir.join("prepared.json")).unwrap(),
            "corrupt" => std::fs::write(dir.join("selection.json"), b"{}").unwrap(),
            "oversized" => {
                std::fs::OpenOptions::new()
                    .write(true)
                    .open(dir.join("selection.json"))
                    .unwrap()
                    .set_len(128 * 1024 + 1)
                    .unwrap();
            }
            _ => {
                std::fs::remove_file(dir.join("selection.json")).unwrap();
                std::os::unix::fs::symlink(
                    f.root.path().join("outside"),
                    dir.join("selection.json"),
                )
                .unwrap();
            }
        }
        assert!(p.read().is_err(), "{fault}");
        assert!(p.open_scope().is_err(), "{fault}");
        assert!(
            p.select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
                .is_err(),
            "{fault}"
        );
    }
}
#[test]
fn original_choice_receipts_survive_later_changes_and_post_commit_admission_failure() {
    let f = Fixture::new();
    let p = f.open();
    let first = p
        .select(RequestId::new([1; 16]), 0, Backend::VaultFiles)
        .unwrap();
    let second = p
        .select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
        .unwrap();
    assert_eq!(
        p.select(first.request_id, 0, Backend::VaultFiles).unwrap(),
        first
    );
    assert_eq!(p.status(second.request_id).unwrap(), Some(second));
    assert!(p.select(first.request_id, 0, Backend::Jj).is_err());
    let check = f.admission();
    let file = f.config().join("selection.json");
    let armed = Arc::new(std::sync::atomic::AtomicBool::new(true));
    let fault = armed.clone();
    let id = RequestId::new([9; 16]);
    let p = BackendProfiles::new(
        Dir::open_ambient_dir(&f.profile, ambient_authority()).unwrap(),
        Arc::new(move || {
            let lease = check()?;
            let data = std::fs::read_to_string(&file).unwrap_or_default();
            if data.contains(&id.to_string())
                && fault.swap(false, std::sync::atomic::Ordering::SeqCst)
            {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::PermissionDenied,
                    "admission changed",
                ));
            }
            Ok(lease)
        }),
    )
    .unwrap();
    assert!(p.select(id, 2, Backend::VaultFiles).is_err());
    let receipt = p.status(id).unwrap().unwrap();
    assert_eq!(receipt.selection.revision, 3);
    assert_eq!(p.select(id, 2, Backend::VaultFiles).unwrap(), receipt);
    assert_eq!(f.open().read().unwrap().revision, 3);
}
