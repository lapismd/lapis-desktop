use super::super::{catalog::Selection, invalid};
use jj_agent::SourceInstanceId;
use jj_store_capture::codex_transcript::CodexSnapshotReader;
use lapis_ai_capture::source_file::{FileStamp, open_regular};
use std::{io, path::Path};
#[derive(Clone, PartialEq, Eq)]
pub(super) struct Version {
    stamp: FileStamp,
    pub session: String,
}
pub(super) fn inspect(selection: &Selection, workspace: &Path) -> io::Result<Option<Version>> {
    if !selection.candidate.revalidate().map_err(|_| invalid())? {
        return Err(invalid());
    }
    let reader = CodexSnapshotReader::open(
        selection.profile,
        selection.candidate.clone(),
        SourceInstanceId::new([1; 16]),
        64 * 1024 * 1024,
    )
    .map_err(|_| invalid())?;
    if super::admit_directory(Some(workspace), reader.directory()).is_err() {
        return Ok(None);
    }
    let (_, stamp) = open_regular(
        selection.candidate.path(),
        Some(selection.candidate.identity()),
    )
    .map_err(|_| invalid())?;
    Ok(Some(Version {
        stamp,
        session: format!("{:?}/{}", selection.profile, reader.native_session_key()),
    }))
}
