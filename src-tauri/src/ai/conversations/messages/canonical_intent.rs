//! An original canonical authored command, separate from creation-cache aliases.
use super::super::{identity::Identity, invalid, member::Member};
use crate::{
    ai::backend::{BackendCall, Selection},
    vault::private_profile as storage,
};
use cap_std::fs::Dir;
use jj_collab::{CollabCommandResultV1, HumanMessageId, ThreadCommandV1, ThreadId};
use jj_store_core::StoreReceipt;
use jj_store_git::repository::{
    LocalCollabCommand, LocalCollabReceipt, LocalCollabRequest, LocalProfile,
};
use jj_store_model::{PrincipalId, RequestId};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io;
use uuid::Uuid;

pub(super) const DIRECTORY: &str = "canonical-conversation-messages-v1";
const LIMIT: usize = 1024 * 1024;
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Intent {
    schema: u8,
    source: [u8; 32],
    selection: Selection,
    pub identity: Identity,
    pub actor: PrincipalId,
    message: HumanMessageId,
    seed: [u8; 16],
    pub fingerprint: [u8; 32],
    pub observed: Vec<u8>,
    pub request: LocalCollabRequest,
    pub receipt: Option<LocalCollabReceipt>,
}
impl Intent {
    pub fn new(
        call: &BackendCall,
        member: Member,
        actor: PrincipalId,
        request: RequestId,
        body: String,
        fingerprint: [u8; 32],
    ) -> io::Result<Self> {
        let seed = *Uuid::new_v4().as_bytes();
        let source = call.conversation_location()?.2;
        let selection = call.selection().clone();
        let message = Self::message_id(
            seed,
            fingerprint,
            request,
            &member.identity,
            actor,
            &member.selection,
            (&source, &selection),
        )?;
        let result = Self {
            schema: 1,
            source,
            selection,
            identity: member.identity.clone(),
            actor,
            message,
            seed,
            fingerprint,
            observed: member.selection,
            request: LocalCollabRequest {
                version: 1,
                request_id: request,
                command: LocalCollabCommand::Thread {
                    intent: ThreadCommandV1::Message {
                        emojis: Vec::new(),
                        thread_id: member.identity.thread_id,
                        expected_thread: member.expected,
                        message_id: message,
                        expected_revision: None,
                        reply_to: None,
                        body: Some(body),
                    },
                },
            },
            receipt: None,
        };
        result.validate(call, request, member.identity.thread_id)?;
        Ok(result)
    }
    fn message_id(
        seed: [u8; 16],
        fingerprint: [u8; 32],
        request: RequestId,
        identity: &Identity,
        actor: PrincipalId,
        observed: &[u8],
        binding: (&[u8; 32], &Selection),
    ) -> io::Result<HumanMessageId> {
        let mut digest = Sha256::new_with_prefix(b"lapis-canonical-authored-message-identity-v1\0");
        digest.update(seed);
        digest.update(fingerprint);
        digest.update(request.as_bytes());
        digest.update(serde_json::to_vec(&(identity, observed, binding)).map_err(|_| invalid())?);
        digest.update(actor.as_bytes());
        let mut id = [0; 16];
        id.copy_from_slice(&digest.finalize()[..16]);
        Ok(HumanMessageId::new(id))
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
        thread: ThreadId,
    ) -> io::Result<()> {
        self.request.validate().map_err(|_| invalid())?;
        self.identity.target.key().map_err(|_| invalid())?;
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
            return Err(invalid());
        };
        if self.schema != 1
            || self.source != call.conversation_location()?.2
            || self.selection != *call.selection()
            || self.identity.repository.is_none()
            || self.identity.thread_id != thread
            || self.request.request_id != request
            || *thread_id != thread
            || *message_id != self.message
            || self.message
                != Self::message_id(
                    self.seed,
                    self.fingerprint,
                    request,
                    &self.identity,
                    self.actor,
                    &self.observed,
                    (&self.source, &self.selection),
                )?
            || self.observed.is_empty()
            || self.observed.len() > 256
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
            || Some(receipt.repository) != self.identity.repository
            || receipt.intent != self.request.intent_for(self.actor).map_err(|_| invalid())?
            || result.thread_id != self.identity.thread_id
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
    pub fn reply(&self) -> io::Result<super::canonical::MessageWrite> {
        Ok(super::canonical::MessageWrite {
            request_id: self.request.request_id,
            conversation: self.identity.clone(),
            message_id: self.message,
            proof: self.receipt.clone(),
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
