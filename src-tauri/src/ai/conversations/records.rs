use crate::{ai::backend::Selection, vault::private_profile as storage};
use cap_std::fs::Dir;
use jj_collab::{ConversationMetadataTargetV1, ThreadCommandV1, ThreadId};
use jj_store_git::repository::{
    LocalCollabCommand, LocalCollabReceipt, LocalCollabRequest, LocalProfile,
};
use jj_store_model::{PrincipalId, RepositoryId, RequestId};
use serde::{Deserialize, Serialize};
use std::io;
use uuid::Uuid;

pub(super) const LIMIT: usize = 16 * 1024;
#[derive(Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub(super) struct Record {
    pub schema: u8,
    pub source: [u8; 32],
    pub selection: Selection,
    pub actor: PrincipalId,
    pub conversation: Uuid,
    pub repository: Option<RepositoryId>,
    pub request: LocalCollabRequest,
    pub receipt: Option<LocalCollabReceipt>,
}
impl Record {
    pub fn new(
        source: [u8; 32],
        selection: Selection,
        actor: PrincipalId,
        repository: Option<RepositoryId>,
        request_id: RequestId,
        title: String,
    ) -> io::Result<Self> {
        let conversation = Uuid::new_v4();
        let record = Self {
            schema: 1,
            source,
            selection,
            actor,
            conversation,
            repository,
            request: LocalCollabRequest {
                version: 1,
                request_id,
                command: LocalCollabCommand::Thread {
                    intent: ThreadCommandV1::CreateConversation {
                        thread_id: ThreadId::new(*Uuid::new_v4().as_bytes()),
                        title,
                        target: ConversationMetadataTargetV1::Conversation {
                            id: conversation.to_string(),
                        },
                    },
                },
            },
            receipt: None,
        };
        record.validate(request_id, source, &record.selection, actor)?;
        Ok(record)
    }
    pub fn command(&self) -> io::Result<&ThreadCommandV1> {
        match &self.request.command {
            LocalCollabCommand::Thread {
                intent: intent @ ThreadCommandV1::CreateConversation { .. },
            } => Ok(intent),
            _ => Err(super::invalid()),
        }
    }
    pub fn title(&self) -> io::Result<&str> {
        let ThreadCommandV1::CreateConversation { title, .. } = self.command()? else {
            unreachable!()
        };
        Ok(title)
    }
    pub fn validate(
        &self,
        request: RequestId,
        source: [u8; 32],
        selection: &Selection,
        actor: PrincipalId,
    ) -> io::Result<()> {
        self.request.validate().map_err(|_| super::invalid())?;
        let ThreadCommandV1::CreateConversation { target, .. } = self.command()? else {
            unreachable!()
        };
        if self.schema != 1
            || self.source != source
            || self.selection != *selection
            || self.actor != actor
            || self.request.request_id != request
            || *target
                != (ConversationMetadataTargetV1::Conversation {
                    id: self.conversation.to_string(),
                })
        {
            return Err(super::invalid());
        }
        if let Some(receipt) = &self.receipt {
            self.verify_receipt(receipt)?;
        }
        Ok(())
    }
    pub fn verify_receipt(&self, receipt: &LocalCollabReceipt) -> io::Result<()> {
        let jj_collab::CollabCommandResultV1::Thread { result } = &receipt.result else {
            return Err(super::invalid());
        };
        receipt.result.validate().map_err(|_| super::invalid())?;
        if receipt.version != 1
            || receipt.profile != LocalProfile::LocalJjGit
            || receipt.actor != self.actor
            || receipt.request_id != self.request.request_id
            || receipt.intent
                != self
                    .request
                    .intent_for(self.actor)
                    .map_err(|_| super::invalid())?
            || self.repository.is_some_and(|id| id != receipt.repository)
            || result.thread_id != self.command()?.thread_id()
            || result.message.is_some()
            || result.link.is_some()
            || result.reassigned_from.is_some()
            || receipt.metadata_sequence == 0
            || receipt.domain_state_version == 0
            || receipt.accepted_at_millis < 0
        {
            return Err(super::invalid());
        }
        Ok(())
    }
    pub fn save(&self, dir: &Dir, exclusive: bool) -> io::Result<()> {
        let bytes = serde_json::to_vec(self).map_err(|_| super::invalid())?;
        if bytes.len() > LIMIT {
            return Err(super::invalid());
        }
        storage::write(dir, &filename(self.request.request_id), &bytes, exclusive)
    }
}
pub(super) fn filename(request: RequestId) -> String {
    format!("{request}.json")
}
pub(super) fn read(dir: &Dir, request: RequestId) -> io::Result<Option<Record>> {
    storage::read(dir, &filename(request), LIMIT)?
        .map(|bytes| serde_json::from_slice(&bytes).map_err(|_| super::invalid()))
        .transpose()
}
pub(super) fn actor(dir: &Dir, create: bool) -> io::Result<Option<PrincipalId>> {
    if let Some(bytes) = storage::read(dir, "actor.json", 128)? {
        return serde_json::from_slice(&bytes)
            .map(Some)
            .map_err(|_| super::invalid());
    }
    if !create {
        return Ok(None);
    }
    let actor = PrincipalId::new(*Uuid::new_v4().as_bytes());
    storage::write(
        dir,
        "actor.json",
        &serde_json::to_vec(&actor).map_err(|_| super::invalid())?,
        true,
    )?;
    Ok(Some(actor))
}
