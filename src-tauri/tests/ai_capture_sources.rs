use lapis_desktop::ai::imports::{CaptureQueue, CaptureRead};
use serde_json::json;
use std::{fs, path::PathBuf};
struct Fixture {
    _root: tempfile::TempDir,
    home: PathBuf,
    vault: PathBuf,
    path: PathBuf,
}
impl Fixture {
    fn new() -> Self {
        let root = tempfile::tempdir().unwrap();
        let home = root.path().join("home");
        let vault = root.path().join("vault");
        fs::create_dir(&vault).unwrap();
        fs::create_dir_all(home.join(".codex/sessions")).unwrap();
        let path = home.join(".codex/sessions/session.jsonl");
        let f = Self {
            _root: root,
            home,
            vault,
            path,
        };
        f.write(false, false);
        f
    }
    fn write(&self, foreign: bool, partial: bool) {
        let cwd = if foreign { &self.home } else { &self.vault };
        let header = json!({"type":"session_meta","payload":{"id":"12345678-1234-1234-1234-123456789abc","cwd":cwd,"cli_version":"0.156.1","source":"vscode","originator":"lapis-acp"}});
        let message = json!({"timestamp":"2026-10-19T12:00:00Z","type":"response_item","payload":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"Captured vault answer"}]}});
        fs::write(
            &self.path,
            format!("{header}\n{message}{}", if partial { "" } else { "\n" }),
        )
        .unwrap();
    }
}
#[test]
fn pending_capture_repeats_until_confirmed_then_skips_unchanged_sources() {
    let f = Fixture::new();
    let mut queue = CaptureQueue::default();
    let first = queue.next(&f.home, &f.vault, &|| Ok(())).unwrap();
    let CaptureRead::Snapshot {
        delivery, capture, ..
    } = first
    else {
        panic!("snapshot")
    };
    assert_eq!(capture.entries.len(), 2);
    let again = queue.next(&f.home, &f.vault, &|| Ok(())).unwrap();
    assert_eq!(
        serde_json::to_value(again).unwrap()["delivery"],
        serde_json::to_value(delivery).unwrap()
    );
    assert!(queue.confirm(uuid::Uuid::new_v4(), &|| Ok(())).is_err());
    queue.confirm(delivery, &|| Ok(())).unwrap();
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Idle { .. }
    ));
}
#[test]
fn foreign_and_partial_sessions_never_become_confirmed_progress() {
    let f = Fixture::new();
    let mut queue = CaptureQueue::default();
    f.write(true, false);
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Idle { eligible: 0, .. }
    ));
    f.write(false, true);
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Idle { deferred: 1, .. }
    ));
    f.write(false, false);
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Snapshot { .. }
    ));
}

fn snapshot(queue: &mut CaptureQueue, f: &Fixture) -> (uuid::Uuid, serde_json::Value) {
    let CaptureRead::Snapshot {
        delivery, capture, ..
    } = queue.next(&f.home, &f.vault, &|| Ok(())).unwrap()
    else {
        panic!("snapshot")
    };
    (delivery, serde_json::to_value(capture).unwrap())
}
fn append(f: &Fixture, value: serde_json::Value) {
    use std::io::Write;
    writeln!(
        fs::OpenOptions::new().append(true).open(&f.path).unwrap(),
        "{value}"
    )
    .unwrap();
}
#[test]
fn append_waits_for_original_confirmation_and_old_confirmation_cannot_consume_new_pending() {
    let f = Fixture::new();
    let mut queue = CaptureQueue::default();
    let (original, before) = snapshot(&mut queue, &f);
    append(
        &f,
        json!({"type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"Next question"}]}}),
    );
    assert_eq!(snapshot(&mut queue, &f), (original, before.clone()));
    queue.confirm(original, &|| Ok(())).unwrap();
    queue.confirm(original, &|| Ok(())).unwrap();
    let (next, after) = snapshot(&mut queue, &f);
    assert_ne!(
        before["source"]["snapshotKey"],
        after["source"]["snapshotKey"]
    );
    assert_ne!(original, next);
    queue.confirm(original, &|| Ok(())).unwrap();
    assert_eq!(snapshot(&mut queue, &f), (next, after));
    queue.confirm(next, &|| Ok(())).unwrap();
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Idle { .. }
    ));
    let (_, cold) = snapshot(&mut CaptureQueue::default(), &f);
    assert_ne!(
        before["source"]["snapshotKey"],
        cold["source"]["snapshotKey"]
    );
}
#[test]
fn body_context_cannot_borrow_header_authority_including_symlink_escape() {
    let f = Fixture::new();
    let escape = f.vault.join("escape");
    std::os::unix::fs::symlink(&f.home, &escape).unwrap();
    for cwd in [json!(f.home), json!(escape), json!(null)] {
        f.write(false, false);
        append(&f, json!({"type":"turn_context","payload":{"cwd":cwd}}));
        append(
            &f,
            json!({"type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"Foreign context"}]}}),
        );
        let mut queue = CaptureQueue::default();
        assert!(matches!(
            queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
            CaptureRead::Idle { deferred: 1, .. }
        ));
    }
}
#[test]
fn revocation_denies_pending_read_and_confirmation_without_retiring_it() {
    let f = Fixture::new();
    let mut queue = CaptureQueue::default();
    let (delivery, before) = snapshot(&mut queue, &f);
    let denied = || {
        Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "Revoked",
        ))
    };
    assert!(queue.next(&f.home, &f.vault, &denied).is_err());
    assert!(queue.confirm(delivery, &denied).is_err());
    assert_eq!(snapshot(&mut queue, &f), (delivery, before));
}

#[test]
fn older_duplicate_file_cannot_bypass_the_current_session_selection() {
    let f = Fixture::new();
    let old = f.path.with_file_name("older.jsonl");
    fs::copy(&f.path, &old).unwrap();
    fs::File::open(&old)
        .unwrap()
        .set_times(
            fs::FileTimes::new()
                .set_modified(std::time::SystemTime::now() - std::time::Duration::from_secs(60)),
        )
        .unwrap();
    append(
        &f,
        json!({"type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"Newest file only"}]}}),
    );
    let mut queue = CaptureQueue::default();
    let (delivery, value) = snapshot(&mut queue, &f);
    assert!(
        value["entries"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["text"] == "Newest file only")
    );
    queue.confirm(delivery, &|| Ok(())).unwrap();
    assert!(matches!(
        queue.next(&f.home, &f.vault, &|| Ok(())).unwrap(),
        CaptureRead::Idle {
            eligible: 1,
            deferred: 0
        }
    ));
}
