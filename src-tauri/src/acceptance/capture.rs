//! Synthetic native capture policy; no ordinary build or application data.
use jj_store_conversations::{
    capture::{Binding, CaptureBatch, CaptureError, DurableCapture, NativeCapture, Receipt},
    privacy::Sanitizer,
};
use serde_json::Value;
use std::{
    fs::{File, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::Arc,
};
use tauri_plugin_lapis_ai::{
    Error, HostContext, Result, SessionBinding, runtime::SessionProcessor,
};

struct Privacy;
impl Sanitizer for Privacy {
    fn sanitize(&self, value: Value) -> jj_store_conversations::Result<Value> {
        serde_json::from_str(
            &value
                .to_string()
                .replace("fixture-native-secret", "[captured]"),
        )
        .map_err(|_| jj_store_conversations::Error::Unavailable)
    }
    fn replace_stream_text(
        &self,
        pending: &mut String,
        chunk: &str,
        complete: bool,
    ) -> jj_store_conversations::Result<String> {
        pending.push_str(chunk);
        Ok(if complete {
            std::mem::take(pending).replace("fixture-native-secret", "[captured]")
        } else {
            String::new()
        })
    }
}
struct Sink {
    root: PathBuf,
    worker: String,
}
#[async_trait::async_trait]
impl DurableCapture for Sink {
    async fn persist(
        &mut self,
        batch: &CaptureBatch,
    ) -> std::result::Result<Receipt, CaptureError> {
        let write = || -> std::io::Result<()> {
            let mut file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(self.root.join(format!("capture-{}.jsonl", self.worker)))?;
            file.write_all(batch.bytes())?;
            file.write_all(b"\n")?;
            file.sync_all()?;
            File::open(&self.root)?.sync_all()
        };
        write().map_err(|_| CaptureError::Unknown)?;
        if self.root.join("withhold-terminal-receipt").exists()
            && batch
                .frames()
                .last()
                .is_some_and(|frame| frame["type"] == "record")
        {
            return Err(CaptureError::Unknown);
        }
        Ok(batch.receipt())
    }
}
pub fn processor(
    context: &HostContext,
    binding: &SessionBinding,
    root: PathBuf,
) -> Result<Box<dyn SessionProcessor>> {
    let capture = NativeCapture::new(
        Binding {
            scope: "acceptance-profile".into(),
            worker: binding.session_id.clone(),
            request: binding.request_id.clone(),
            target: binding.target_id.clone(),
            window: context.window.clone(),
            admission: binding.admission.clone(),
        },
        "synthetic-native-capture/v1".into(),
        Arc::new(Privacy),
        Box::new(Sink {
            root,
            worker: binding.session_id.clone(),
        }),
    )
    .map_err(|_| Error("capture_unavailable"))?;
    Ok(Box::new(lapis_desktop::ai::capture::ManagedCapture::new(
        capture,
    )))
}
