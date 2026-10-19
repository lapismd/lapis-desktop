use super::{CapturedEntry, invalid};
use jj_agent::{
    MessageRole, NormalizationBatchV1, NormalizedActivityRecordV1, SanitizedPayloadV1, ToolState,
};
use std::{collections::HashMap, io};
pub(super) const FALLBACK_TIME: &str = "1970-01-01T00:00:00.000Z";
fn text(payload: &SanitizedPayloadV1) -> io::Result<String> {
    let text = std::str::from_utf8(payload.bytes()).map_err(|_| invalid())?;
    // Tool arguments/results may be JSON strings, unlike message text payloads.
    Ok(
        if payload.media_type() == jj_agent::SanitizedMediaType::Json {
            serde_json::from_str::<String>(text).unwrap_or_else(|_| text.into())
        } else {
            text.into()
        },
    )
}
pub(super) fn project(
    batch: &NormalizationBatchV1,
    times: &HashMap<u64, String>,
    omitted: bool,
) -> io::Result<Vec<CapturedEntry>> {
    let time = |sequence: u64| {
        times
            .get(&sequence)
            .cloned()
            .unwrap_or_else(|| FALLBACK_TIME.into())
    };
    let mut entries = Vec::new();
    let reduced = batch.reduce_tools();
    for record in &batch.records {
        if let NormalizedActivityRecordV1::Message(message) = record {
            let role = match message.role {
                MessageRole::User => "user",
                MessageRole::Assistant => "assistant",
                _ => continue,
            };
            entries.push((
                message.source_sequence,
                CapturedEntry::Message {
                    id: format!("message:{}", message.source_sequence),
                    created_at: time(message.source_sequence),
                    role,
                    text: text(&message.content)?,
                },
            ));
        }
    }
    for tool in reduced.tools {
        let state = match tool.state {
            ToolState::Succeeded => "completed",
            ToolState::Failed => "error",
            ToolState::Cancelled => "cancelled",
            _ => "unknown",
        };
        entries.push((
            tool.source_sequence,
            CapturedEntry::Tool {
                id: format!("tool:{}", tool.tool_call_id),
                created_at: time(tool.source_sequence),
                name: tool.native_name,
                state,
                input: tool.input.as_ref().map(text).transpose()?,
                output: tool.output.as_ref().map(text).transpose()?,
            },
        ));
    }
    entries.sort_by_key(|e| e.0);
    let mut entries: Vec<_> = entries.into_iter().map(|e| e.1).collect();
    if omitted || !reduced.diagnostics.is_empty() || entries.is_empty() {
        entries.push(CapturedEntry::Notice { id: "omissions:0".into(), created_at: FALLBACK_TIME.into(),
            text: "Some source records were omitted or could not be interpreted. Captured tool output does not establish a successful outcome.".into() });
    }
    if entries.len() > 4096 {
        return Err(invalid());
    }
    Ok(entries)
}
