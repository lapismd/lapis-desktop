//! Real policy, synthetic durable sink; excluded from ordinary bundles.
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use lapis_desktop::ai::capture::ManagedCapture;
use std::{path::PathBuf, sync::Arc};
use tauri_plugin_lapis_ai::{
    Error, HostContext, Result, SessionBinding,
    runtime::{BatchProcessorFuture, FrameInput, SessionProcessor},
};

struct PrivateCapture {
    inner: ManagedCapture,
    _cache: tempfile::TempDir,
}
impl SessionProcessor for PrivateCapture {
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        self.inner.process_batch(input)
    }
}
pub(super) fn processor(
    context: &HostContext,
    binding: &SessionBinding,
    root: PathBuf,
) -> Result<Box<dyn SessionProcessor>> {
    let unavailable = |_| Error("capture_privacy_unavailable");
    let workspace = root.canonicalize().map_err(unavailable)?;
    let home = PathBuf::from(std::env::var_os("HOME").ok_or(Error("capture_privacy_unavailable"))?)
        .canonicalize()
        .map_err(unavailable)?;
    let temporary = std::env::temp_dir().canonicalize().map_err(unavailable)?;
    let cache = tempfile::tempdir().map_err(unavailable)?;
    let privacy = TranscriptSanitizer::new(&workspace, &home, &temporary, cache.path())
        .and_then(|privacy| privacy.for_secrets(&["fixture-native-secret".into()]))
        .map_err(|_| Error("capture_privacy_unavailable"))?;
    let inner = ManagedCapture::with_native_privacy(
        super::capture::capture_binding(context, binding),
        Arc::new(privacy),
        super::capture::sink(root, &binding.session_id),
    )
    .map_err(|_| Error("capture_unavailable"))?;
    Ok(Box::new(PrivateCapture {
        inner,
        _cache: cache,
    }))
}
