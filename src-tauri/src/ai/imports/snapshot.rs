use super::{CapturedSession, Catalog, ImportSource, catalog, digest, hex, invalid, projection};
use jj_agent::{
    NormalizationBatchV1, NormalizerProfileV1, SourceInstanceId, normalize_batch_candidates,
};
use jj_store_capture::{
    codex_transcript::{CodexSnapshotReader, SnapshotPoll},
    profile::CaptureProfile,
    transcript_sanitization::TranscriptSanitizer,
};
use std::{collections::HashMap, io, path::Path};
/// All raw batches stay native. Any failure discards the entire tentative projection.
pub fn preview(
    catalog: &Catalog,
    selector: &str,
    home: &Path,
    check: &dyn Fn() -> io::Result<()>,
) -> io::Result<CapturedSession> {
    check()?;
    let selection = catalog.0.get(selector).ok_or_else(super::denied)?;
    let temporary = std::env::temp_dir().canonicalize().map_err(|_| invalid())?;
    use std::os::unix::fs::PermissionsExt;
    let cache = tempfile::Builder::new()
        .prefix("lapis-import-privacy-")
        .permissions(std::fs::Permissions::from_mode(0o700))
        .tempdir_in(&temporary)
        .map_err(|_| invalid())?;
    let mut reader = CodexSnapshotReader::open(
        selection.profile,
        selection.candidate.clone(),
        SourceInstanceId::new([1; 16]),
        64 * 1024 * 1024,
    )
    .map_err(|_| invalid())?;
    let session_key = digest(
        b"lapis-notes/codex-import-session/v1\0",
        reader.native_session_key().as_bytes(),
    );
    reader = CodexSnapshotReader::open(
        selection.profile,
        selection.candidate.clone(),
        SourceInstanceId::new(session_key[..16].try_into().map_err(|_| invalid())?),
        64 * 1024 * 1024,
    )
    .map_err(|_| invalid())?;
    let root_sanitizer =
        TranscriptSanitizer::new(reader.directory(), home, &temporary, cache.path())
            .map_err(|_| invalid())?;
    let profile = if selection.profile == CaptureProfile::CodexDesktopJsonlV1 {
        NormalizerProfileV1::codex_desktop_0_159_2()
    } else {
        NormalizerProfileV1::codex_0_156_1()
    };
    let mut combined = NormalizationBatchV1 {
        schema_version: 1,
        profile: profile.clone(),
        aliases: vec![],
        records: vec![],
        diagnostics: vec![],
    };
    let mut results = Vec::new();
    let mut times = HashMap::new();
    let mut bytes = 0usize;
    let mut omitted = false;
    let summary = loop {
        check()?;
        match reader.poll().map_err(|_| invalid())? {
            SnapshotPoll::Reading => {}
            SnapshotPoll::Complete(summary) => break summary,
            SnapshotPoll::Ready(batch) => {
                let Some(directory) = batch.directory() else {
                    omitted = true;
                    continue;
                };
                let sanitizer = root_sanitizer
                    .for_workspace(directory)
                    .map_err(|_| invalid())?;
                let sanitized = batch
                    .sanitized_observations(&profile, &sanitizer)
                    .map_err(|_| invalid())?;
                check()?;
                for observation in &sanitized.observations {
                    bytes = bytes
                        .checked_add(observation.payload.bytes().len())
                        .ok_or_else(invalid)?;
                    if bytes > 4 * 1024 * 1024 {
                        return Err(invalid());
                    }
                    let value: serde_json::Value =
                        serde_json::from_slice(observation.payload.bytes())
                            .map_err(|_| invalid())?;
                    if let Some(time) = value["record"]["timestamp"]
                        .as_str()
                        .and_then(|t| chrono::DateTime::parse_from_rfc3339(t).ok())
                    {
                        times.insert(
                            observation.source_sequence,
                            time.to_utc()
                                .to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
                        );
                    }
                    if times.len() > 16_384 {
                        return Err(invalid());
                    }
                }
                let next =
                    normalize_batch_candidates(&profile, &sanitized).map_err(|_| invalid())?;
                omitted |= !next.activity.diagnostics.is_empty();
                combined.aliases.extend(next.activity.aliases);
                combined.records.extend(next.activity.records);
                results.extend(next.tool_results);
                if combined.records.len() > 8192
                    || combined.aliases.len() > 32_768
                    || results.len() > 4096
                {
                    return Err(invalid());
                }
            }
        }
    };
    // Resolve against the whole snapshot: calls and responses may span reader batches.
    for result in results {
        check()?;
        let known = result.same_batch_call(&combined).cloned();
        combined
            .resolve_tool_result(&result, known.as_ref())
            .map_err(|_| invalid())?;
    }
    omitted |= !combined.diagnostics.is_empty();
    combined.sort_source_records();
    let entries = projection::project(&combined, &times, omitted)?;
    let created_at = times
        .values()
        .min()
        .cloned()
        .unwrap_or_else(|| projection::FALLBACK_TIME.into());
    let capture = CapturedSession {
        version: 1,
        source: ImportSource {
            kind: "codex",
            profile: catalog::profile(selection.profile).1.into(),
            session_key: hex(&session_key),
            snapshot_key: hex(&summary.sha256),
        },
        created_at,
        entries,
    };
    if serde_json::to_vec(&capture).map_err(|_| invalid())?.len() > 4 * 1024 * 1024 {
        return Err(invalid());
    }
    // Verify the physical source once more after normalization, before publication.
    if !matches!(
        reader.poll().map_err(|_| invalid())?,
        SnapshotPoll::Complete(_)
    ) {
        return Err(invalid());
    }
    check()?;
    Ok(capture)
}
