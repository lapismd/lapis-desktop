use super::{Binding, unavailable};
use std::{io, path::PathBuf};
impl Binding {
    /// Only the native launch policy may use these values. Never return via IPC.
    pub fn launch(&self) -> io::Result<(PathBuf, std::collections::BTreeMap<String, String>)> {
        self.check()?;
        let files = self.files.lock().map_err(|_| unavailable())?;
        let files = files.as_ref().ok_or_else(unavailable)?;
        Ok((
            files.config.clone(),
            std::collections::BTreeMap::from([
                (
                    super::files::SOCKET_ENV.into(),
                    files.path.to_str().ok_or_else(unavailable)?.to_owned(),
                ),
                (
                    super::files::CREDENTIAL_ENV.into(),
                    files.credential.to_string(),
                ),
            ]),
        ))
    }
    pub fn http_launch(&self) -> io::Result<(PathBuf, std::collections::BTreeMap<String, String>)> {
        self.check()?;
        let files = self.files.lock().map_err(|_| unavailable())?;
        let files = files.as_ref().ok_or_else(unavailable)?;
        Ok((
            files.config.with_file_name("http-tools.toml"),
            std::collections::BTreeMap::from([(
                "LAPIS_NOTES_TOOL_HTTP_AUTH".into(),
                format!("Bearer {}", files.credential.as_str()),
            )]),
        ))
    }
}
