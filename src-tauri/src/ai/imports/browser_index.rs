use super::{browser_types::*, denied, index_cache, index_scan::Scanner, invalid, privacy};
use lapis_ai_capture::discovery::CodexSourceCandidate;
use std::{
    collections::{HashMap, HashSet},
    io,
    path::{Path, PathBuf},
};
struct Scan {
    reader: Scanner,
    seen: HashSet<String>,
    limited: bool,
}
pub struct ImportIndex {
    home: PathBuf,
    cache: PathBuf,
    loaded: bool,
    rows: HashMap<String, IndexedSession>,
    scans: HashMap<Harness, Scan>,
    complete: HashSet<Harness>,
    limited: HashSet<Harness>,
    privacy: Option<privacy::Privacy>,
}
pub struct BrowserSelection {
    pub(super) row: IndexedSession,
    pub(super) candidate: Option<CodexSourceCandidate>,
    pub(super) privacy: privacy::Privacy,
}
impl ImportIndex {
    pub fn new(home: PathBuf, cache: PathBuf) -> Self {
        Self {
            home,
            cache,
            loaded: false,
            rows: HashMap::new(),
            scans: HashMap::new(),
            complete: HashSet::new(),
            limited: HashSet::new(),
            privacy: None,
        }
    }
    fn privacy(&mut self) -> io::Result<privacy::Privacy> {
        if self.privacy.is_none() {
            self.privacy = Some(privacy::Privacy::new(&self.home, &self.home)?);
        }
        Ok(self.privacy.as_ref().ok_or_else(invalid)?.clone())
    }
    fn load(&mut self) {
        if self.loaded {
            return;
        }
        self.loaded = true;
        self.rows = index_cache::read(&self.cache, &self.home)
            .into_iter()
            .map(|r| (r.selector(), r))
            .collect();
    }
    pub fn folders(
        &mut self,
        kind: Harness,
        refresh: bool,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<FolderPage> {
        check()?;
        self.load();
        if refresh {
            self.scans.remove(&kind);
            self.complete.remove(&kind);
            self.limited.remove(&kind);
        }
        if !self.complete.contains(&kind) {
            let first = !self.scans.contains_key(&kind);
            if first {
                self.scans.insert(
                    kind,
                    Scan {
                        reader: Scanner::new(
                            &self.home,
                            kind,
                            self.rows.values().cloned().collect(),
                        )?,
                        seen: HashSet::new(),
                        limited: false,
                    },
                );
            }
            // Warm metadata renders before reconciliation IO; no body parser runs here.
            if !first || !self.rows.values().any(|r| r.kind == kind) {
                let privacy = self.privacy()?;
                let scan = self.scans.get_mut(&kind).ok_or_else(invalid)?;
                let (rows, complete, limited) = scan.reader.step(&self.home, kind, check)?;
                scan.limited |= limited;
                for mut row in rows {
                    row.title = privacy::label(&privacy.sanitizer, &row.title, "Local session");
                    let id = row.selector();
                    scan.seen.insert(id.clone());
                    self.rows.insert(id, row);
                }
                if self.rows.len() > 8192 {
                    scan.limited = true;
                }
                if complete || scan.limited {
                    let scan = self.scans.remove(&kind).ok_or_else(invalid)?;
                    if !scan.limited {
                        self.rows
                            .retain(|id, row| row.kind != kind || scan.seen.contains(id));
                    } else {
                        self.limited.insert(kind);
                    }
                    self.complete.insert(kind);
                    let mut entries: Vec<_> = self.rows.values().cloned().collect();
                    entries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                    entries.truncate(8192);
                    self.rows = entries.iter().cloned().map(|r| (r.selector(), r)).collect();
                    check()?;
                    index_cache::write(&self.cache, &self.home, entries)?;
                }
            }
        }
        let privacy = self.privacy()?;
        let mut groups = HashMap::<String, ImportFolder>::new();
        for row in self.rows.values().filter(|r| r.kind == kind) {
            let id = row.folder();
            groups
                .entry(id.clone())
                .and_modify(|f| f.count += 1)
                .or_insert_with(|| ImportFolder {
                    selector: id,
                    label: privacy::label(
                        &privacy.sanitizer,
                        &row.location
                            .split('/')
                            .filter(|s| !s.is_empty())
                            .collect::<Vec<_>>()
                            .into_iter()
                            .rev()
                            .take(2)
                            .collect::<Vec<_>>()
                            .into_iter()
                            .rev()
                            .collect::<Vec<_>>()
                            .join("/"),
                        "Local folder",
                    ),
                    location: privacy::label(&privacy.sanitizer, &row.location, "Local folder"),
                    count: 1,
                });
        }
        let mut folders: Vec<_> = groups.into_values().collect();
        folders.sort_by(|a, b| a.label.cmp(&b.label));
        check()?;
        Ok(FolderPage {
            indexed: self.rows.values().filter(|r| r.kind == kind).count(),
            folders,
            complete: self.complete.contains(&kind),
            limited: self.limited.contains(&kind),
        })
    }
    pub fn sessions(
        &mut self,
        folder: &str,
        after: Option<&str>,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<SessionPage> {
        check()?;
        self.load();
        if !self.rows.values().any(|r| r.folder() == folder) {
            return Err(denied());
        }
        let mut rows: Vec<_> = self
            .rows
            .values()
            .filter(|r| r.folder() == folder)
            .cloned()
            .collect();
        rows.sort_by(|a, b| {
            b.updated_at
                .cmp(&a.updated_at)
                .then(a.selector().cmp(&b.selector()))
        });
        let start = match after {
            None => 0,
            Some(id) => {
                rows.iter()
                    .position(|r| r.selector() == id)
                    .ok_or_else(denied)?
                    + 1
            }
        };
        let total = rows.len();
        let privacy = self.privacy()?;
        let page: Vec<_> = rows.into_iter().skip(start).take(128).collect();
        let next = if start + 128 < total {
            page.last().map(IndexedSession::selector)
        } else {
            None
        };
        let mut result = Vec::new();
        for row in page {
            check()?;
            let row = if row.kind != Harness::Opencode {
                match self.select(&row.selector(), check) {
                    Ok(selection) => selection.row,
                    Err(_) => continue,
                }
            } else {
                row
            };
            result.push(BrowserSession {
                selector: row.selector(),
                folder: row.folder(),
                kind: row.kind,
                title: privacy::label(&privacy.sanitizer, &row.title, "Local session"),
                profile: row.profile,
                updated_at: row.updated_at,
                bytes: if row.kind == Harness::Opencode {
                    0
                } else {
                    row.stamp.bytes
                },
            });
        }
        check()?;
        Ok(SessionPage {
            rows: result,
            next,
            total,
        })
    }
    pub fn select(
        &mut self,
        selector: &str,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<BrowserSelection> {
        check()?;
        self.load();
        let row = self.rows.get(selector).cloned().ok_or_else(denied)?;
        let (row, candidate) = super::index_selection::checked(&self.home, row)?;
        self.rows.insert(selector.to_owned(), row.clone());
        check()?;
        Ok(BrowserSelection {
            row,
            candidate,
            privacy: self.privacy()?,
        })
    }
    pub fn home(&self) -> &Path {
        &self.home
    }
    pub fn cancel_scans(&mut self) {
        self.scans.clear();
    }
}
