use lapis_desktop::{
    vault::{VaultRoot, WriteOptions},
    watch::{NativeWatch, WatchBatch},
};
use std::{
    fs,
    sync::{Arc, Mutex, mpsc},
    time::{Duration, Instant},
};
use tempfile::tempdir;

fn wait_for(
    receiver: &mpsc::Receiver<WatchBatch>,
    predicate: impl Fn(&WatchBatch) -> bool,
) -> WatchBatch {
    let end = Instant::now() + Duration::from_secs(5);
    loop {
        let batch = receiver
            .recv_timeout(end.saturating_duration_since(Instant::now()))
            .expect("native event deadline");
        if predicate(&batch) {
            return batch;
        }
    }
}

#[test]
fn actual_watch_delivers_unicode_changes_rename_hints_and_stops_on_close() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let (send, receive) = mpsc::channel();
    let mut watch = NativeWatch::start(&root, "", true, Arc::new(Mutex::new(())), move |batch| {
        send.send(batch).is_ok()
    })
    .unwrap();
    fs::write(directory.path().join("café.md"), b"one").unwrap();
    let created = wait_for(&receive, |b| {
        b.changes
            .iter()
            .any(|e| e.r#type == "create" && e.path == "café.md")
    });
    fs::write(directory.path().join("café.md"), b"changed body").unwrap();
    let modified = wait_for(&receive, |b| {
        b.changes
            .iter()
            .any(|e| e.r#type == "modify" && e.path == "café.md")
    });
    assert!(modified.sequence > created.sequence);
    fs::rename(
        directory.path().join("café.md"),
        directory.path().join("笔记.md"),
    )
    .unwrap();
    wait_for(&receive, |b| {
        b.changes
            .iter()
            .any(|e| e.path == "笔记.md" && e.previous_path.as_deref() == Some("café.md"))
    });
    fs::remove_file(directory.path().join("笔记.md")).unwrap();
    wait_for(&receive, |b| {
        b.changes
            .iter()
            .any(|e| e.r#type == "delete" && e.path == "笔记.md")
    });
    watch.close().unwrap();
    while receive.try_recv().is_ok() {}
    fs::write(directory.path().join("after.md"), b"closed").unwrap();
    assert!(receive.recv_timeout(Duration::from_millis(150)).is_err());
}

#[test]
fn host_io_gate_hides_only_incomplete_writes_not_similarly_named_user_files() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    root.write("Note.md", b"old", &WriteOptions::default())
        .unwrap();
    let gate = Arc::new(Mutex::new(()));
    let (send, receive) = mpsc::channel();
    let mut watch = NativeWatch::start(&root, "", true, gate.clone(), move |batch| {
        send.send(batch).is_ok()
    })
    .unwrap();
    {
        let _guard = gate.lock().unwrap();
        root.write("Note.md", b"new body", &WriteOptions::default())
            .unwrap();
        root.copy_file("Note.md", "copy.md").unwrap();
    }
    let mut changes = Vec::new();
    let end = Instant::now() + Duration::from_secs(5);
    while !changes
        .iter()
        .any(|e: &lapis_desktop::watch::WatchChange| e.path == "copy.md")
    {
        let batch = receive
            .recv_timeout(end.saturating_duration_since(Instant::now()))
            .unwrap();
        changes.extend(batch.changes);
    }
    assert!(
        changes
            .iter()
            .any(|e| e.path == "Note.md" && e.r#type == "modify")
    );
    assert!(
        changes
            .iter()
            .all(|e| e.path == "Note.md" || e.path == "copy.md")
    );
    fs::write(
        directory.path().join(".lapis-stage-user"),
        b"a real user file",
    )
    .unwrap();
    wait_for(&receive, |b| {
        b.changes
            .iter()
            .any(|e| e.path == ".lapis-stage-user" && e.r#type == "create")
    });
    watch.close().unwrap();
}

#[cfg(unix)]
#[test]
fn watch_scope_and_root_identity_reject_symlink_escape_and_replacement() {
    use std::os::unix::fs::symlink;
    let directory = tempdir().unwrap();
    let outside = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    symlink(outside.path(), directory.path().join("linked")).unwrap();
    for scope in ["linked", "../outside", "/absolute"] {
        assert!(
            NativeWatch::start(&root, scope, true, Arc::new(Mutex::new(())), |_| true).is_err()
        );
    }
    let renamed = directory.path().with_extension("moved");
    fs::rename(directory.path(), &renamed).unwrap();
    fs::create_dir(directory.path()).unwrap();
    assert!(NativeWatch::start(&root, "", true, Arc::new(Mutex::new(())), |_| true).is_err());
    fs::remove_dir_all(renamed).unwrap();
}

#[test]
fn a_file_scope_observes_atomic_replacement_and_excludes_siblings() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    root.mkdir("Notes", false).unwrap();
    root.write("Notes/Note.md", b"old", &WriteOptions::default())
        .unwrap();
    let gate = Arc::new(Mutex::new(()));
    let (send, receive) = mpsc::channel();
    let mut watch = NativeWatch::start(&root, "Notes/Note.md", false, gate.clone(), move |batch| {
        send.send(batch).is_ok()
    })
    .unwrap();
    {
        let _guard = gate.lock().unwrap();
        root.write(
            "Notes/Note.md",
            b"atomic replacement",
            &WriteOptions::default(),
        )
        .unwrap();
        root.write("Notes/other.md", b"sibling", &WriteOptions::default())
            .unwrap();
    }
    let batch = wait_for(&receive, |b| {
        b.changes.iter().any(|e| e.path == "Notes/Note.md")
    });
    assert!(batch.changes.iter().all(|e| e.path == "Notes/Note.md"));
    watch.close().unwrap();
}

#[test]
fn oversized_delivery_requests_complete_reconciliation_without_partial_events() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let gate = Arc::new(Mutex::new(()));
    let (send, receive) = mpsc::channel();
    let mut watch = NativeWatch::start(&root, "", true, gate.clone(), move |batch| {
        send.send(batch).is_ok()
    })
    .unwrap();
    {
        let _guard = gate.lock().unwrap();
        for index in 0..300 {
            fs::write(
                directory.path().join(format!("burst-{index}.md")),
                b"bounded burst",
            )
            .unwrap();
        }
    }
    let overflow = wait_for(&receive, |batch| batch.reconciliation);
    assert!(
        overflow.changes.is_empty(),
        "never deliver a partial overflow list"
    );
    fs::write(directory.path().join("after-overflow.md"), b"continuous").unwrap();
    let recovered = wait_for(&receive, |batch| {
        batch.reconciliation
            || batch
                .changes
                .iter()
                .any(|change| change.path == "after-overflow.md")
    });
    assert!(recovered.sequence > overflow.sequence);
    if recovered.reconciliation {
        assert!(recovered.changes.is_empty());
        // More than one native hint delivery may cover the same burst. A fresh
        // complete reconciliation, rather than a partial list, remains required.
        let snapshot = root.list("").unwrap();
        assert_eq!(snapshot.files.len(), 301);
        assert!(
            snapshot
                .files
                .iter()
                .any(|path| path == "after-overflow.md")
        );
    }
    watch.close().unwrap();
}
