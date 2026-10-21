use jj_store_capture::transcript_sanitization::TranscriptSanitizer;
use std::{io, path::Path};
#[derive(Clone)]
pub(super) struct Privacy {
    pub sanitizer: TranscriptSanitizer,
    home: std::path::PathBuf,
    _cache: std::sync::Arc<tempfile::TempDir>,
}
impl Privacy {
    pub fn new(workspace: &Path, home: &Path) -> io::Result<Self> {
        use std::os::unix::fs::PermissionsExt;
        let temporary = std::env::temp_dir()
            .canonicalize()
            .map_err(|_| super::invalid())?;
        let cache = tempfile::Builder::new()
            .prefix("lapis-import-privacy-")
            .permissions(std::fs::Permissions::from_mode(0o700))
            .tempdir_in(&temporary)
            .map_err(|_| super::invalid())?;
        // Metadata/unknown-context sources have no distinct workspace root. The private
        // scratch root supplies the unused workspace replacement; home privacy remains exact.
        let workspace = if workspace == home {
            cache.path()
        } else {
            workspace
        };
        let sanitizer = TranscriptSanitizer::new(workspace, home, &temporary, cache.path())
            .map_err(|_| super::invalid())?;
        Ok(Self {
            sanitizer,
            home: home.into(),
            _cache: std::sync::Arc::new(cache),
        })
    }
    pub fn for_workspace(&self, workspace: &Path) -> io::Result<TranscriptSanitizer> {
        if workspace == self.home {
            Ok(self.sanitizer.clone())
        } else {
            self.sanitizer
                .for_workspace(workspace)
                .map_err(|_| super::invalid())
        }
    }
    pub fn scoped(&self, workspace: &Path) -> io::Result<Self> {
        Ok(Self {
            sanitizer: self.for_workspace(workspace)?,
            home: self.home.clone(),
            _cache: self._cache.clone(),
        })
    }
}
pub(super) fn text(sanitizer: &TranscriptSanitizer, value: serde_json::Value) -> Option<String> {
    let payload = sanitizer.sanitize(serde_json::json!({"value":value}))?;
    let value: serde_json::Value = serde_json::from_slice(payload.bytes()).ok()?;
    let value = value.get("value")?;
    Some(
        value
            .as_str()
            .map(str::to_owned)
            .unwrap_or_else(|| value.to_string()),
    )
}
pub(super) fn label(sanitizer: &TranscriptSanitizer, value: &str, fallback: &str) -> String {
    text(sanitizer, serde_json::json!(value))
        .map(|s| {
            s.chars()
                .filter(|c| !c.is_control())
                .take(160)
                .collect::<String>()
        })
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| fallback.into())
}
