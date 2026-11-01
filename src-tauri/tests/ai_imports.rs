use lapis_desktop::ai::imports::{ImportScope, discover, preview};
use serde_json::json;
use std::{
    fs, io,
    io::Write,
    path::{Path, PathBuf},
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
};
struct Fixture {
    _root: tempfile::TempDir,
    home: PathBuf,
    file: PathBuf,
}
impl Fixture {
    fn new(desktop: bool) -> Self {
        let root = tempfile::tempdir().unwrap();
        let home = root.path().join("home");
        let sessions = home.join(".codex/sessions/2026/10/19");
        fs::create_dir_all(&sessions).unwrap();
        let file = sessions.join("rollout.jsonl");
        let header = json!({"timestamp":"2026-10-19T09:00:00.000Z","type":"session_meta","payload":{
            "id":"12345678-1234-1234-1234-123456789abc", "cwd":home.join("private-repo"),
            "source":if desktop {"vscode"} else {"cli"}, "originator":if desktop {"Codex Desktop"} else {"codex_cli_rs"},
            "cli_version":if desktop {"0.159.2"} else {"0.156.1"}}});
        fs::write(&file, format!("{header}\n")).unwrap();
        Self {
            _root: root,
            home,
            file,
        }
    }
    fn append(&self, payload: serde_json::Value) {
        let record = json!({"timestamp":"2026-10-19T09:01:00.000Z","type":"response_item","payload":payload});
        writeln!(
            fs::OpenOptions::new()
                .append(true)
                .open(&self.file)
                .unwrap(),
            "{record}"
        )
        .unwrap();
    }
    fn message(&self, text: &str) {
        self.append(json!({"type":"message","role":"assistant","content":[{"type":"output_text","text":text}]}));
    }
}
fn value(f: &Fixture) -> serde_json::Value {
    let catalog = discover(&f.home, &|| Ok(())).unwrap();
    assert_eq!(catalog.rows().len(), 1);
    serde_json::to_value(
        preview(&catalog, &catalog.rows()[0].selector, &f.home, &|| Ok(())).unwrap(),
    )
    .unwrap()
}
#[test]
fn actual_cli_and_desktop_snapshots_are_private_stable_and_read_only() {
    for desktop in [false, true] {
        let f = Fixture::new(desktop);
        f.message(&format!(
            "Review {} with Bearer {}",
            f.home.display(),
            format_args!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K")
        ));
        f.append(json!({"type":"reasoning","summary":[],"encrypted_content":"PRIVATE_REASONING_SHOULD_NEVER_LEAVE_NATIVE"}));
        let original = fs::read(&f.file).unwrap();
        let v = value(&f);
        let text = v.to_string();
        assert!(!text.contains(f.home.to_str().unwrap()));
        assert!(!text.contains("PRIVATE_REASONING"));
        assert!(!text.contains(&format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K")));
        assert!(!text.contains("12345678-1234-1234-1234-123456789abc"));
        assert!(!text.contains("session_meta"));
        assert_eq!(v["source"]["sessionKey"].as_str().unwrap().len(), 64);
        assert_eq!(v["source"]["snapshotKey"].as_str().unwrap().len(), 64);
        assert!(v["entries"][0]["text"].as_str().unwrap().contains("Review"));
        assert_eq!(v, value(&f));
        assert_eq!(fs::read(&f.file).unwrap(), original);
        assert_eq!(fs::read_dir(f.file.parent().unwrap()).unwrap().count(), 1);
    }
}
#[test]
fn cross_batch_tool_output_is_linked_and_remains_unknown() {
    let f = Fixture::new(false);
    f.append(json!({"type":"function_call","name":"exec_command","call_id":"native-call","arguments":"{\"cmd\":\"pwd\"}"}));
    for _ in 0..270 {
        f.message("Visible assistant text");
    }
    f.append(json!({"type":"function_call_output","call_id":"native-call","output":"observed command output"}));
    let v = value(&f);
    let tool = v["entries"]
        .as_array()
        .unwrap()
        .iter()
        .find(|e| e["type"] == "tool")
        .unwrap();
    assert_eq!(tool["state"], "unknown");
    assert_eq!(tool["output"], "observed command output");
    assert!(tool["input"].as_str().unwrap().contains("pwd"));
    assert!(!v.to_string().contains("native-call"));
}
#[test]
fn source_growth_and_partial_records_refuse_tentative_output() {
    let f = Fixture::new(false);
    f.message("original");
    let catalog = discover(&f.home, &|| Ok(())).unwrap();
    let checks = AtomicUsize::new(0);
    let result = preview(&catalog, &catalog.rows()[0].selector, &f.home, &|| {
        if checks.fetch_add(1, Ordering::SeqCst) == 3 {
            f.message("late append");
        }
        Ok(())
    });
    assert!(result.is_err());
    let mut file = fs::OpenOptions::new().append(true).open(&f.file).unwrap();
    write!(file, "{{\"type\":").unwrap();
    assert!(preview(&catalog, &catalog.rows()[0].selector, &f.home, &|| Ok(())).is_err());
}
#[test]
fn known_root_only_and_unsupported_profiles_are_not_offered() {
    let f = Fixture::new(false);
    f.message("visible");
    fs::create_dir_all(f.home.join(".codex/archived_sessions")).unwrap();
    fs::rename(
        &f.file,
        f.home.join(".codex/archived_sessions/rollout.jsonl"),
    )
    .unwrap();
    assert!(discover(&f.home, &|| Ok(())).unwrap().rows().is_empty());
    fs::write(
        &f.file,
        "{\"type\":\"session_meta\",\"payload\":{\"cli_version\":\"unknown\"}}\n",
    )
    .unwrap();
    assert!(discover(&f.home, &|| Ok(())).unwrap().rows().is_empty());
    assert!(
        discover(Path::new("/absent-import-home"), &|| Ok(()))
            .unwrap()
            .rows()
            .is_empty()
    );
}
#[test]
fn recent_sessions_are_selected_after_scanning_and_bound_to_catalog_selectors() {
    let f = Fixture::new(false);
    let bytes = fs::read(&f.file).unwrap();
    for i in 0..270 {
        let path = f.file.parent().unwrap().join(format!("{i:04}.jsonl"));
        fs::write(&path, &bytes).unwrap();
        fs::File::options()
            .write(true)
            .open(&path)
            .unwrap()
            .set_modified(std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_700_000_000 + i))
            .unwrap();
    }
    fs::File::options()
        .write(true)
        .open(&f.file)
        .unwrap()
        .set_modified(std::time::UNIX_EPOCH)
        .unwrap();
    let catalog = discover(&f.home, &|| Ok(())).unwrap();
    let rows = catalog.rows();
    assert_eq!(rows.len(), 256);
    assert!(
        rows.windows(2)
            .all(|pair| pair[0].updated_at >= pair[1].updated_at)
    );
    assert_eq!(rows[0].updated_at, "2023-11-14T22:17:49.000Z");
    assert_eq!(rows[255].updated_at, "2023-11-14T22:13:34.000Z");
    assert!(preview(&catalog, "/private/path", &f.home, &|| Ok(())).is_err());
}
#[test]
fn prepared_cancel_precedes_worker_start_and_scope_checks_fail_closed() {
    let allowed = Arc::new(std::sync::atomic::AtomicBool::new(true));
    let check = allowed.clone();
    let scope = ImportScope::new(Arc::new(move || {
        if check.load(Ordering::SeqCst) {
            Ok(())
        } else {
            Err(io::Error::other("revoked"))
        }
    }));
    let ticket = scope.prepare().unwrap();
    scope.cancel(ticket).unwrap();
    assert!(scope.begin(ticket).is_err());
    let ticket = scope.prepare().unwrap();
    let work = scope.begin(ticket).unwrap();
    allowed.store(false, Ordering::SeqCst);
    assert!(work.check().is_err());
    assert!(scope.prepare().is_err());
    scope.fence().unwrap();
    assert!(work.check().is_err());
    drop(work);
}
#[tokio::test]
async fn close_fences_queued_and_running_workers_and_awaits_drain() {
    let scope = ImportScope::new(Arc::new(|| Ok(())));
    let queued = scope.prepare().unwrap();
    let running = scope.prepare().unwrap();
    let work = scope.begin(running).unwrap();
    let draining = scope.clone();
    let close = tokio::spawn(async move { draining.drain().await });
    tokio::task::yield_now().await;
    assert!(!close.is_finished());
    assert!(scope.begin(queued).is_err());
    assert!(work.check().is_err());
    drop(work);
    close.await.unwrap().unwrap();
    assert!(scope.prepare().is_err());
}

#[test]
fn lapis_acp_cli_sessions_use_shared_source_admission_and_privacy() {
    let f = Fixture::new(false);
    let mut header: serde_json::Value =
        serde_json::from_slice(&fs::read(&f.file).unwrap()).unwrap();
    header["payload"]["source"] = json!("vscode");
    header["payload"]["originator"] = json!("lapis-acp");
    fs::write(&f.file, format!("{header}\n")).unwrap();
    f.message("Captured Lapis ACP response");
    let capture = value(&f);
    assert_eq!(capture["source"]["profile"], "codex-cli-0.156.1");
    assert_eq!(capture["entries"][0]["text"], "Captured Lapis ACP response");
}
