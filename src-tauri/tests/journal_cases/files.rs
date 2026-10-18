use super::*;
use jj_store_conversations::capture::CaptureError;
use std::os::unix::fs::{PermissionsExt, symlink};

#[test]
fn private_records_reject_symlinks_hardlinks_oversized_or_tampered_bytes() {
    for fault in ["symlink", "hardlink", "oversized", "tampered", "public"] {
        let root = tempfile::tempdir().unwrap();
        let journal = open(root.path());
        let c = candidate(1);
        run(journal.begin(&c)).unwrap();
        let path = journal_path(root.path()).join(format!("{}.json", c.request()));
        assert_eq!(
            std::fs::metadata(&path).unwrap().permissions().mode() & 0o777,
            0o600
        );
        match fault {
            "symlink" => {
                std::fs::remove_file(&path).unwrap();
                std::fs::write(root.path().join("outside"), "outside").unwrap();
                symlink(root.path().join("outside"), &path).unwrap();
            }
            "hardlink" => std::fs::hard_link(&path, root.path().join("alias")).unwrap(),
            "oversized" => {
                std::fs::OpenOptions::new()
                    .write(true)
                    .open(&path)
                    .unwrap()
                    .set_len(MAX_JOURNAL_BYTES as u64 + 1)
                    .unwrap();
            }
            "tampered" => {
                let mut entry = EntryV1::new(c.clone()).unwrap();
                entry.candidate.capture_digest[0] ^= 1;
                std::fs::write(&path, serde_json::to_vec(&entry).unwrap()).unwrap();
            }
            _ => std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o644)).unwrap(),
        }
        assert!(run(journal.load(c.request())).is_err(), "{fault}");
        assert!(run(journal.begin(&c)).is_err(), "{fault}");
    }
}

#[test]
fn private_directories_scope_and_lease_cannot_be_substituted() {
    let root = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();
    symlink(outside.path(), root.path().join("ai-capture-v1")).unwrap();
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let c = context();
    assert!(ProfileJournal::open(&profile, c.clone(), &provider(&c), Arc::new(|| Ok(()))).is_err());
    assert!(std::fs::read_dir(outside.path()).unwrap().next().is_none());
    let root = tempfile::tempdir().unwrap();
    let journal = open(root.path());
    let path = journal_path(root.path());
    assert_eq!(
        std::fs::metadata(&path).unwrap().permissions().mode() & 0o777,
        0o700
    );
    let binding = std::fs::read(path.join("binding.json")).unwrap();
    assert!(!String::from_utf8_lossy(&binding).contains("private-fixture"));
    let mut value: serde_json::Value = serde_json::from_slice(&binding).unwrap();
    value["authority"] = serde_json::json!("foreign");
    std::fs::write(
        path.join("binding.json"),
        serde_json::to_vec(&value).unwrap(),
    )
    .unwrap();
    assert_eq!(
        run(journal.load(c.request(1))).err(),
        Some(CaptureError::Unknown)
    );
    std::fs::write(path.join("binding.json"), binding).unwrap();
    std::fs::remove_file(path.join("lease")).unwrap();
    std::fs::write(path.join("lease"), []).unwrap();
    assert_eq!(
        run(journal.load(c.request(1))).err(),
        Some(CaptureError::Unknown)
    );
}
