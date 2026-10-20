//! Prepared participation in a committed conversation, without a creation UUID.
use super::{capture_sink, identity::Identity, invalid, member, messages, provider, records};
use crate::{
    ai::{
        backend::{BackendCall, Selection},
        capture::ManagedCapture,
        journal::Admission,
    },
    vault::private_profile as storage,
};
use jj_collab::ThreadId;
use jj_store_conversations::{capture::Binding, native_privacy::TranscriptSanitizer};
use jj_store_model::RequestId;
use sha2::{Digest, Sha256};
use std::{io, sync::Arc};

/// No counted call, actor, journal or provider is retained by an idle plan.
pub struct PreparedCanonicalConversation {
    identity: Identity,
    source: [u8; 32],
    backend: Selection,
    observed: Vec<u8>,
}
impl PreparedCanonicalConversation {
    pub async fn load(call: BackendCall, thread: ThreadId, observed: Vec<u8>) -> io::Result<Self> {
        let call = Arc::new(call);
        let _guard = call.preparation_guard().await?;
        let member = member::current(call.clone(), thread, Some(&observed), true).await?;
        let result = Self {
            identity: member.identity,
            source: call.conversation_location()?.2,
            backend: call.selection().clone(),
            observed,
        };
        result.check(&call)?;
        Ok(result)
    }
    pub fn identity(&self) -> &Identity {
        &self.identity
    }
    pub fn observed(&self) -> &[u8] {
        &self.observed
    }
    /// Launch hooks check their retained native grant/physical source only.
    /// Current graph validation happens on the worker before capture or prompts.
    pub fn check(&self, call: &BackendCall) -> io::Result<()> {
        if self.source != call.conversation_location()?.2 || self.backend != *call.selection() {
            return Err(invalid());
        }
        call.check()
    }
    pub fn scope(&self) -> io::Result<String> {
        let digest = Sha256::new_with_prefix(b"lapis-canonical-capture-scope-v2\0")
            .chain_update(
                serde_json::to_vec(&(&self.identity, self.source, &self.backend))
                    .map_err(|_| invalid())?,
            )
            .finalize();
        Ok(format!(
            "notes-canonical-v2:{}",
            digest
                .iter()
                .map(|v| format!("{v:02x}"))
                .collect::<String>()
        ))
    }
    pub async fn current(&self, call: Arc<BackendCall>, writing: bool) -> io::Result<()> {
        self.check(&call)?;
        let current = member::current(call.clone(), self.identity.thread_id, None, writing).await?;
        if current.identity != self.identity
            || current.status == jj_collab::ThreadStatusV1::Tombstoned
        {
            return Err(invalid());
        }
        call.check()
    }
    /// Called on the owned blocking worker before the first captured output.
    pub async fn processor(
        &self,
        call: Arc<BackendCall>,
        binding: Binding,
        privacy: Arc<TranscriptSanitizer>,
        admit: Admission,
    ) -> io::Result<ManagedCapture> {
        let _guard = call.preparation_guard().await?;
        self.current(call.clone(), true).await?;
        if binding.scope != self.scope()? {
            return Err(invalid());
        }
        let (profile, _, _) = call.conversation_location()?;
        let actor_dir = storage::directory(&profile, "conversations-v1")?;
        let actor = records::actor(&actor_dir, true)?.ok_or_else(invalid)?;
        let repository = self.identity.repository.ok_or_else(invalid)?;
        let stores = provider::capture_current(call.clone(), actor, self.identity.clone())?;
        capture_sink::processor(
            call,
            binding,
            (repository, self.identity.thread_id),
            Arc::new(stores),
            privacy,
            admit,
        )
    }
    pub async fn append(
        &self,
        call: Arc<BackendCall>,
        request: RequestId,
        text: String,
        privacy: Arc<TranscriptSanitizer>,
    ) -> io::Result<super::capture_facts::AuthoredTurn> {
        self.check(&call)?;
        let write =
            messages::canonical::append_managed(call, &self.identity, request, text, privacy)
                .await?;
        if !write.is_confirmed() {
            return Err(super::unknown());
        }
        write.authored_turn()
    }
}
