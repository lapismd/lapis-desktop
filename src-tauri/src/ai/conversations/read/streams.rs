use super::{Session, invalid};
use jj_agent::{
    AgentObjectRef, AgentObjectV1, SanitizedMediaType, SourceInstanceId, TranscriptStreamV1,
};
use jj_collab::{ThreadLinkTargetV1, ThreadLinkV1};
use jj_store_core::engine::{AgentReader, AgentSnapshotRead};
use serde::Serialize;
use std::collections::BTreeMap;
use std::io;
use uuid::Uuid;

#[derive(Serialize)]
pub(super) struct Transcript {
    manifest: AgentObjectRef,
    stream: TranscriptStreamV1,
    chunks: Vec<Chunk>,
    pub(super) next_after_sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cursor: Option<Uuid>,
}
#[derive(Serialize)]
struct Chunk {
    source_instance_id: SourceInstanceId,
    source_generation: u64,
    sequence: u64,
    media_type: SanitizedMediaType,
    text: String,
}
pub(super) async fn sessions(
    snapshot: &dyn AgentSnapshotRead,
    links: Vec<ThreadLinkV1>,
    retain: bool,
    cursors: &mut BTreeMap<Uuid, super::retained::Cursor>,
) -> io::Result<Vec<Session>> {
    let reader = AgentReader::new(snapshot);
    let mut result = Vec::new();
    let mut remaining = 256 * 1024usize;
    let mut streams = 0;
    for link in links {
        let ThreadLinkTargetV1::Session {
            session_id,
            snapshot: reference,
            ..
        } = link.target
        else {
            return Err(invalid());
        };
        let AgentObjectV1::SessionSnapshot(session) = snapshot
            .read_object(reference)
            .await
            .map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if session.session_id != session_id {
            return Err(invalid());
        }
        let mut transcripts = Vec::new();
        for reference in &session.transcripts {
            let AgentObjectV1::TranscriptManifest(manifest) = snapshot
                .read_object(*reference)
                .await
                .map_err(|_| invalid())?
            else {
                return Err(invalid());
            };
            if manifest.session_id != session_id {
                return Err(invalid());
            }
            for stream in manifest.streams {
                streams += 1;
                if streams > 64 || remaining == 0 {
                    return Err(io::Error::other("Conversation transcript limit exceeded"));
                }
                let mut transcript =
                    range(&reader, *reference, stream, None, remaining, None).await?;
                for chunk in &transcript.chunks {
                    remaining = remaining
                        .checked_sub(chunk.text.len())
                        .ok_or_else(invalid)?;
                }
                if retain && let Some(after) = transcript.next_after_sequence {
                    let cursor = Uuid::new_v4();
                    cursors.insert(
                        cursor,
                        super::retained::Cursor::new(
                            session_id,
                            *reference,
                            transcript.stream.clone(),
                            after,
                        ),
                    );
                    transcript.cursor = Some(cursor);
                }
                transcripts.push(transcript);
            }
        }
        result.push(Session {
            link,
            snapshot: session,
            transcripts,
        });
    }
    Ok(result)
}

pub(super) async fn range(
    reader: &AgentReader<'_>,
    manifest: AgentObjectRef,
    stream: TranscriptStreamV1,
    after: Option<u64>,
    bytes: usize,
    cursor: Option<Uuid>,
) -> io::Result<Transcript> {
    let range = reader
        .transcript_range(
            manifest,
            stream.source_instance_id,
            stream.source_generation,
            after,
            32,
            bytes,
        )
        .await
        .map_err(|_| invalid())?;
    let chunks = range
        .chunks
        .into_iter()
        .map(|chunk| {
            Ok(Chunk {
                source_instance_id: chunk.source_instance_id,
                source_generation: chunk.source_generation,
                sequence: chunk.sequence,
                media_type: chunk.payload.media_type(),
                text: std::str::from_utf8(chunk.payload.bytes())
                    .map_err(|_| invalid())?
                    .to_owned(),
            })
        })
        .collect::<io::Result<Vec<_>>>()?;
    Ok(Transcript {
        manifest,
        stream,
        chunks,
        next_after_sequence: range.next_after_sequence,
        cursor,
    })
}
