use super::browser_types::IndexedSession;
use serde::{Deserialize, Serialize};
use std::{io, path::Path};
const LIMIT: u64 = 16 * 1024 * 1024;
#[derive(Serialize, Deserialize)]
struct Cache {
    version: u32,
    home: String,
    rows: Vec<IndexedSession>,
}
pub(super) fn read(directory: &Path, home: &Path) -> Vec<IndexedSession> {
    let path = directory.join("sessions-v1.json");
    let Ok(metadata) = std::fs::symlink_metadata(&path) else {
        return vec![];
    };
    use std::os::unix::fs::PermissionsExt;
    if !metadata.is_file()
        || metadata.file_type().is_symlink()
        || metadata.len() > LIMIT
        || metadata.permissions().mode() & 0o077 != 0
    {
        return vec![];
    }
    let cache = std::fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice::<Cache>(&b).ok());
    let Some(cache) = cache.filter(|c| {
        c.version == 1
            && c.home
                == super::hex(&super::digest(
                    b"lapis/import-home/v1\0",
                    home.as_os_str().as_encoded_bytes(),
                ))
            && c.rows.len() <= 8192
    }) else {
        return vec![];
    };
    cache
        .rows
        .into_iter()
        .filter(|r| {
            r.path.is_absolute()
                && r.directory.is_absolute()
                && r.path.as_os_str().len() <= 4096
                && r.directory.as_os_str().len() <= 4096
                && r.title.len() <= 4096
                && r.native_id.len() <= 128
                && r.group.len() <= 4096
                && r.location.len() <= 4096
                && r.profile.len() <= 80
        })
        .collect()
}
pub(super) fn write(directory: &Path, home: &Path, rows: Vec<IndexedSession>) -> io::Result<()> {
    use std::{io::Write, os::unix::fs::PermissionsExt};
    std::fs::create_dir_all(directory)?;
    let metadata = std::fs::symlink_metadata(directory)?;
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return Err(super::denied());
    }
    std::fs::set_permissions(directory, std::fs::Permissions::from_mode(0o700))?;
    let mut cache = Cache {
        version: 1,
        home: super::hex(&super::digest(
            b"lapis/import-home/v1\0",
            home.as_os_str().as_encoded_bytes(),
        )),
        rows,
    };
    let bytes = loop {
        let bytes = serde_json::to_vec(&cache).map_err(|_| super::invalid())?;
        if bytes.len() as u64 <= LIMIT {
            break bytes;
        }
        cache.rows.truncate(cache.rows.len() / 2);
    };
    let mut temporary = tempfile::NamedTempFile::new_in(directory)?;
    temporary.write_all(&bytes)?;
    temporary.as_file().sync_all()?;
    temporary
        .persist(directory.join("sessions-v1.json"))
        .map_err(|_| super::invalid())?;
    Ok(())
}
