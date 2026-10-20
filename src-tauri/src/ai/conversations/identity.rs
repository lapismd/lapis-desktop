use jj_collab::{ConversationMetadataTargetV1, ThreadId};
use jj_store_model::RepositoryId;
use serde::{Deserialize, Serialize};

/// Exact canonical source identity; never a private preparation alias.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Identity {
    pub target: ConversationMetadataTargetV1,
    pub thread_id: ThreadId,
    pub repository: Option<RepositoryId>,
}
