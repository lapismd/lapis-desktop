//! Read-only local Codex snapshots. No provider execution or JJ publication.
mod browser_index;
mod browser_preview;
mod browser_types;
mod capture;
mod catalog;
mod codex_preview;
mod index_cache;
mod index_scan;
mod index_selection;
mod lifetime;
mod local_projection;
mod normalization;
mod privacy;
mod projection;
mod snapshot;
mod types;
pub use browser_index::{BrowserSelection, ImportIndex};
pub use browser_preview::BrowserPreview;
pub use browser_types::{
    BrowserSession, FolderPage, Harness, ImportFolder, PreviewPage, SessionPage,
};
pub use capture::{CaptureQueue, CaptureRead};
pub use catalog::{Catalog, discover};
pub use lifetime::{ImportScope, ImportWork};
use sha2::{Digest, Sha256};
pub use snapshot::{preview, preview_for_workspace};
use std::io;
pub use types::{CapturedEntry, CapturedSession, ImportSource, SourceRow};
pub type Check = std::sync::Arc<dyn Fn() -> io::Result<()> + Send + Sync>;
pub(crate) fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Local transcript import is unavailable",
    )
}
pub(crate) fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidData,
        "Local session source is unavailable, changed or exceeds its supported bounds",
    )
}
pub(crate) fn digest(domain: &[u8], value: &[u8]) -> [u8; 32] {
    let mut hash = Sha256::new_with_prefix(domain);
    hash.update(value);
    hash.finalize().into()
}
pub(crate) fn hex(value: &[u8]) -> String {
    value.iter().map(|b| format!("{b:02x}")).collect()
}
pub(crate) fn timestamp(time: std::time::SystemTime) -> io::Result<String> {
    let millis = time
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| invalid())?
        .as_millis();
    chrono::DateTime::from_timestamp_millis(i64::try_from(millis).map_err(|_| invalid())?)
        .map(|time| time.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
        .ok_or_else(invalid)
}
