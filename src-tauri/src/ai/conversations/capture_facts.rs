//! Data-only Desktop attribution and prepared human-turn correspondence.
use super::invalid;
use jj_collab::{CollabObjectKind, CollabObjectRef, HumanMessageId, ThreadId};
use jj_store_model::{PrincipalId, RepositoryId, RequestId};
use serde::{Deserialize, Serialize};
use std::io;

pub const FIELD: &str = "lapisDesktop";
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PreferredEffort {
    Off,
    Low,
    Medium,
    High,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Participant {
    pub profile_id: String,
    pub label: String,
    pub preferred_model: Option<String>,
    pub preferred_effort: Option<PreferredEffort>,
}
impl Participant {
    pub fn validate(&self) -> io::Result<()> {
        let bad = |v: &str| {
            v.trim().is_empty()
                || v.chars()
                    .any(|c| c.is_control() || matches!(c, '\u{2028}' | '\u{2029}'))
        };
        if self.profile_id.encode_utf16().count() > 64
            || bad(&self.profile_id)
            || self.label.chars().count() > 80
            || bad(&self.label)
            || self
                .preferred_model
                .as_ref()
                .is_some_and(|v| v.len() > 256 || bad(v))
        {
            return Err(invalid());
        }
        Ok(())
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AuthoredTurn {
    pub request_id: RequestId,
    pub message_id: HumanMessageId,
    pub revision: CollabObjectRef,
    pub thread_version: CollabObjectRef,
    pub actor: PrincipalId,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HostFacts {
    pub schema: u8,
    pub repository: RepositoryId,
    pub thread_id: ThreadId,
    pub worker: String,
    pub request_id: Option<String>,
    pub client_id: String,
    pub participant: Option<Participant>,
    /// Prepared authorship is not proof of delivery or a successful provider turn.
    pub authored: Option<AuthoredTurn>,
}
impl HostFacts {
    pub fn validate(&self) -> io::Result<()> {
        if self.schema != 1
            || self.client_id != "codex"
            || self.worker.is_empty()
            || self.worker.len() > 256
            || self.worker.chars().any(char::is_control)
            || self
                .request_id
                .as_ref()
                .is_some_and(|v| v.is_empty() || v.len() > 256 || v.chars().any(char::is_control))
        {
            return Err(invalid());
        }
        if let Some(participant) = &self.participant {
            participant.validate()?;
        }
        if let Some(authored) = &self.authored {
            let original = self.request_id.as_ref().ok_or_else(invalid)?;
            let request = uuid::Uuid::parse_str(original).map_err(|_| invalid())?;
            if request.to_string() != *original
                || authored.request_id.as_bytes() != request.as_bytes()
                || authored.revision.kind != CollabObjectKind::HumanMessageRevision
            {
                return Err(invalid());
            }
            if authored.thread_version.kind != CollabObjectKind::ThreadVersion {
                return Err(invalid());
            }
        }
        Ok(())
    }
}
