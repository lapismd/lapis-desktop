use lapis_app_core::services::{Client, HistoryMethod};
use lapis_desktop::vault::services::VaultServices;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::{Arc, Mutex},
};
pub fn stock(root: &Path, args: &[&str]) {
    let executable = std::env::var_os("JJ_STORE_TEST_STOCK_JJ").unwrap_or_else(|| "jj".into());
    let result = Command::new(executable)
        .current_dir(root)
        .args([
            "--no-pager",
            "--config",
            "user.name='History fixture'",
            "--config",
            "user.email='fixture@invalid'",
        ])
        .args(args)
        .env("JJ_CONFIG", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}
pub fn source(root: &Path, name: &str) -> PathBuf {
    let notes = root.join(name);
    fs::create_dir(&notes).unwrap();
    stock(&notes, &["git", "init", "--no-colocate", "."]);
    fs::write(notes.join("Note.md"), "Original recorded note\n").unwrap();
    stock(&notes, &["describe", "-m", "Original history"]);
    notes
}
pub fn bytes(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
    fn walk(base: &Path, root: &Path, out: &mut BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(root).unwrap() {
            let path = entry.unwrap().path();
            let kind = fs::symlink_metadata(&path).unwrap().file_type();
            if kind.is_dir() {
                walk(base, &path, out);
            } else if kind.is_file() {
                out.insert(
                    path.strip_prefix(base).unwrap().into(),
                    fs::read(path).unwrap(),
                );
            }
        }
    }
    let mut result = BTreeMap::new();
    walk(root, root, &mut result);
    result
}
pub async fn heads(client: &Client, vault: &str) -> Value {
    let frame = json!({"version":1,"data":{"vault":vault}}).to_string();
    serde_json::from_str(
        &client
            .read_history(HistoryMethod::Heads, frame)
            .await
            .unwrap(),
    )
    .unwrap()
}
pub fn services(root: &Path) -> VaultServices {
    VaultServices::new_with_backup(
        &root.join("profile"),
        &root.join("history"),
        Arc::new(Mutex::new(())),
    )
    .unwrap()
}
