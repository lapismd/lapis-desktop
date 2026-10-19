use super::{SourceRow, invalid, timestamp};
use jj_agent::SourceInstanceId;
use jj_store_capture::{
    codex_discovery::{ApprovedCodexRoot, CodexDirectoryScanner, CodexSourceCandidate},
    codex_transcript::CodexSnapshotReader,
    profile::CaptureProfile,
};
use std::{collections::HashMap, io, path::Path, time::SystemTime};
#[derive(Clone, Default)]
pub struct Catalog(pub(super) HashMap<String, Selection>);
#[derive(Clone)]
pub(super) struct Selection {
    pub candidate: CodexSourceCandidate,
    pub profile: CaptureProfile,
    pub updated_at: String,
}
impl Catalog {
    pub fn rows(&self) -> Vec<SourceRow> {
        let mut rows: Vec<_> = self
            .0
            .iter()
            .map(|(selector, selection)| {
                let (label, profile) = profile(selection.profile);
                SourceRow {
                    selector: selector.clone(),
                    title: format!("{label} session"),
                    profile: profile.into(),
                    updated_at: selection.updated_at.clone(),
                }
            })
            .collect();
        rows.sort_by(|a, b| {
            b.updated_at
                .cmp(&a.updated_at)
                .then(a.selector.cmp(&b.selector))
        });
        rows
    }
}
pub(super) fn profile(profile: CaptureProfile) -> (&'static str, &'static str) {
    if profile == CaptureProfile::CodexDesktopJsonlV1 {
        ("Codex Desktop", "codex-desktop-0.159.2")
    } else {
        ("Codex CLI", "codex-cli-0.156.1")
    }
}
/// Bounded metadata walk, retaining recent candidates rather than filesystem order.
pub fn discover(home: &Path, check: &dyn Fn() -> io::Result<()>) -> io::Result<Catalog> {
    check()?;
    let Some(root) =
        ApprovedCodexRoot::open(&home.join(".codex/sessions")).map_err(|_| invalid())?
    else {
        return Ok(Catalog::default());
    };
    let mut scanner = CodexDirectoryScanner::new(root).map_err(|_| invalid())?;
    let mut recent = Vec::<(SystemTime, CodexSourceCandidate)>::new();
    let mut total = 0;
    loop {
        check()?;
        let step = scanner.step(4096, 256).map_err(|_| invalid())?;
        total += step.entries_examined;
        if total > 131_072 || step.unavailable_entries > 0 || step.depth_limited > 0 {
            return Err(invalid());
        }
        for candidate in step.candidates {
            check()?;
            let metadata = std::fs::symlink_metadata(candidate.path()).map_err(|_| invalid())?;
            if metadata.len() <= 64 * 1024 * 1024 {
                recent.push((metadata.modified().map_err(|_| invalid())?, candidate));
            }
        }
        recent.sort_by(|a, b| b.0.cmp(&a.0).then(a.1.path().cmp(b.1.path())));
        recent.truncate(1024);
        if step.complete {
            break;
        }
    }
    let mut catalog = Catalog::default();
    for (modified, candidate) in recent {
        check()?;
        let selected = [
            CaptureProfile::CodexCliJsonlV1,
            CaptureProfile::CodexDesktopJsonlV1,
        ]
        .into_iter()
        .find(|profile| {
            CodexSnapshotReader::open(
                *profile,
                candidate.clone(),
                SourceInstanceId::new([1; 16]),
                64 * 1024 * 1024,
            )
            .is_ok()
        });
        if let Some(profile) = selected {
            catalog.0.insert(
                uuid::Uuid::new_v4().to_string(),
                Selection {
                    candidate,
                    profile,
                    updated_at: timestamp(modified)?,
                },
            );
            if catalog.0.len() == 256 {
                break;
            }
        }
    }
    check()?;
    Ok(catalog)
}
