use super::super::{invalid, records::Record};
use crate::ai::backend::{BackendCall, Selection};
use cap_std::fs::Dir;
use jj_collab::{CollabCommandResultV1, CollabObjectRef, HumanMessageId, ThreadCommandV1};
use jj_store_core::StoreReceipt;
use jj_store_git::repository::{
    LocalCollabCommand, LocalCollabReceipt, LocalCollabRequest, LocalProfile,
};
use jj_store_model::{PrincipalId, RepositoryId, RequestId};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io;
use uuid::Uuid;

const LIMIT: usize = 1024 * 1024;
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Intent {
    schema: u8,
    source: [u8; 32],
    selection: Selection,
    conversation_request_id: RequestId,
    conversation: Uuid,
    actor: PrincipalId,
    repository: RepositoryId,
    message: HumanMessageId,
    seed: [u8; 16],
    pub(super) fingerprint: [u8; 32],
    pub(super) request: LocalCollabRequest,
    pub(super) receipt: Option<LocalCollabReceipt>,
}
impl Intent {
    pub(super) fn new(
        call: &BackendCall,
        original: &Record,
        request: RequestId,
        expected: CollabObjectRef,
        body: String,
        fingerprint: [u8; 32],
    ) -> io::Result<Self> {
        let seed = *Uuid::new_v4().as_bytes();
        let message = Self::message_id(seed, fingerprint, request, original);
        let result = Self {
            schema: 1,
            source: call.conversation_location()?.2,
            selection: call.selection().clone(),
            conversation_request_id: original.request.request_id,
            conversation: original.conversation,
            actor: original.actor,
            repository: original.receipt.as_ref().ok_or_else(invalid)?.repository,
            message,
            seed,
            fingerprint,
            request: LocalCollabRequest {
                version: 1,
                request_id: request,
                command: LocalCollabCommand::Thread {
                    intent: ThreadCommandV1::Message {
                        emojis: Vec::new(),
                        thread_id: original.command()?.thread_id(),
                        expected_thread: expected,
                        message_id: message,
                        expected_revision: None,
                        reply_to: None,
                        body: Some(body),
                    },
                },
            },
            receipt: None,
        };
        result.validate(call, original, request)?;
        Ok(result)
    }
    fn command(&self) -> io::Result<&ThreadCommandV1> {
        match &self.request.command {
            LocalCollabCommand::Thread {
                intent: command @ ThreadCommandV1::Message { .. },
            } => Ok(command),
            _ => Err(invalid()),
        }
    }
    fn message_id(
        seed: [u8; 16],
        fingerprint: [u8; 32],
        request: RequestId,
        original: &Record,
    ) -> HumanMessageId {
        let mut digest = Sha256::new();
        digest.update(b"lapis-native-authored-message-identity-v1\0");
        digest.update(seed);
        digest.update(fingerprint);
        digest.update(request.as_bytes());
        digest.update(original.conversation.as_bytes());
        digest.update(original.actor.as_bytes());
        let hash = digest.finalize();
        let mut id = [0; 16];
        id.copy_from_slice(&hash[..16]);
        HumanMessageId::new(id)
    }
    pub(super) fn validate(
        &self,
        call: &BackendCall,
        original: &Record,
        request: RequestId,
    ) -> io::Result<()> {
        self.request.validate().map_err(|_| invalid())?;
        let ThreadCommandV1::Message {
            thread_id,
            message_id,
            expected_revision,
            reply_to,
            body,
            emojis,
            ..
        } = self.command()?
        else {
            unreachable!()
        };
        if self.schema != 1
            || self.source != call.conversation_location()?.2
            || self.selection != *call.selection()
            || self.request.request_id != request
            || self.conversation_request_id != original.request.request_id
            || self.conversation != original.conversation
            || self.actor != original.actor
            || Some(self.repository) != original.receipt.as_ref().map(|receipt| receipt.repository)
            || *thread_id != original.command()?.thread_id()
            || *message_id != self.message
            || self.message != Self::message_id(self.seed, self.fingerprint, request, original)
            || expected_revision.is_some()
            || reply_to.is_some()
            || !emojis.is_empty()
            || body.is_none()
        {
            return Err(invalid());
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
            || receipt.request_id != self.request.request_id
            || receipt.actor != self.actor
            || receipt.repository != self.repository
            || receipt.intent != self.request.intent_for(self.actor).map_err(|_| invalid())?
            || result.thread_id != self.command()?.thread_id()
            || result.message.is_none()
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
    pub(super) fn confirm(
        &mut self,
        receipt: StoreReceipt<CollabCommandResultV1>,
    ) -> io::Result<()> {
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
    pub(super) fn reply(&self) -> io::Result<super::MessageWrite> {
        Ok(super::MessageWrite {
            request_id: self.request.request_id,
            conversation_request_id: self.conversation_request_id,
            message_id: self.message,
            receipt: self
                .receipt
                .as_ref()
                .map(serde_json::to_string)
                .transpose()
                .map_err(|_| invalid())?,
        })
    }
    pub(super) fn read(directory: &Dir, request: RequestId) -> io::Result<Option<Self>> {
        crate::vault::private_profile::read(directory, &format!("{request}.json"), LIMIT)?
            .map(|bytes| serde_json::from_slice(&bytes).map_err(|_| invalid()))
            .transpose()
    }
    pub(super) fn save(&self, directory: &Dir, exclusive: bool) -> io::Result<()> {
        let bytes = serde_json::to_vec(self).map_err(|_| invalid())?;
        if bytes.len() > LIMIT {
            return Err(invalid());
        }
        crate::vault::private_profile::write(
            directory,
            &format!("{}.json", self.request.request_id),
            &bytes,
            exclusive,
        )
    }
}
