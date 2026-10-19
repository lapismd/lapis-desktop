//! Immutable observed snapshots. Confirmation is not a durable reader cursor ACK.
mod selection;
use super::{CapturedSession, discover, invalid, preview_for_workspace};
use selection::{Version, inspect};
use serde::Serialize;
use std::{
    collections::{HashMap, HashSet, VecDeque},
    io,
    path::{Path, PathBuf},
};
use uuid::Uuid;
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum CaptureRead {
    Idle {
        eligible: usize,
        deferred: usize,
    },
    Snapshot {
        delivery: Uuid,
        capture: CapturedSession,
        deferred: usize,
    },
}
struct Pending {
    delivery: Uuid,
    path: PathBuf,
    version: Version,
    capture: CapturedSession,
    deferred: usize,
}
#[derive(Default)]
pub struct CaptureQueue {
    saved: HashMap<PathBuf, Version>,
    pending: Option<Pending>,
    confirmed: VecDeque<Uuid>,
}
impl CaptureQueue {
    pub fn next(
        &mut self,
        home: &Path,
        workspace: &Path,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<CaptureRead> {
        check()?;
        if let Some(pending) = &self.pending {
            return Ok(pending.read());
        }
        let workspace = workspace.canonicalize().map_err(|_| super::denied())?;
        let catalog = discover(home, check)?;
        let present: HashSet<_> = catalog
            .0
            .values()
            .map(|s| s.candidate.path().to_path_buf())
            .collect();
        self.saved.retain(|path, _| present.contains(path));
        let mut selections: Vec<_> = catalog.0.iter().collect();
        selections.sort_by(|a, b| {
            b.1.updated_at
                .cmp(&a.1.updated_at)
                .then(a.1.candidate.path().cmp(b.1.candidate.path()))
        });
        let (mut eligible, mut deferred) = (0, 0);
        let mut sessions = HashSet::new();
        for (selector, selection) in selections {
            check()?;
            let version = match inspect(selection, &workspace) {
                Ok(Some(version)) => version,
                Ok(None) => continue,
                Err(error) if error.kind() == io::ErrorKind::InvalidData => {
                    deferred += 1;
                    continue;
                }
                Err(error) => return Err(error),
            };
            // Read only the newest currently observed file for each native session.
            if !sessions.insert(version.session.clone()) {
                continue;
            }
            eligible += 1;
            let path = selection.candidate.path().to_path_buf();
            if self.saved.get(&path) == Some(&version) {
                continue;
            }
            let capture = match preview_for_workspace(&catalog, selector, home, &workspace, check) {
                Ok(capture) => capture,
                Err(error) if error.kind() == io::ErrorKind::InvalidData || is_outside(&error) => {
                    deferred += 1;
                    continue;
                }
                Err(error) => return Err(error),
            };
            check()?;
            let after = match inspect(selection, &workspace) {
                Ok(Some(after)) => after,
                Ok(None) => {
                    deferred += 1;
                    continue;
                }
                Err(error) if error.kind() == io::ErrorKind::InvalidData => {
                    deferred += 1;
                    continue;
                }
                Err(error) => return Err(error),
            };
            if after != version {
                deferred += 1;
                continue;
            }
            let pending = Pending {
                delivery: Uuid::new_v4(),
                path,
                version,
                capture,
                deferred,
            };
            let read = pending.read();
            self.pending = Some(pending);
            return Ok(read);
        }
        check()?;
        Ok(CaptureRead::Idle { eligible, deferred })
    }
    pub fn confirm(
        &mut self,
        delivery: Uuid,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<()> {
        check()?;
        // A lost reply may be retried while a newer snapshot is pending.
        if self.confirmed.contains(&delivery) {
            return Ok(());
        }
        let pending = self.pending.as_ref().ok_or_else(super::denied)?;
        if pending.delivery != delivery {
            return Err(super::denied());
        }
        let pending = self.pending.take().ok_or_else(invalid)?;
        self.saved.insert(pending.path, pending.version);
        self.confirmed.push_back(delivery);
        if self.confirmed.len() > 256 {
            self.confirmed.pop_front();
        }
        Ok(())
    }
}
impl Pending {
    fn read(&self) -> CaptureRead {
        CaptureRead::Snapshot {
            delivery: self.delivery,
            capture: self.capture.clone(),
            deferred: self.deferred,
        }
    }
}
#[derive(Debug)]
struct OutsideWorkspace;
impl std::fmt::Display for OutsideWorkspace {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Source context is outside the capture vault")
    }
}
impl std::error::Error for OutsideWorkspace {}
pub(super) fn outside() -> io::Error {
    io::Error::new(io::ErrorKind::PermissionDenied, OutsideWorkspace)
}
fn is_outside(error: &io::Error) -> bool {
    error.get_ref().is_some_and(|e| e.is::<OutsideWorkspace>())
}
pub(super) fn admit_directory(workspace: Option<&Path>, directory: &Path) -> io::Result<()> {
    if let Some(root) = workspace {
        let observed = directory.canonicalize().map_err(|_| outside())?;
        if !observed.starts_with(root) {
            return Err(outside());
        }
    }
    Ok(())
}
