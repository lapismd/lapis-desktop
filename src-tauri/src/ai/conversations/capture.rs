use super::{invalid, provider, records, recover};
use crate::ai::{
    backend::BackendCall,
    capture::ManagedCapture,
    journal::{Admission, ProfileJournal},
};
use crate::vault::private_profile as storage;
use jj_agent::NativeCaptureBindingV1;
use jj_store_conversations::{
    capture::{Binding, CaptureError},
    native_privacy::{TRANSCRIPT_POLICY, TranscriptSanitizer},
    store_capture::{ContextV1, StoreCapture},
};
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
        let (profile, root, _) = call.conversation_location()?;
        if binding.scope != self.scope() {
            return Err(invalid());
        }
        let receipt = self.record.receipt.as_ref().ok_or_else(invalid)?;
        let context = ContextV1 {
            repository: receipt.repository,
            thread: self.record.command()?.thread_id(),
            policy: TRANSCRIPT_POLICY.into(),
            binding: NativeCaptureBindingV1 {
                scope: binding.scope.clone(),
                worker: binding.worker.clone(),
                request: binding.request.clone(),
                target: binding.target.clone(),
                window: binding.window.clone(),
                admission: binding.admission.clone(),
            },
        };
        let stores = Arc::new(provider::open(call.clone(), &root, &self.record)?);
        let authority = call.clone();
        let journal = Arc::new(ProfileJournal::open(
            &profile,
            context.clone(),
            stores.agent().ok_or_else(invalid)?.scope(),
            Arc::new(move || {
                authority.check().map_err(|_| CaptureError::Rejected)?;
                admit()
            }),
        )?);
        let sink = StoreCapture::new(context, stores, journal).map_err(|_| invalid())?;
        let processor = ManagedCapture::with_native_privacy(binding, privacy, Box::new(sink))
            .map_err(|_| invalid())?;
        call.check()?;
        Ok(processor)
    }
}
