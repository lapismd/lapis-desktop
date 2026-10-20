use super::{Action, EditWrite};
use crate::{
    ai::{
        backend::{BackendCall, Selection},
        conversations::{identity::Identity, invalid},
    },
    vault::private_profile as storage,
};
use cap_std::fs::Dir;
use jj_collab::{CollabCommandResultV1, ThreadCommandV1};
use jj_store_core::StoreReceipt;
use jj_store_git::repository::{
    LocalCollabCommand, LocalCollabReceipt, LocalCollabRequest, LocalProfile,
};
use jj_store_model::{PrincipalId, RequestId};
use serde::{Deserialize, Serialize};
use std::io;

pub(super) const DIRECTORY: &str = "conversation-edits-v1";
const LIMIT: usize = 32 * 1024;
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Intent {
    schema: u8,
    source: [u8; 32],
    selection: Selection,
    pub identity: Identity,
    pub actor: PrincipalId,
    pub observed: Vec<u8>,
    pub action: Action,
    pub request: LocalCollabRequest,
    pub receipt: Option<LocalCollabReceipt>,
}
impl Intent {
    pub fn new(
        call: &BackendCall,
        identity: Identity,
        actor: PrincipalId,
        input: super::Input,
        command: ThreadCommandV1,
    ) -> io::Result<Self> {
        let result = Self {
            schema: 1,
            source: call.conversation_location()?.2,
            selection: call.selection().clone(),
            identity,
            actor,
            observed: input.expected_selection,
            action: input.action,
            request: LocalCollabRequest {
                version: 1,
                request_id: input.request_id,
                command: LocalCollabCommand::Thread { intent: command },
            },
            receipt: None,
        };
        result.validate(call, result.request.request_id, input.thread_id)?;
        Ok(result)
    }
    pub fn command(&self) -> io::Result<&ThreadCommandV1> {
        match &self.request.command {
            LocalCollabCommand::Thread { intent } => Ok(intent),
            _ => Err(invalid()),
        }
    }
    pub fn validate(
        &self,
        call: &BackendCall,
        request: RequestId,
        thread: jj_collab::ThreadId,
    ) -> io::Result<()> {
        self.request.validate().map_err(|_| invalid())?;
        self.identity.target.key().map_err(|_| invalid())?;
        if self.schema != 1
            || self.source != call.conversation_location()?.2
            || self.selection != *call.selection()
            || self.identity.repository.is_none()
            || self.identity.thread_id != thread
            || self.request.request_id != request
            || self.command()?.thread_id() != thread
            || self.observed.is_empty()
            || self.observed.len() > 256
        {
            return Err(invalid());
        }
        match (&self.action, self.command()?) {
            (Action::Rename { title }, ThreadCommandV1::SetMetadata { target, value, .. })
                if *target == self.identity.target && *title == value.custom_title => {}
            (
                Action::Lifecycle { action },
                ThreadCommandV1::Lifecycle {
                    action: command, ..
                },
            ) if action == command => {}
            _ => return Err(invalid()),
        }
        if let Some(receipt) = &self.receipt {
            self.verify(receipt)?;
        }
        call.check()
    }
    fn verify(&self, receipt: &LocalCollabReceipt) -> io::Result<()> {
        let CollabCommandResultV1::Thread { result } = &receipt.result else {
            return Err(invalid());
        };
        receipt.result.validate().map_err(|_| invalid())?;
        if receipt.version != 1
            || receipt.profile != LocalProfile::LocalJjGit
            || receipt.actor != self.actor
            || Some(receipt.repository) != self.identity.repository
            || receipt.request_id != self.request.request_id
            || receipt.intent != self.request.intent_for(self.actor).map_err(|_| invalid())?
            || result.thread_id != self.identity.thread_id
            || result.message.is_some()
            || result.link.is_some()
            || result.reassigned_from.is_some()
            || receipt.metadata_sequence == 0
            || receipt.domain_state_version == 0
            || receipt.accepted_at_millis < 0
        {
            return Err(invalid());
        }
        Ok(())
    }
    pub fn confirm(&mut self, receipt: StoreReceipt<CollabCommandResultV1>) -> io::Result<()> {
        let original: LocalCollabReceipt =
            serde_json::from_slice(&receipt.provider_receipt).map_err(|_| invalid())?;
        self.verify(&original)?;
        if serde_json::to_vec(&original).map_err(|_| invalid())? != receipt.provider_receipt
            || receipt.request_id != original.request_id
            || receipt.actor != original.actor
            || receipt.repository != original.repository
            || receipt.version != original.domain_state_version
            || receipt.selection != original.domain_object.to_string().as_bytes()
            || receipt.result != original.result
            || self.receipt.as_ref().is_some_and(|old| *old != original)
        {
            return Err(invalid());
        }
        self.receipt = Some(original);
        Ok(())
    }
    pub fn reply(&self) -> io::Result<EditWrite> {
        Ok(EditWrite {
            request_id: self.request.request_id,
            conversation: self.identity.clone(),
            receipt: self
                .receipt
                .as_ref()
                .map(serde_json::to_string)
                .transpose()
                .map_err(|_| invalid())?,
        })
    }
    pub fn read(dir: &Dir, request: RequestId) -> io::Result<Option<Self>> {
        storage::read(dir, &format!("{request}.json"), LIMIT)?
            .map(|bytes| serde_json::from_slice(&bytes).map_err(|_| invalid()))
            .transpose()
    }
    pub fn save(&self, dir: &Dir, exclusive: bool) -> io::Result<()> {
        let bytes = serde_json::to_vec(self).map_err(|_| invalid())?;
        if bytes.len() > LIMIT {
            return Err(invalid());
        }
        storage::write(
            dir,
            &format!("{}.json", self.request.request_id),
            &bytes,
            exclusive,
        )
    }
}
