use super::privacy;
use jj_store_model::RequestId;
use lapis_desktop::ai::{capture::ManagedCapture, conversations::messages};
use std::sync::Arc;
use tauri_plugin_lapis_ai::runtime::{
    BatchProcessorFuture, Error, FrameInput, RequestInput, RequestProcessorFuture,
    SessionProcessor, SessionRequest,
};
use uuid::Uuid;

pub(super) struct OwnedCapture {
    pub inner: ManagedCapture,
    pub permit: Arc<super::processing::CapturePermit>,
    pub privacy: privacy::Privacy,
    pub worker: String,
    pub conversation: RequestId,
}
impl SessionProcessor for OwnedCapture {
    fn prepare_request<'a>(&'a mut self, input: RequestInput<'a>) -> RequestProcessorFuture<'a> {
        Box::pin(async move {
            if input.session_id != self.worker {
                return Err(Error("capture_scope_unavailable"));
            }
            let SessionRequest::Prompt { text, .. } = input.request else {
                return self
                    .permit
                    .check()
                    .map_err(|_| Error("capture_scope_unavailable"));
            };
            let request = Uuid::parse_str(input.request_id)
                .ok()
                .filter(|id| id.to_string() == input.request_id)
                .ok_or(Error("invalid_authored_request_identity"))?;
            // WorkerProcessor owns this complete future on its blocking worker.
            // The counted permit and privacy owner survive an abandoned caller.
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))?;
            if !text.trim().is_empty() {
                let write = messages::append(
                    self.permit.call(),
                    self.conversation,
                    RequestId::new(*request.as_bytes()),
                    text.clone(),
                    self.privacy.sanitizer.clone(),
                )
                .await
                .map_err(|_| Error("authored_message_preparation_failed"))?;
                if !write.is_confirmed() {
                    return Err(Error("authored_message_outcome_unknown"));
                }
            }
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))
        })
    }
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        Box::pin(async move {
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))?;
            let output = self.inner.process_batch(input).await?;
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))?;
            Ok(output)
        })
    }
}
