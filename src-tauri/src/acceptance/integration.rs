//! Passive native receipts; absent from ordinary bundles.
use serde::Serialize;
use std::{fs::OpenOptions, io::Write, path::PathBuf};
use tauri::menu::MenuItemKind;

#[derive(Serialize)]
pub struct MenuEntry {
    id: String,
    text: String,
    enabled: Option<bool>,
    native: bool,
    children: Vec<MenuEntry>,
}

pub fn menus(app: &tauri::AppHandle) -> Result<Vec<MenuEntry>, String> {
    fn entry(item: MenuItemKind<tauri::Wry>) -> tauri::Result<MenuEntry> {
        let id = item.id().as_ref().to_string();
        let (text, enabled, native, children) = match item {
            MenuItemKind::Submenu(item) => (
                item.text()?,
                Some(item.is_enabled()?),
                false,
                item.items()?
                    .into_iter()
                    .map(entry)
                    .collect::<tauri::Result<Vec<_>>>()?,
            ),
            MenuItemKind::MenuItem(item) => (item.text()?, Some(item.is_enabled()?), false, vec![]),
            MenuItemKind::Predefined(item) => (item.text()?, None, true, vec![]),
            MenuItemKind::Check(item) => (item.text()?, Some(item.is_enabled()?), false, vec![]),
            MenuItemKind::Icon(item) => (item.text()?, Some(item.is_enabled()?), false, vec![]),
        };
        Ok(MenuEntry {
            id,
            text,
            enabled,
            native,
            children,
        })
    }
    app.menu()
        .ok_or("Native application menu is unavailable".to_string())?
        .items()
        .and_then(|items| items.into_iter().map(entry).collect())
        .map_err(|error| error.to_string())
}

pub fn record(kind: &str, value: &str) {
    let result = (|| -> Result<(), Box<dyn std::error::Error>> {
        let root = PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?);
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(root.join("integration-actions.jsonl"))?;
        if file.metadata()?.len() > 128 * 1024 {
            return Err("Integration receipts are full".into());
        }
        serde_json::to_writer(
            &mut file,
            &serde_json::json!({ "kind": kind, "value": value }),
        )?;
        writeln!(file)?;
        file.sync_all()?;
        Ok(())
    })();
    if let Err(error) = result {
        eprintln!("Integration receipt unavailable: {error}");
    }
}
