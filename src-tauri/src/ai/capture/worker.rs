//! Own the processor on a blocking worker until its admitted operation finishes.
use tauri_plugin_lapis_ai::runtime::{
    BatchProcessorFuture, Error, FrameInput, RequestInput, RequestProcessorFuture, SessionProcessor,
};

/// A missing processor means an operation is in flight or had an uncertain
/// outcome. It is never permission to allocate a replacement or replay input.
pub struct WorkerProcessor {
    inner: Option<Box<dyn SessionProcessor>>,
}
impl WorkerProcessor {
    pub fn new(inner: Box<dyn SessionProcessor>) -> Self {
        Self { inner: Some(inner) }
    }
}
impl SessionProcessor for WorkerProcessor {
    fn prepare_request<'a>(&'a mut self, input: RequestInput<'a>) -> RequestProcessorFuture<'a> {
        Box::pin(async move {
            let mut inner = self
                .inner
                .take()
                .ok_or(Error("native_capture_worker_unavailable"))?;
            let session = input.session_id.to_owned();
            let request_id = input.request_id.to_owned();
            let request = input.request.clone();
            let (inner, result) = tauri::async_runtime::spawn_blocking(move || {
                let result = tauri::async_runtime::block_on(inner.prepare_request(RequestInput {
                    session_id: &session,
                    request_id: &request_id,
                    request: &request,
                }));
                (inner, result)
            })
            .await
            .map_err(|_| Error("native_capture_worker_failed"))?;
            // Runtime retirement also fences failures. Retaining no processor
            // here prevents a direct caller from resuming an uncertain owner.
            if result.is_ok() {
                self.inner = Some(inner);
            }
            result
        })
    }
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        Box::pin(async move {
            let mut inner = self
                .inner
                .take()
                .ok_or(Error("native_capture_worker_unavailable"))?;
            let session = input.session_id.to_owned();
            let ordinal = input.ordinal;
            let publication = input.publication;
            let frame = input.frame.clone();
            let (inner, result) = tauri::async_runtime::spawn_blocking(move || {
                let result = tauri::async_runtime::block_on(inner.process_batch(FrameInput {
                    session_id: &session,
                    ordinal,
                    publication,
                    frame: &frame,
                }));
                (inner, result)
            })
            .await
            .map_err(|_| Error("native_capture_worker_failed"))?;
            if result.is_ok() {
                self.inner = Some(inner);
            }
            result
        })
    }
}
