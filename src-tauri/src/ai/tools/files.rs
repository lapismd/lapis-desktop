use std::{io, os::unix::fs::PermissionsExt, path::PathBuf};
use tempfile::TempDir;
use uuid::Uuid;
use zeroize::Zeroizing;

pub(super) const SOCKET_ENV: &str = "LAPIS_NOTES_TOOL_SOCKET";
pub(super) const CREDENTIAL_ENV: &str = "LAPIS_NOTES_TOOL_CREDENTIAL";
pub(super) struct Files {
    _directory: TempDir,
    pub path: PathBuf,
    pub config: PathBuf,
    pub credential: Zeroizing<String>,
    pub listener: Option<std::os::unix::net::UnixListener>,
}
impl Files {
    pub fn cleanup(&self) -> io::Result<()> {
        match std::fs::remove_dir_all(self._directory.path()) {
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
            result => result,
        }
    }
    pub fn create() -> io::Result<Self> {
        let directory = tempfile::Builder::new().prefix("lapis-tools-").tempdir()?;
        std::fs::set_permissions(directory.path(), std::fs::Permissions::from_mode(0o700))?;
        let path = directory.path().join("bridge.sock");
        let listener = std::os::unix::net::UnixListener::bind(&path)?;
        listener.set_nonblocking(true)?;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
        let config = directory.path().join("tools.toml");
        let executable = std::env::current_exe()?;
        // JSON quoted strings are a strict subset of TOML basic strings here.
        let command = serde_json::to_string(executable.to_str().ok_or_else(super::unavailable)?)
            .map_err(|_| super::unavailable())?;
        let text = format!(
            "[[tools]]\nname = \"lapis-tools\"\ncommand = {command}\nargs = [\"--app-tools-stdio\"]\n[[tools.env]]\nname = \"{SOCKET_ENV}\"\nenv = \"{SOCKET_ENV}\"\n[[tools.env]]\nname = \"{CREDENTIAL_ENV}\"\nenv = \"{CREDENTIAL_ENV}\"\n"
        );
        std::fs::write(&config, text)?;
        std::fs::set_permissions(&config, std::fs::Permissions::from_mode(0o600))?;
        Ok(Self {
            _directory: directory,
            path,
            config,
            credential: Zeroizing::new(format!(
                "{}{}",
                Uuid::new_v4().simple(),
                Uuid::new_v4().simple()
            )),
            listener: Some(listener),
        })
    }
}
