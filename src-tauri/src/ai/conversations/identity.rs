use jj_collab::{ConversationMetadataTargetV1, ThreadId};
use jj_store_model::RepositoryId;
use serde::Serialize;

/// Exact canonical source identity; never a private preparation alias.
#[derive(Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Identity {
    pub target: ConversationMetadataTargetV1,
    pub thread_id: ThreadId,
    pub repository: Option<RepositoryId>,
}
