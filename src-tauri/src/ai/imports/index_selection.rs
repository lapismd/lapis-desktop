use super::{
    browser_types::{Harness, IndexedSession, Stamp},
    denied, index_scan, invalid,
};
use lapis_ai_capture::discovery::{ApprovedCodexRoot, CodexSourceCandidate};
use std::{collections::HashMap, io, path::Path};
pub(super) fn checked(
    home: &Path,
    row: IndexedSession,
) -> io::Result<(IndexedSession, Option<CodexSourceCandidate>)> {
    let source_root = index_scan::root(home, row.kind);
    if row.kind == Harness::Opencode {
        if row.path != source_root.join("opencode.db") {
            return Err(denied());
        }
        let stamp = Stamp::read(&row.path)?;
        if stamp.device != row.stamp.device || stamp.inode != row.stamp.inode {
            return Err(invalid());
        }
        return Ok((row, None));
    }
    let root = ApprovedCodexRoot::open(&source_root)
        .map_err(|_| invalid())?
        .ok_or_else(denied)?;
    let candidate = root.candidate(&row.path).map_err(|_| invalid())?;
    if row.path.extension().is_none_or(|s| s != "jsonl") {
        return Err(denied());
    }
    if row.kind == Harness::Cursor {
        let relative = row.path.strip_prefix(&source_root).map_err(|_| denied())?;
        let parts: Vec<_> = relative.components().collect();
        if parts.len() < 3
            || parts.len() > 8
            || parts[1].as_os_str() != "agent-transcripts"
            || row.path.file_stem().and_then(|s| s.to_str()) != Some(&row.native_id)
        {
            return Err(denied());
        }
    }
    let workspaces = HashMap::from([(row.group.clone(), row.directory.clone())]);
    let current =
        index_scan::inspect(home, row.kind, &candidate, &workspaces)?.ok_or_else(invalid)?;
    if current.stamp.device != row.stamp.device
        || current.stamp.inode != row.stamp.inode
        || current.native_id != row.native_id
        || current.group != row.group
        || current.profile != row.profile
    {
        return Err(invalid());
    }
    Ok((current, Some(candidate)))
}
