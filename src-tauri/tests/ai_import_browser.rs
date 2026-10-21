use lapis_desktop::ai::imports::{BrowserPreview, Harness, ImportIndex};
use serde_json::json;
use std::fs;

fn fixture() -> (tempfile::TempDir, std::path::PathBuf, std::path::PathBuf) {
    let root = tempfile::tempdir().unwrap();
    let home = root.path().canonicalize().unwrap().join("home");
    let source = home.join(".codex/sessions/2026/10/21/session.jsonl");
    fs::create_dir_all(source.parent().unwrap()).unwrap();
    let header = json!({"type":"session_meta","payload":{"id":"12345678-1234-1234-1234-123456789abc","cwd":home.join("project"),"source":"cli","originator":"codex_cli_rs","cli_version":"0.156.1"}});
    let mut text = format!("{header}\n");
    for _ in 0..300 {
        text.push_str(&format!("{}\n", json!({"timestamp":"2026-10-21T10:00:00Z","type":"response_item","payload":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"VISIBLE_BODY_NOT_METADATA"}]}})));
    }
    fs::write(&source, text).unwrap();
    (root, home, source)
}
fn folders(index: &mut ImportIndex) -> Vec<lapis_desktop::ai::imports::ImportFolder> {
    let mut result = index.folders(Harness::Codex, true, &|| Ok(())).unwrap();
    while !result.complete {
        result = index.folders(Harness::Codex, false, &|| Ok(())).unwrap();
    }
    result.folders
}
#[test]
fn metadata_cache_reopens_without_bodies_and_lists_only_selected_folder() {
    let (root, home, _) = fixture();
    let cache = root.path().join("cache");
    let mut index = ImportIndex::new(home.clone(), cache.clone());
    let rows = folders(&mut index);
    assert_eq!(rows.len(), 1);
    let sources = index.sessions(&rows[0].selector, None, &|| Ok(())).unwrap();
    assert_eq!(sources.rows.len(), 1);
    assert!(index.sessions("foreign", None, &|| Ok(())).is_err());
    let serialized = fs::read_to_string(cache.join("sessions-v1.json")).unwrap();
    assert!(!serialized.contains("VISIBLE_BODY_NOT_METADATA"));
    let mut reopened = ImportIndex::new(home, cache);
    let cached = reopened.folders(Harness::Codex, true, &|| Ok(())).unwrap();
    assert_eq!(cached.folders.len(), 1);
    assert!(!cached.complete);
}
#[test]
fn preview_is_provisional_until_verified_and_rejects_replaced_source() {
    let (root, home, source) = fixture();
    let mut index = ImportIndex::new(home.clone(), root.path().join("cache"));
    let folder = folders(&mut index).remove(0);
    let row = index
        .sessions(&folder.selector, None, &|| Ok(()))
        .unwrap()
        .rows
        .remove(0);
    let selection = index.select(&row.selector, &|| Ok(())).unwrap();
    let mut reader = BrowserPreview::open(selection, &home, &|| Ok(())).unwrap();
    let first = reader.next(&|| Ok(())).unwrap();
    assert!(first.capture.is_none());
    assert!(!first.entries.is_empty());
    let mut last = first;
    while last.capture.is_none() {
        last = reader.next(&|| Ok(())).unwrap();
    }
    assert_eq!(
        last.capture
            .unwrap()
            .entries
            .iter()
            .filter(|entry| matches!(
                entry,
                lapis_desktop::ai::imports::CapturedEntry::Message { .. }
            ))
            .count(),
        300
    );
    fs::rename(&source, source.with_extension("old")).unwrap();
    fs::write(&source, "{}\n").unwrap();
    assert!(index.select(&row.selector, &|| Ok(())).is_err());
}

#[test]
fn reload_revalidates_appends_without_full_index_refresh_and_corrupt_cache_rebuilds() {
    use std::io::Write;
    let (root, home, source) = fixture();
    let cache = root.path().join("cache");
    let mut index = ImportIndex::new(home.clone(), cache.clone());
    let folder = folders(&mut index).remove(0);
    let row = index
        .sessions(&folder.selector, None, &|| Ok(()))
        .unwrap()
        .rows
        .remove(0);
    let selection = index.select(&row.selector, &|| Ok(())).unwrap();
    let mut reader = BrowserPreview::open(selection, &home, &|| Ok(())).unwrap();
    assert!(reader.next(&|| Ok(())).unwrap().capture.is_none());
    let appended = json!({"timestamp":"2026-10-21T10:01:00Z","type":"response_item","payload":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"APPENDED_ANSWER"}]}});
    writeln!(
        fs::OpenOptions::new().append(true).open(&source).unwrap(),
        "{appended}"
    )
    .unwrap();
    assert!(reader.next(&|| Ok(())).is_err());
    let selection = index.select(&row.selector, &|| Ok(())).unwrap();
    let mut reloaded = BrowserPreview::open(selection, &home, &|| Ok(())).unwrap();
    loop {
        if let Some(capture) = reloaded.next(&|| Ok(())).unwrap().capture {
            assert!(
                serde_json::to_string(&capture)
                    .unwrap()
                    .contains("APPENDED_ANSWER")
            );
            break;
        }
    }
    fs::write(cache.join("sessions-v1.json"), "broken cache").unwrap();
    assert_eq!(folders(&mut ImportIndex::new(home, cache)).len(), 1);
}
