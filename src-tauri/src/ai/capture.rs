//! Native runtime adaptation; the caller injects admitted privacy and durability.
mod worker;
use jj_store_conversations::{
    capture::{Binding, CaptureError, DurableCapture, Input, NativeCapture, Publication},
    native_privacy::TranscriptSanitizer,
};
use std::sync::Arc;
use tauri_plugin_lapis_ai::runtime::{
    BatchProcessorFuture, Error, FrameBatch, FrameInput, FramePublication, SessionProcessor,
};
pub use worker::WorkerProcessor;

pub struct ManagedCapture(NativeCapture);
impl ManagedCapture {
    pub fn with_native_privacy(
        binding: Binding,
        privacy: Arc<TranscriptSanitizer>,
        sink: Box<dyn DurableCapture>,
    ) -> Result<Self, CaptureError> {
        NativeCapture::with_native_privacy(binding, privacy, sink).map(Self)
    }
    pub fn new(capture: NativeCapture) -> Self {
        Self(capture)
    }
}
impl SessionProcessor for ManagedCapture {
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        Box::pin(async move {
            let publication = match input.publication {
                FramePublication::Facts => Publication::Facts,
                FramePublication::Event { sequence } => Publication::Event { sequence },
            };
            let batch = self
                .0
                .capture(Input {
                    worker: input.session_id,
                    ordinal: input.ordinal,
                    publication,
                    frame: input.frame,
                })
                .await
                .map_err(|failure| {
                    Error(match failure {
                        CaptureError::Unknown => "native_capture_unknown",
                        CaptureError::ReceiptMismatch => "native_capture_receipt_mismatch",
                        _ => "native_capture_unavailable",
                    })
                })?;
            FrameBatch::from_frames(batch.into_frames())
        })
    }
}
