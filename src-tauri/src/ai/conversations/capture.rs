use super::{capture_sink, invalid, provider, records, recover};
use crate::ai::{backend::BackendCall, capture::ManagedCapture, journal::Admission};
use crate::vault::private_profile as storage;
use jj_store_conversations::{capture::Binding, native_privacy::TranscriptSanitizer};
use jj_store_model::RequestId;
use std::{io, sync::Arc};

/// A native retained proof, never a renderer-provided conversation or grant.
/// It retains no counted backend call or journal while idle.
pub struct PreparedConversation {
    record: records::Record,
}
impl PreparedConversation {
    pub fn request_id(&self) -> RequestId {
        self.record.request.request_id
    }
    pub async fn load(call: BackendCall, request: RequestId) -> io::Result<Self> {
        let call = Arc::new(call);
        let _guard = call.preparation_guard().await?;
        let (profile, root, source) = call.conversation_location()?;
        let dir = storage::existing_directory(&profile, "conversations-v1")?.ok_or_else(invalid)?;
        let mut record = records::read(&dir, request)?.ok_or_else(invalid)?;
        let actor = records::actor(&dir, false)?.ok_or_else(invalid)?;
        record.validate(request, source, call.selection(), actor)?;
        recover(call.clone(), &root, &dir, &mut record).await?;
        if record.receipt.is_none() {
            return Err(super::unknown());
        }
        call.check()?;
        Ok(Self { record })
    }
    pub fn scope(&self) -> String {
        format!("notes-conversation:{}", self.record.conversation)
    }
    pub fn check(&self, call: &BackendCall) -> io::Result<()> {
        let (profile, _, source) = call.conversation_location()?;
        let dir = storage::existing_directory(&profile, "conversations-v1")?.ok_or_else(invalid)?;
        let actor = records::actor(&dir, false)?.ok_or_else(invalid)?;
        self.record
            .validate(self.request_id(), source, call.selection(), actor)?;
        if records::read(&dir, self.request_id())?.as_ref() != Some(&self.record) {
            return Err(invalid());
        }
        call.check()
    }
    pub fn processor(
        &self,
        call: Arc<BackendCall>,
        binding: Binding,
        privacy: Arc<TranscriptSanitizer>,
        admit: Admission,
    ) -> io::Result<ManagedCapture> {
        self.check(&call)?;
        let (_, root, _) = call.conversation_location()?;
        if binding.scope != self.scope() {
            return Err(invalid());
        }
        let receipt = self.record.receipt.as_ref().ok_or_else(invalid)?;
        let stores = Arc::new(provider::open(call.clone(), &root, &self.record)?);
        capture_sink::processor(
            call,
            binding,
            (receipt.repository, self.record.command()?.thread_id()),
            stores,
            privacy,
            admit,
        )
    }
}
