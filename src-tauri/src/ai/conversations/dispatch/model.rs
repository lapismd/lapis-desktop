use super::super::{
    capture_facts::{AuthoredTurn, Participant},
    identity::Identity,
    invalid,
};
use crate::ai::backend::{BackendCall, Selection};
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, io};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecipientInput {
    pub request_id: RequestId,
    pub participant: Option<Participant>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Input {
    pub request_id: RequestId,
    pub thread_id: ThreadId,
    pub expected_selection: Vec<u8>,
    pub authored: bool,
    pub recipients: Vec<RecipientInput>,
}
impl Input {
    pub fn validate(&self) -> io::Result<()> {
        if !(1..=4).contains(&self.recipients.len())
            || self.expected_selection.is_empty()
            || self.expected_selection.len() > 256
        {
            return Err(invalid());
        }
        let mut ids = BTreeSet::from([self.request_id]);
        let mut profiles = BTreeSet::new();
        for recipient in &self.recipients {
            if !ids.insert(recipient.request_id)
                || !profiles.insert(
                    recipient
                        .participant
                        .as_ref()
                        .map(|p| p.profile_id.as_str())
                        .unwrap_or("codex"),
                )
            {
                return Err(invalid());
            }
            if let Some(participant) = &recipient.participant {
                participant.validate()?;
            }
        }
        Ok(())
    }
}
/// Created only by native admission; no command deserializes this authority.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Owner {
    pub window: String,
    pub generation: String,
    pub handle: Uuid,
    pub origin: [u8; 32],
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Phase {
    Planned,
    Reserved,
    Bound,
    Prepared,
    Completed,
    Rejected,
    Unknown,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Binding {
    pub worker: String,
    pub open_request: String,
    pub target: Uuid,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Wire {
    pub digest: [u8; 32],
    pub text: String,
    pub context: Option<String>,
    pub max_duration_ms: u64,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Recipient {
    pub input: RecipientInput,
    pub digest: [u8; 32],
    pub target: Option<Uuid>,
    pub binding: Option<Binding>,
    pub phase: Phase,
    pub wire: Option<Wire>,
    pub terminal: Option<[u8; 32]>,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Record {
    pub schema: u8,
    pub request: RequestId,
    pub identity: Identity,
    pub source: [u8; 32],
    pub backend: Selection,
    pub owner: Owner,
    pub observed: Vec<u8>,
    pub digest: [u8; 32],
    pub authored: Option<AuthoredTurn>,
    pub recipients: Vec<Recipient>,
    pub stop_requested: bool,
    pub stopped: bool,
}
impl Record {
    pub fn settled(&self) -> bool {
        self.stopped
            || self
                .recipients
                .iter()
                .all(|r| matches!(r.phase, Phase::Completed | Phase::Rejected))
    }
    pub fn validate(
        &self,
        call: &BackendCall,
        request: RequestId,
        thread: ThreadId,
    ) -> io::Result<()> {
        self.identity.target.key().map_err(|_| invalid())?;
        if self.schema != 1
            || self.request != request
            || self.identity.thread_id != thread
            || self.identity.repository.is_none()
            || self.source != call.conversation_location()?.2
            || self.backend != *call.selection()
            || self.observed.is_empty()
            || self.observed.len() > 256
            || !(1..=4).contains(&self.recipients.len())
            || self.stopped && !self.stop_requested
            || self
                .authored
                .as_ref()
                .is_some_and(|a| a.request_id != request)
            || self.owner.window.is_empty()
            || self.owner.generation.is_empty()
        {
            return Err(invalid());
        }
        let input = Input {
            request_id: request,
            thread_id: thread,
            expected_selection: self.observed.clone(),
            authored: self.authored.is_some(),
            recipients: self.recipients.iter().map(|r| r.input.clone()).collect(),
        };
        input.validate()?;
        super::claims::check_parent(call, self)?;
        let mut targets = BTreeSet::new();
        let mut workers = BTreeSet::new();
        for r in &self.recipients {
            if let Some(target) = r.target {
                super::claims::check_recipient(call, self, r, target)?;
            }
            if r.target.is_some_and(|target| !targets.insert(target))
                || r.binding
                    .as_ref()
                    .is_some_and(|binding| !workers.insert(binding.worker.as_str()))
                || matches!(r.phase, Phase::Planned) != r.target.is_none()
                || matches!(
                    r.phase,
                    Phase::Bound
                        | Phase::Prepared
                        | Phase::Completed
                        | Phase::Rejected
                        | Phase::Unknown
                ) != r.binding.is_some()
                || matches!(
                    r.phase,
                    Phase::Prepared | Phase::Completed | Phase::Rejected | Phase::Unknown
                ) != r.wire.is_some()
                || matches!(r.phase, Phase::Completed | Phase::Rejected | Phase::Unknown)
                    != r.terminal.is_some()
                || r.binding.as_ref().is_some_and(|b| {
                    Some(b.target) != r.target || !label(&b.worker) || !label(&b.open_request)
                })
                || r.wire.as_ref().is_some_and(|w| {
                    w.text.len() > 256 * 1024
                        || w.context.as_ref().is_some_and(|s| s.len() > 512 * 1024)
                        || w.max_duration_ms == 0
                        || w.max_duration_ms > 86_400_000
                })
            {
                return Err(invalid());
            }
        }
        call.check()
    }
}
fn label(text: &str) -> bool {
    !text.is_empty() && text.len() <= 256 && !text.chars().any(char::is_control)
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipientView {
    pub request_id: RequestId,
    pub participant: Option<Participant>,
    pub phase: Phase,
    pub target_id: Option<Uuid>,
    pub binding: Option<Binding>,
    pub prepared: bool,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct View {
    pub request_id: RequestId,
    pub conversation: Identity,
    pub authored: Option<AuthoredTurn>,
    pub recipients: Vec<RecipientView>,
    pub stop_requested: bool,
    pub stopped: bool,
    pub settled: bool,
    pub fresh: bool,
}
impl Record {
    pub fn view(&self, fresh: bool) -> View {
        View {
            request_id: self.request,
            conversation: self.identity.clone(),
            authored: self.authored.clone(),
            recipients: self
                .recipients
                .iter()
                .map(|r| RecipientView {
                    request_id: r.input.request_id,
                    participant: r.input.participant.clone(),
                    phase: r.phase.clone(),
                    target_id: r.target,
                    binding: r.binding.clone(),
                    prepared: r.wire.is_some(),
                })
                .collect(),
            stop_requested: self.stop_requested,
            stopped: self.stopped,
            settled: self.settled(),
            fresh,
        }
    }
}
