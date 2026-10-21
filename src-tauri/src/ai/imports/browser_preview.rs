use super::{
    BrowserSelection, CapturedSession, Harness, ImportSource, PreviewPage,
    browser_types::IndexedSession, catalog::Selection, codex_preview::CodexPreview, digest, hex,
    invalid, local_projection::LocalProjection, privacy::Privacy,
};
use lapis_ai_capture::sessions::{JsonlSnapshot, OpenCodeDatabase, OpenCodeSnapshot};
use std::{io, path::Path};
enum Reader {
    Codex(Box<CodexPreview>),
    Cursor(JsonlSnapshot),
    OpenCode(OpenCodeSnapshot),
}
pub struct BrowserPreview {
    reader: Reader,
    row: IndexedSession,
    privacy: Option<Privacy>,
    projection: LocalProjection,
    failed: bool,
    sent: std::collections::HashMap<String, super::CapturedEntry>,
}
impl BrowserPreview {
    pub fn open(
        selection: BrowserSelection,
        home: &Path,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<Self> {
        check()?;
        let mut row = selection.row;
        let (reader, privacy) = match row.kind {
            Harness::Codex => {
                let profile = if row.profile == "codex-desktop-0.159.2" {
                    jj_store_capture::profile::CaptureProfile::CodexDesktopJsonlV1
                } else {
                    jj_store_capture::profile::CaptureProfile::CodexCliJsonlV1
                };
                (
                    Reader::Codex(Box::new(CodexPreview::open(
                        &Selection {
                            candidate: selection.candidate.ok_or_else(invalid)?,
                            profile,
                            updated_at: row.updated_at.clone(),
                        },
                        home,
                        None,
                        Some(&selection.privacy),
                        Some((&row.native_id, &row.directory)),
                        check,
                    )?)),
                    None,
                )
            }
            Harness::Cursor => (
                Reader::Cursor(
                    JsonlSnapshot::open(selection.candidate.ok_or_else(invalid)?, 64 * 1024 * 1024)
                        .map_err(|_| invalid())?,
                ),
                Some(selection.privacy.scoped(&row.directory)?),
            ),
            Harness::Opencode => {
                let snapshot = OpenCodeDatabase::open(&row.path)
                    .map_err(|_| invalid())?
                    .snapshot(&row.native_id)
                    .map_err(|_| invalid())?;
                let privacy = selection.privacy.scoped(&snapshot.metadata.directory)?;
                if snapshot.metadata.directory != row.directory {
                    return Err(invalid());
                }
                row.created_at =
                    chrono::DateTime::from_timestamp_millis(snapshot.metadata.created_at)
                        .ok_or_else(invalid)?
                        .to_rfc3339();
                (Reader::OpenCode(snapshot), Some(privacy))
            }
        };
        Ok(Self {
            reader,
            row,
            privacy,
            projection: LocalProjection::default(),
            failed: false,
            sent: std::collections::HashMap::new(),
        })
    }
    pub fn next(&mut self, check: &dyn Fn() -> io::Result<()>) -> io::Result<PreviewPage> {
        if self.failed {
            return Err(invalid());
        }
        let result = self.read(check);
        if result.is_err() {
            self.failed = true;
        }
        result.map(|mut page| {
            if page.capture.is_some() {
                page.entries.clear();
                page.order.clear();
                self.sent.clear();
                return page;
            }
            let mut changed = Vec::new();
            let mut order = Vec::new();
            for entry in page.entries {
                let id = match &entry {
                    super::CapturedEntry::Message { id, .. }
                    | super::CapturedEntry::Tool { id, .. }
                    | super::CapturedEntry::Notice { id, .. } => id.clone(),
                };
                order.push(id.clone());
                if self.sent.get(&id) != Some(&entry) {
                    changed.push(entry.clone());
                }
                self.sent.insert(id, entry);
            }
            let retained: std::collections::HashSet<_> = order.iter().map(String::as_str).collect();
            self.sent.retain(|id, _| retained.contains(id.as_str()));
            page.entries = changed;
            page.order = order;
            page
        })
    }
    fn read(&mut self, check: &dyn Fn() -> io::Result<()>) -> io::Result<PreviewPage> {
        check()?;
        let (complete, progress, sha256) = match &mut self.reader {
            Reader::Codex(reader) => return reader.next(check),
            Reader::Cursor(reader) => {
                let page = reader
                    .next(128, &|| check().map_err(Into::into))
                    .map_err(|_| invalid())?;
                let privacy = self.privacy.as_ref().ok_or_else(invalid)?;
                for value in page.records {
                    check()?;
                    self.projection.cursor(value, &privacy.sanitizer)?;
                }
                if page.complete {
                    let fence = reader
                        .next(1, &|| check().map_err(Into::into))
                        .map_err(|_| invalid())?;
                    if !fence.complete || fence.sha256 != page.sha256 {
                        return Err(invalid());
                    }
                }
                (
                    page.complete,
                    ((page.bytes * 100) / page.total_bytes.max(1)) as u32,
                    page.sha256,
                )
            }
            Reader::OpenCode(reader) => {
                let page = reader
                    .next(16, &|| check().map_err(Into::into))
                    .map_err(|_| invalid())?;
                let privacy = self.privacy.as_ref().ok_or_else(invalid)?;
                for value in page.messages {
                    check()?;
                    self.projection.opencode(value, &privacy.sanitizer)?;
                }
                (
                    page.complete,
                    ((page.read_messages * 100) / page.total_messages.max(1)) as u32,
                    page.sha256,
                )
            }
        };
        check()?;
        let entries = self.projection.entries(complete);
        let capture = complete.then(|| CapturedSession {
            version: 1,
            source: ImportSource {
                kind: self.row.kind.kind(),
                profile: if self.row.kind == Harness::Cursor {
                    "cursor-jsonl-v1"
                } else {
                    "opencode-sqlite-v1"
                }
                .into(),
                session_key: hex(&digest(
                    b"lapis-notes/import-session/v1\0",
                    format!("{}/{}", self.row.kind.kind(), self.row.native_id).as_bytes(),
                )),
                snapshot_key: hex(&sha256),
            },
            created_at: if self.row.kind == Harness::Cursor {
                super::projection::FALLBACK_TIME.into()
            } else {
                self.row.created_at.clone()
            },
            entries: entries.clone(),
        });
        if serde_json::to_vec(&capture).map_err(|_| invalid())?.len() > 4 * 1024 * 1024 {
            return Err(invalid());
        }
        Ok(PreviewPage {
            entries,
            order: vec![],
            progress: if complete { 100 } else { progress.min(99) },
            capture,
        })
    }
}
