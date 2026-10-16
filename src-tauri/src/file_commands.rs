use crate::native_host::{NativeError, NativeHost, access};
use lapis_desktop::vault::WriteOptions;
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
#[serde(
    tag = "operation",
    rename_all = "kebab-case",
    deny_unknown_fields,
    rename_all_fields = "camelCase"
)]
pub enum FileRequest {
    Rename {
        path: String,
        new_path: String,
    },
    Copy {
        path: String,
        new_path: String,
    },
    Remove {
        path: String,
    },
    Rmdir {
        path: String,
        #[serde(default)]
        recursive: bool,
    },
    Stat {
        path: String,
    },
    Exists {
        path: String,
    },
    List {
        path: String,
    },
    ReadText {
        path: String,
    },
    ReadBinary {
        path: String,
    },
    ReadRange {
        path: String,
        offset: u64,
        length: usize,
    },
    WriteText {
        path: String,
        data: String,
        #[serde(default)]
        options: WriteOptions,
    },
    WriteTextIfUnchanged {
        path: String,
        data: String,
        expected: Option<String>,
        #[serde(default)]
        options: WriteOptions,
    },
    WriteBinary {
        path: String,
        data: Vec<u8>,
        #[serde(default)]
        options: WriteOptions,
    },
    AppendText {
        path: String,
        data: String,
        #[serde(default)]
        options: WriteOptions,
    },
    Mkdir {
        path: String,
        #[serde(default)]
        recursive: bool,
    },
}

#[tauri::command]
pub async fn vault_fs(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    request: FileRequest,
) -> Result<Value, NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.with_files(|manager| {
            let root = manager.vaults.get(&session_id)?;
            Ok(match request {
                FileRequest::Rename { path, new_path } => {
                    root.rename(&path, &new_path)?;
                    Value::Null
                }
                FileRequest::Copy { path, new_path } => {
                    root.copy_file(&path, &new_path)?;
                    Value::Null
                }
                FileRequest::Remove { path } => {
                    root.remove_file(&path)?;
                    Value::Null
                }
                FileRequest::Rmdir { path, recursive } => {
                    root.remove_directory(&path, recursive)?;
                    Value::Null
                }
                FileRequest::Stat { path } => json!(root.stat(&path)?),
                FileRequest::Exists { path } => json!(root.stat(&path)?.is_some()),
                FileRequest::List { path } => json!(root.list(&path)?),
                FileRequest::ReadText { path } => json!(root.read_text(&path)?),
                FileRequest::ReadBinary { path } => json!(root.read(&path)?),
                FileRequest::ReadRange {
                    path,
                    offset,
                    length,
                } => json!(root.read_range(&path, offset, length)?),
                FileRequest::WriteText {
                    path,
                    data,
                    options,
                } => {
                    root.write(&path, data.as_bytes(), &options)?;
                    Value::Null
                }
                FileRequest::WriteTextIfUnchanged {
                    path,
                    data,
                    expected,
                    options,
                } => {
                    root.write_if_unchanged(
                        &path,
                        data.as_bytes(),
                        expected.as_deref().map(str::as_bytes),
                        &options,
                    )?;
                    Value::Null
                }
                FileRequest::WriteBinary {
                    path,
                    data,
                    options,
                } => {
                    root.write(&path, &data, &options)?;
                    Value::Null
                }
                FileRequest::AppendText {
                    path,
                    data,
                    options,
                } => {
                    root.append(&path, &data, &options)?;
                    Value::Null
                }
                FileRequest::Mkdir { path, recursive } => {
                    root.mkdir(&path, recursive)?;
                    Value::Null
                }
            })
        })
    })
    .await
}
