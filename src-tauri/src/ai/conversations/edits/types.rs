use super::super::{identity::Identity, invalid};
use jj_collab::{ThreadActionV1, ThreadId};
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_model::RequestId;
use serde::{Deserialize, Serialize};
use std::io;

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Action {
    Rename { title: Option<String> },
    Lifecycle { action: ThreadActionV1 },
}
impl Action {
    pub(super) fn sanitize(self, privacy: &TranscriptSanitizer) -> io::Result<Self> {
        if let Self::Rename { title: Some(title) } = self {
            if title.trim().is_empty() || title.len() > 1024 || title.chars().any(char::is_control)
            {
                return Err(invalid());
            }
            let safe = privacy
                .sanitize(serde_json::json!({"title":title}))
                .ok_or_else(invalid)?;
            let value: serde_json::Value =
                serde_json::from_slice(safe.bytes()).map_err(|_| invalid())?;
            return Ok(Self::Rename {
                title: Some(value["title"].as_str().ok_or_else(invalid)?.into()),
            });
        }
        Ok(self)
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Input {
    pub request_id: RequestId,
    pub thread_id: ThreadId,
    pub expected_selection: Vec<u8>,
    pub action: Action,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditWrite {
    pub request_id: RequestId,
    pub(super) conversation: Identity,
    pub receipt: Option<String>,
}
