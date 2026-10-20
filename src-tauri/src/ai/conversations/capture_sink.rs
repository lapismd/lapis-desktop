//! Assemble the shared receipt-fenced sink without changing capture formats.
use super::invalid;
use crate::ai::{
    backend::BackendCall,
    capture::ManagedCapture,
    journal::{Admission, ProfileJournal},
};
use jj_agent::NativeCaptureBindingV1;
use jj_collab::ThreadId;
use jj_store_conversations::{
    capture::{Binding, CaptureError},
    native_privacy::{TRANSCRIPT_POLICY, TranscriptSanitizer},
    store_capture::{ContextV1, StoreCapture},
};
use jj_store_core::RepositoryStores;
use jj_store_model::RepositoryId;
use std::{io, sync::Arc};

pub(super) fn processor(
    call: Arc<BackendCall>,
    binding: Binding,
    identity: (RepositoryId, ThreadId),
    stores: Arc<RepositoryStores>,
    privacy: Arc<TranscriptSanitizer>,
    admit: Admission,
) -> io::Result<ManagedCapture> {
    let (profile, _, _) = call.conversation_location()?;
    let context = ContextV1 {
        repository: identity.0,
        thread: identity.1,
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
