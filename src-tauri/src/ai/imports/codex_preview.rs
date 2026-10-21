use super::{
    CapturedSession, ImportSource, PreviewPage,
    catalog::{self, Selection},
    digest, hex, invalid,
    normalization::Normalization,
    privacy::Privacy,
};
use jj_agent::{NormalizerProfileV1, SourceInstanceId, SourcePositionV1};
use jj_store_capture::{
    codex_transcript::{CodexSnapshotReader, SnapshotPoll},
    profile::CaptureProfile,
};
use std::{
    io,
    path::{Path, PathBuf},
};
pub(super) struct CodexPreview {
    reader: CodexSnapshotReader,
    privacy: Privacy,
    normalization: Normalization,
    workspace: Option<PathBuf>,
    session: [u8; 32],
    profile: CaptureProfile,
    bytes: u64,
    total: u64,
}
impl CodexPreview {
    pub fn open(
        selection: &Selection,
        home: &Path,
        workspace: Option<&Path>,
        base: Option<&Privacy>,
        expected: Option<(&str, &Path)>,
        check: &dyn Fn() -> io::Result<()>,
    ) -> io::Result<Self> {
        check()?;
        let reader = CodexSnapshotReader::open(
            selection.profile,
            selection.candidate.clone(),
            SourceInstanceId::new([1; 16]),
            64 * 1024 * 1024,
        )
        .map_err(|_| invalid())?;
        let native = reader.native_session_key().to_owned();
        let directory = reader.directory().to_path_buf();
        if expected.is_some_and(|(session, path)| session != native || path != directory) {
            return Err(invalid());
        }
        let session = digest(
            b"lapis-notes/codex-import-session/v1\0",
            reader.native_session_key().as_bytes(),
        );
        let reader = CodexSnapshotReader::open(
            selection.profile,
            selection.candidate.clone(),
            SourceInstanceId::new(session[..16].try_into().map_err(|_| invalid())?),
            64 * 1024 * 1024,
        )
        .map_err(|_| invalid())?;
        if reader.native_session_key() != native || reader.directory() != directory {
            return Err(invalid());
        }
        super::capture::admit_directory(workspace, reader.directory())?;
        let privacy = match base {
            Some(base) => base.scoped(reader.directory())?,
            None => Privacy::new(reader.directory(), home)?,
        };
        let profile = if selection.profile == CaptureProfile::CodexDesktopJsonlV1 {
            NormalizerProfileV1::codex_desktop_0_159_2()
        } else {
            NormalizerProfileV1::codex_0_156_1()
        };
        Ok(Self {
            reader,
            privacy,
            normalization: Normalization::new(profile),
            workspace: workspace.map(Path::to_path_buf),
            session,
            profile: selection.profile,
            bytes: 0,
            total: std::fs::metadata(selection.candidate.path())?.len(),
        })
    }
    pub fn next(&mut self, check: &dyn Fn() -> io::Result<()>) -> io::Result<PreviewPage> {
        check()?;
        for _ in 0..16 {
            match self.reader.poll().map_err(|_| invalid())? {
                SnapshotPoll::Reading => {}
                SnapshotPoll::Ready(batch) => {
                    if let SourcePositionV1::JsonLines {
                        complete_byte_offset,
                        ..
                    } = &batch.cursor.position
                    {
                        self.bytes = *complete_byte_offset;
                    }
                    let Some(directory) = batch.directory() else {
                        if self.workspace.is_some() {
                            return Err(super::capture::outside());
                        }
                        self.normalization.omitted = true;
                        continue;
                    };
                    super::capture::admit_directory(self.workspace.as_deref(), directory)?;
                    let sanitizer = self.privacy.for_workspace(directory)?;
                    let profile = if self.profile == CaptureProfile::CodexDesktopJsonlV1 {
                        NormalizerProfileV1::codex_desktop_0_159_2()
                    } else {
                        NormalizerProfileV1::codex_0_156_1()
                    };
                    self.normalization.add(
                        batch
                            .sanitized_observations(&profile, &sanitizer)
                            .map_err(|_| invalid())?,
                    )?;
                    check()?;
                    break;
                }
                SnapshotPoll::Complete(summary) => {
                    let entries = self.normalization.entries(true)?;
                    let capture = CapturedSession {
                        version: 1,
                        source: ImportSource {
                            kind: "codex",
                            profile: catalog::profile(self.profile).1.into(),
                            session_key: hex(&self.session),
                            snapshot_key: hex(&summary.sha256),
                        },
                        created_at: self.normalization.created_at(),
                        entries: entries.clone(),
                    };
                    if serde_json::to_vec(&capture).map_err(|_| invalid())?.len() > 4 * 1024 * 1024
                        || !matches!(
                            self.reader.poll().map_err(|_| invalid())?,
                            SnapshotPoll::Complete(_)
                        )
                    {
                        return Err(invalid());
                    }
                    check()?;
                    return Ok(PreviewPage {
                        entries,
                        order: vec![],
                        progress: 100,
                        capture: Some(capture),
                    });
                }
            }
            check()?;
        }
        check()?;
        Ok(PreviewPage {
            entries: self.normalization.entries(false)?,
            order: vec![],
            progress: ((self.bytes * 100) / self.total.max(1)).min(99) as u32,
            capture: None,
        })
    }
}
