use lapis_desktop::ai::imports::{BrowserPreview, Harness, ImportIndex};
use serde_json::json;
use std::{fs, path::Path};
fn read(index: &mut ImportIndex, kind: Harness, home: &Path) -> serde_json::Value {
    let mut folders = index.folders(kind, true, &|| Ok(())).unwrap();
    while !folders.complete {
        folders = index.folders(kind, false, &|| Ok(())).unwrap();
    }
    assert_eq!(folders.folders.len(), 1);
    let row = index
        .sessions(&folders.folders[0].selector, None, &|| Ok(()))
        .unwrap()
        .rows
        .remove(0);
    let selection = index.select(&row.selector, &|| Ok(())).unwrap();
    let mut reader = BrowserPreview::open(selection, home, &|| Ok(())).unwrap();
    loop {
        if let Some(capture) = reader.next(&|| Ok(())).unwrap().capture {
            return serde_json::to_value(capture).unwrap();
        }
    }
}
#[test]
fn ordinary_cursor_transcripts_need_no_jj_hook_and_keep_privacy() {
    let root = tempfile::tempdir().unwrap();
    let home = root.path().canonicalize().unwrap().join("home");
    let path = home.join(
        ".cursor/projects/example/agent-transcripts/12345678-1234-1234-1234-123456789abc.jsonl",
    );
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let source = format!(
        "{}\n{}\n",
        json!({"role":"user","message":{"content":[{"type":"text","text":format!("Review {} Bearer {}", home.display(), format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K"))}]}}),
        json!({"role":"assistant","message":{"content":[{"type":"thinking","thinking":"PRIVATE_REASONING_SENTINEL"},{"type":"text","text":"Visible answer"},{"type":"tool_use","id":"raw-native-tool","name":"read_file","input":{"path":home.join("notes.md")}},{"type":"text","text":"Visible continuation"}]}})
    );
    fs::write(&path, &source).unwrap();
    let mut index = ImportIndex::new(home.clone(), root.path().join("cache"));
    let capture = read(&mut index, Harness::Cursor, &home);
    let text = capture.to_string();
    assert!(text.contains("Visible answer"));
    let privacy_canary = format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K");
    for private in [
        home.to_str().unwrap(),
        "PRIVATE_REASONING_SENTINEL",
        "raw-native-tool",
        privacy_canary.as_str(),
    ] {
        assert!(!text.contains(private));
    }
    let entries = capture["entries"].as_array().unwrap();
    let answer = entries
        .iter()
        .position(|e| e["text"] == "Visible answer")
        .unwrap();
    let tool = entries.iter().position(|e| e["type"] == "tool").unwrap();
    let continuation = entries
        .iter()
        .position(|e| e["text"] == "Visible continuation")
        .unwrap();
    assert!(
        answer < tool && tool < continuation,
        "text and tools retain observed order"
    );
    let ids: std::collections::HashSet<_> =
        entries.iter().map(|e| e["id"].as_str().unwrap()).collect();
    assert_eq!(ids.len(), entries.len());
    assert_eq!(capture["source"]["kind"], "cursor");
    assert_eq!(capture["source"]["profile"], "cursor-jsonl-v1");
    assert_eq!(fs::read_to_string(&path).unwrap(), source);
    assert_eq!(capture, read(&mut index, Harness::Cursor, &home));
    assert!(
        !fs::read_to_string(root.path().join("cache/sessions-v1.json"))
            .unwrap()
            .contains("Visible answer")
    );
}
#[test]
fn opencode_sqlite_imports_selected_session_without_execution_or_source_writes() {
    let root = tempfile::tempdir().unwrap();
    let home = root.path().canonicalize().unwrap().join("home");
    let path = home.join(".local/share/opencode/opencode.db");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let database = rusqlite::Connection::open(&path).unwrap();
    database.execute_batch("CREATE TABLE session(id TEXT PRIMARY KEY,directory TEXT,title TEXT,version TEXT,time_created INTEGER,time_updated INTEGER); CREATE TABLE message(id TEXT PRIMARY KEY,session_id TEXT,time_created INTEGER,time_updated INTEGER,data TEXT); CREATE TABLE part(id TEXT PRIMARY KEY,message_id TEXT,session_id TEXT,time_created INTEGER,time_updated INTEGER,data TEXT);").unwrap();
    database.execute("INSERT INTO session VALUES ('ses_fixture',?1,'Fixture source','1.18.31',1792576800000,1792576800001)",[home.join("project").to_str().unwrap()]).unwrap();
    database.execute_batch("INSERT INTO message VALUES ('msg_one','ses_fixture',1792576800000,1792576800000,'{\"role\":\"user\"}'); INSERT INTO message VALUES ('msg_two','ses_fixture',1792576800001,1792576800001,'{\"role\":\"assistant\"}');").unwrap();
    for (id, message, value) in [
        (
            "prt_one",
            "msg_one",
            json!({"type":"text","text":format!("Review {} with {}", home.display(), format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K"))}),
        ),
        (
            "prt_two",
            "msg_two",
            json!({"type":"reasoning","text":"PRIVATE_REASONING_SENTINEL"}),
        ),
        (
            "prt_three",
            "msg_two",
            json!({"type":"text","text":"Visible OpenCode answer"}),
        ),
        (
            "prt_four",
            "msg_two",
            json!({"type":"tool","tool":"read_file","state":{"status":"running","output":"Observed output"}}),
        ),
    ] {
        database
            .execute(
                "INSERT INTO part VALUES (?1,?2,'ses_fixture',1792576800000,1792576800000,?3)",
                rusqlite::params![id, message, value.to_string()],
            )
            .unwrap();
    }
    drop(database);
    let before = fs::read(&path).unwrap();
    let mut index = ImportIndex::new(home.clone(), root.path().join("cache"));
    let capture = read(&mut index, Harness::Opencode, &home);
    let text = capture.to_string();
    assert!(text.contains("Visible OpenCode answer"));
    assert!(!text.contains(home.to_str().unwrap()));
    assert!(!text.contains("PRIVATE_REASONING_SENTINEL"));
    assert!(!text.contains(&format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K")));
    assert_eq!(capture["source"]["kind"], "opencode");
    assert_eq!(capture["source"]["profile"], "opencode-sqlite-v1");
    let tool = capture["entries"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["type"] == "tool")
        .unwrap();
    assert_eq!(tool["state"], "unknown");
    assert_eq!(capture, read(&mut index, Harness::Opencode, &home));
    assert_eq!(fs::read(&path).unwrap(), before);
}
