//! Private token export policy, independent of Tauri dialogs and Core authority.
use std::{
    fs,
    io::{self, Write},
    path::{Path, PathBuf},
};
pub fn destination(path: &Path, vaults: &[PathBuf]) -> io::Result<PathBuf> {
    if !path.is_absolute() {
        return Err(io::Error::other("Choose an absolute token file path"));
    }
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::other("Choose a token file"))?
        .canonicalize()?;
    let destination = parent.join(
        path.file_name()
            .ok_or_else(|| io::Error::other("Choose a token file"))?,
    );
    for vault in vaults {
        if destination.starts_with(vault.canonicalize()?) {
            return Err(io::Error::other("Save credentials outside your vaults"));
        }
    }
    Ok(destination)
}
pub fn write_new(path: &Path, token: &str) -> io::Result<()> {
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(path)?;
    let result = file
        .write_all(token.as_bytes())
        .and_then(|()| file.sync_all());
    if result.is_err() {
        let _ = fs::remove_file(path);
    }
    result
}
pub fn command(origin: &str, path: &Path) -> String {
    let quoted = format!("'{}'", path.display().to_string().replace('\'', "'\\''"));
    format!("lapis --target {origin} --token-file {quoted} vault list")
}
