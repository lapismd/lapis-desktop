use super::denied;
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use std::{
    io,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

pub(super) struct Roots {
    home: PathBuf,
    temporary: PathBuf,
    cache: Mutex<Option<Arc<Cache>>>,
}
struct Cache {
    sanitizer: TranscriptSanitizer,
    _directory: tempfile::TempDir,
}
pub(super) struct Privacy {
    pub sanitizer: Arc<TranscriptSanitizer>,
    _cache: Arc<Cache>,
}
impl Roots {
    /// Native initialization only; no renderer authority or inherited credentials.
    pub fn new(home: PathBuf, temporary: PathBuf) -> io::Result<Self> {
        let home = home.canonicalize()?;
        let temporary = temporary.canonicalize()?;
        if !home.is_dir()
            || !temporary.is_dir()
            || home.parent().is_none()
            || temporary.parent().is_none()
            || home == temporary
        {
            return Err(denied());
        }
        Ok(Self {
            home,
            temporary,
            cache: Mutex::new(None),
        })
    }
    pub fn for_workspace(&self, workspace: &Path, secrets: &[String]) -> io::Result<Privacy> {
        let mut retained = self.cache.lock().map_err(|_| denied())?;
        if retained.is_none() {
            use std::os::unix::fs::{MetadataExt, PermissionsExt};
            let directory = tempfile::Builder::new()
                .prefix("lapis-notes-redaction-")
                .permissions(std::fs::Permissions::from_mode(0o700))
                .tempdir_in(&self.temporary)?;
            let m = std::fs::symlink_metadata(directory.path())?;
            if !m.is_dir() || m.file_type().is_symlink() || m.mode() & 0o077 != 0 {
                return Err(denied());
            }
            let sanitizer =
                TranscriptSanitizer::new(workspace, &self.home, &self.temporary, directory.path())
                    .map_err(|_| denied())?;
            *retained = Some(Arc::new(Cache {
                sanitizer,
                _directory: directory,
            }));
        }
        let cache = retained.as_ref().ok_or_else(denied)?.clone();
        let sanitizer = cache
            .sanitizer
            .for_workspace(workspace)
            .and_then(|value| value.for_secrets(secrets))
            .map_err(|_| denied())?;
        Ok(Privacy {
            sanitizer: Arc::new(sanitizer),
            _cache: cache,
        })
    }
}
