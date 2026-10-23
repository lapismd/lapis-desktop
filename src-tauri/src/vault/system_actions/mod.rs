use lapis_app_core::vault::VaultRoot;
use std::{io, path::PathBuf};

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::file_reference;

pub fn resolve(root: &VaultRoot, path: &str) -> io::Result<String> {
    root.action_target(path, true)?
        .verified_path()?
        .into_os_string()
        .into_string()
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "System path is not UTF-8"))
}

pub fn to_relative(root: &VaultRoot, absolute: &str) -> io::Result<Option<String>> {
    let path = std::path::Path::new(absolute);
    if !path.is_absolute() || absolute.len() > 4096 || absolute.contains('\0') {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Expected an absolute file path",
        ));
    }
    // Reject outside prefixes without probing their filesystem metadata.
    let Ok(relative) = path.strip_prefix(root.path()) else {
        return Ok(None);
    };
    let relative = relative
        .to_str()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "System path is not UTF-8"))?;
    match root
        .action_target(relative, true)
        .and_then(|target| target.verified_path())
    {
        Ok(_) => Ok(Some(if relative.is_empty() {
            "/".into()
        } else {
            relative.into()
        })),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

pub fn open(root: &VaultRoot, path: &str) -> io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        macos::open(&root.action_target(path, true)?)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (root, path);
        unsupported()
    }
}

pub fn reveal(root: &VaultRoot, path: &str) -> io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        macos::reveal(&root.action_target(path, true)?)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (root, path);
        unsupported()
    }
}

pub fn trash(root: &VaultRoot, path: &str) -> io::Result<Option<PathBuf>> {
    #[cfg(target_os = "macos")]
    {
        macos::trash(&root.action_target(path, false)?)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (root, path);
        unsupported()
    }
}

#[cfg(not(target_os = "macos"))]
fn unsupported<T>() -> io::Result<T> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "Native file actions are unavailable on this platform",
    ))
}
