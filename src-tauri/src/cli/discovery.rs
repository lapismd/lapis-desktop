//! Secret-free discovery for a credential explicitly exported by the owner.
use std::{
    fs, io,
    path::{Path, PathBuf},
};

#[cfg(unix)]
fn directory(home: &Path) -> io::Result<PathBuf> {
    use std::os::unix::fs::{DirBuilderExt, MetadataExt};
    let mut path = home.canonicalize()?;
    for component in [".local", "state", "lapis"] {
        path.push(component);
        match fs::DirBuilder::new().mode(0o700).create(&path) {
            Ok(()) => (),
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => (),
            Err(e) => return Err(e),
        }
        let metadata = fs::symlink_metadata(&path)?;
        if !metadata.is_dir()
            || metadata.uid() != rustix::process::geteuid().as_raw()
            || metadata.mode() & 0o022 != 0
        {
            return Err(io::Error::other(
                "Desktop discovery directory is not private",
            ));
        }
    }
    Ok(path)
}

#[cfg(unix)]
pub fn publish(home: &Path, origin: &str, token_file: &Path) -> io::Result<()> {
    use std::io::Write;
    let directory = directory(home)?;
    let mut record = tempfile::NamedTempFile::new_in(&directory)?;
    let bytes = serde_json::to_vec(&serde_json::json!({
        "version": 1, "origin": origin, "token_file": token_file
    }))?;
    if bytes.len() > 16384 {
        return Err(io::Error::other("Desktop connection record is too large"));
    }
    record.write_all(&bytes)?;
    record.as_file().sync_all()?;
    record
        .persist(directory.join("desktop.json"))
        .map_err(|e| e.error)?;
    Ok(())
}
#[cfg(not(unix))]
pub fn publish(_: &Path, _: &str, _: &Path) -> io::Result<()> {
    // Preserve explicit file export; automatic discovery needs OS custody.
    Ok(())
}

pub fn retire(home: &Path) -> io::Result<()> {
    #[cfg(unix)]
    {
        match fs::remove_file(directory(home)?.join("desktop.json")) {
            Ok(()) => (),
            Err(e) if e.kind() == io::ErrorKind::NotFound => (),
            Err(e) => return Err(e),
        }
    }
    Ok(())
}
