use super::{
    browser_types::{Harness, IndexedSession, Stamp},
    invalid, timestamp,
};
use lapis_ai_capture::{
    SourceProfile,
    discovery::{ApprovedCodexRoot, CodexDirectoryScanner, CodexSourceCandidate},
    sessions::OpenCodeDatabase,
    source_file::inspect_codex,
};
use std::{
    collections::HashMap,
    io,
    path::{Path, PathBuf},
    time::{Duration, UNIX_EPOCH},
};
pub(super) enum Scanner {
    Files {
        scanner: CodexDirectoryScanner,
        examined: usize,
        workspaces: HashMap<String, PathBuf>,
        cached: HashMap<PathBuf, IndexedSession>,
    },
    Database {
        after: String,
    },
    Missing,
}
pub(super) fn root(home: &Path, kind: Harness) -> PathBuf {
    home.join(match kind {
        Harness::Codex => ".codex/sessions",
        Harness::Cursor => ".cursor/projects",
        Harness::Opencode => ".local/share/opencode",
    })
}
fn cursor_workspaces(home: &Path) -> HashMap<String, PathBuf> {
    let mut result = HashMap::new();
    let Ok(entries) =
        std::fs::read_dir(home.join("Library/Application Support/Cursor/User/workspaceStorage"))
    else {
        return result;
    };
    for entry in entries.take(1024).flatten() {
        if !entry
            .file_type()
            .is_ok_and(|t| t.is_dir() && !t.is_symlink())
        {
            continue;
        }
        let path = entry.path().join("workspace.json");
        let Ok(m) = std::fs::symlink_metadata(&path) else {
            continue;
        };
        if !m.is_file() || m.file_type().is_symlink() || m.len() > 16 * 1024 {
            continue;
        }
        let Some(directory) = std::fs::read(&path)
            .ok()
            .and_then(|b| serde_json::from_slice::<serde_json::Value>(&b).ok())
            .and_then(|v| v["folder"].as_str().and_then(|s| url::Url::parse(s).ok()))
            .and_then(|u| u.to_file_path().ok())
        else {
            continue;
        };
        let key = directory
            .to_string_lossy()
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .trim_matches('-')
            .to_owned();
        result.insert(key, directory);
    }
    result
}
impl Scanner {
    pub fn new(home: &Path, kind: Harness, existing: Vec<IndexedSession>) -> io::Result<Self> {
        let path = root(home, kind);
        if kind == Harness::Opencode {
            return if path.join("opencode.db").try_exists()? {
                Ok(Self::Database {
                    after: String::new(),
                })
            } else {
                Ok(Self::Missing)
            };
        }
        let Some(root) = ApprovedCodexRoot::open(&path).map_err(|_| invalid())? else {
            return Ok(Self::Missing);
        };
        let scanner = if kind == Harness::Cursor {
            CodexDirectoryScanner::cursor(root)
        } else {
            CodexDirectoryScanner::new(root)
        }
        .map_err(|_| invalid())?;
        Ok(Self::Files {
            scanner,
            examined: 0,
            workspaces: if kind == Harness::Cursor {
                cursor_workspaces(home)
            } else {
                HashMap::new()
            },
            cached: existing
                .into_iter()
                .filter(|r| r.kind == kind)
                .map(|r| (r.path.clone(), r))
                .collect(),
        })
    }
    pub fn step(
        &mut self,
        home: &Path,
        kind: Harness,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<(Vec<IndexedSession>, bool, bool)> {
        check()?;
        match self {
            Self::Missing => Ok((vec![], true, false)),
            Self::Database { after } => {
                let path = root(home, kind).join("opencode.db");
                let database = OpenCodeDatabase::open(&path).map_err(|_| invalid())?;
                let rows = database.sessions(after, 64).map_err(|_| invalid())?;
                let complete = rows.len() < 64;
                let mut result = Vec::new();
                for row in rows {
                    check()?;
                    *after = row.id.clone();
                    let updated = chrono::DateTime::from_timestamp_millis(row.updated_at)
                        .ok_or_else(invalid)?
                        .to_rfc3339();
                    let created = chrono::DateTime::from_timestamp_millis(row.created_at)
                        .ok_or_else(invalid)?
                        .to_rfc3339();
                    result.push(IndexedSession {
                        kind,
                        path: path.clone(),
                        native_id: row.id,
                        directory: row.directory.clone(),
                        group: row.directory.to_string_lossy().into(),
                        location: display(home, &row.directory),
                        title: row.title,
                        profile: "opencode-sqlite-v1".into(),
                        updated_at: updated,
                        created_at: created,
                        stamp: Stamp::read(&path)?,
                    });
                }
                Ok((result, complete, false))
            }
            Self::Files {
                scanner,
                examined,
                workspaces,
                cached,
            } => {
                let page = scanner.step(1024, 32).map_err(|_| invalid())?;
                *examined += page.entries_examined;
                if page.unavailable_entries > 0 {
                    return Err(invalid());
                }
                let mut result = Vec::new();
                for candidate in page.candidates {
                    check()?;
                    if kind == Harness::Codex
                        && let Some(previous) = cached.get(candidate.path())
                        && Stamp::read(candidate.path()).is_ok_and(|stamp| stamp == previous.stamp)
                    {
                        result.push(previous.clone());
                    } else if let Ok(Some(entry)) = inspect(home, kind, &candidate, workspaces) {
                        result.push(entry);
                    }
                }
                let limited = *examined >= 131072 || page.depth_limited > 0;
                Ok((result, page.complete || limited, limited))
            }
        }
    }
}
pub(super) fn display(home: &Path, path: &Path) -> String {
    match path.strip_prefix(home) {
        Ok(relative) => format!("~/{}", relative.display()),
        Err(_) => format!(
            "Local/{}",
            path.file_name().unwrap_or_default().to_string_lossy()
        ),
    }
}
pub(super) fn inspect(
    home: &Path,
    kind: Harness,
    candidate: &CodexSourceCandidate,
    workspaces: &HashMap<String, PathBuf>,
) -> io::Result<Option<IndexedSession>> {
    let stamp = Stamp::read(candidate.path())?;
    if stamp.bytes > 64 * 1024 * 1024 {
        return Ok(None);
    }
    let (native_id, directory, group, location, profile) = if kind == Harness::Codex {
        let Some((header, profile)) = [
            SourceProfile::CodexCliJsonlV1,
            SourceProfile::CodexDesktopJsonlV1,
        ]
        .into_iter()
        .find_map(|profile| {
            inspect_codex(profile, candidate.path(), Some(candidate.identity()))
                .ok()
                .map(|(_, h, _)| (h, profile))
        }) else {
            return Ok(None);
        };
        let label = display(home, &header.directory);
        let group = header.directory.to_string_lossy().into_owned();
        (
            header.session,
            header.directory,
            group,
            label,
            if profile == SourceProfile::CodexDesktopJsonlV1 {
                "codex-desktop-0.159.2"
            } else {
                "codex-cli-0.156.1"
            },
        )
    } else {
        let path = candidate
            .path()
            .strip_prefix(root(home, kind))
            .map_err(|_| invalid())?;
        let project = path
            .components()
            .next()
            .ok_or_else(invalid)?
            .as_os_str()
            .to_string_lossy();
        let native = candidate
            .path()
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(invalid)?;
        if !lapis_ai_capture::source_file::uuid_label(native) {
            return Ok(None);
        }
        let directory = workspaces
            .get(project.as_ref())
            .cloned()
            .unwrap_or_else(|| home.to_owned());
        let home_label = home
            .to_string_lossy()
            .replace('/', "-")
            .trim_matches('-')
            .to_owned();
        let location = workspaces
            .get(project.as_ref())
            .map(|p| display(home, p))
            .unwrap_or_else(|| {
                project
                    .strip_prefix(&home_label)
                    .map(|p| format!("~/{}", p.trim_start_matches('-')))
                    .unwrap_or_else(|| format!("Local/{project}"))
            });
        (
            native.into(),
            directory,
            project.into_owned(),
            location,
            "cursor-jsonl-v1",
        )
    };
    let updated_at = timestamp(
        UNIX_EPOCH + Duration::from_nanos(u64::try_from(stamp.modified).map_err(|_| invalid())?),
    )?;
    Ok(Some(IndexedSession {
        kind,
        path: candidate.path().into(),
        native_id,
        directory,
        group,
        location,
        title: format!(
            "{} session · {}",
            kind.label(),
            updated_at[..16].replace('T', " ")
        ),
        profile: profile.into(),
        created_at: updated_at.clone(),
        updated_at,
        stamp,
    }))
}
