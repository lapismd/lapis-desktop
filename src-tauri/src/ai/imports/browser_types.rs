use super::{CapturedEntry, CapturedSession, digest, hex};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Harness {
    Codex,
    Cursor,
    Opencode,
}
impl Harness {
    pub fn label(self) -> &'static str {
        match self {
            Self::Codex => "Codex",
            Self::Cursor => "Cursor",
            Self::Opencode => "OpenCode",
        }
    }
    pub fn kind(self) -> &'static str {
        match self {
            Self::Codex => "codex",
            Self::Cursor => "cursor",
            Self::Opencode => "opencode",
        }
    }
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportFolder {
    pub selector: String,
    pub label: String,
    pub location: String,
    pub count: usize,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderPage {
    pub folders: Vec<ImportFolder>,
    pub indexed: usize,
    pub complete: bool,
    pub limited: bool,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserSession {
    pub selector: String,
    pub folder: String,
    pub kind: Harness,
    pub title: String,
    pub profile: String,
    pub updated_at: String,
    pub bytes: u64,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionPage {
    pub rows: Vec<BrowserSession>,
    pub next: Option<String>,
    pub total: usize,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewPage {
    pub entries: Vec<CapturedEntry>,
    pub order: Vec<String>,
    pub progress: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capture: Option<CapturedSession>,
}

/// Private metadata cache. Never serialize these native values to IPC.
#[derive(Clone, Serialize, Deserialize)]
pub(super) struct IndexedSession {
    pub kind: Harness,
    pub path: PathBuf,
    pub native_id: String,
    pub directory: PathBuf,
    pub group: String,
    pub location: String,
    pub title: String,
    pub profile: String,
    pub updated_at: String,
    pub created_at: String,
    pub stamp: Stamp,
}
impl IndexedSession {
    pub fn selector(&self) -> String {
        hex(&digest(
            b"lapis/import-selection/v1\0",
            format!(
                "{}/{}/{}",
                self.kind.kind(),
                self.path.display(),
                self.native_id
            )
            .as_bytes(),
        ))
    }
    pub fn folder(&self) -> String {
        hex(&digest(
            b"lapis/import-folder/v1\0",
            format!("{}/{}", self.kind.kind(), self.group).as_bytes(),
        ))
    }
}
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub(super) struct Stamp {
    pub bytes: u64,
    pub modified: u128,
    pub device: u64,
    pub inode: u64,
}
impl Stamp {
    pub fn read(path: &std::path::Path) -> std::io::Result<Self> {
        use std::os::unix::fs::MetadataExt;
        let m = std::fs::symlink_metadata(path)?;
        if !m.is_file() || m.file_type().is_symlink() {
            return Err(super::invalid());
        }
        Ok(Self {
            bytes: m.len(),
            modified: m
                .modified()?
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|_| super::invalid())?
                .as_nanos(),
            device: m.dev(),
            inode: m.ino(),
        })
    }
}
