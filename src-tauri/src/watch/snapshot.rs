use super::WatchChange;
use crate::vault::VaultRoot;
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    io,
    time::SystemTime,
};

#[derive(Clone, Debug, PartialEq, Eq)]
pub(super) struct Stamp {
    directory: bool,
    size: u64,
    modified: Option<SystemTime>,
    identity: Option<(u64, u64)>,
}
pub(super) type Snapshot = BTreeMap<String, Stamp>;

pub(super) fn validate_root(root: &VaultRoot) -> io::Result<()> {
    let ambient = std::fs::symlink_metadata(root.path())?;
    if !ambient.is_dir() || ambient.file_type().is_symlink() {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Watched root changed",
        ));
    }
    #[cfg(unix)]
    {
        use cap_std::fs::MetadataExt as CapMetadataExt;
        use std::os::unix::fs::MetadataExt;
        let owned = root.dir.dir_metadata()?;
        if (ambient.dev(), ambient.ino()) != (owned.dev(), owned.ino()) {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Watched root identity changed",
            ));
        }
    }
    Ok(())
}

pub(super) fn read(
    root: &VaultRoot,
    scope: &str,
    recursive: bool,
    ignored_names: &[String],
    backup_content: bool,
) -> io::Result<Snapshot> {
    validate_root(root)?;
    let mut pending = vec![scope.to_owned()];
    let mut cost = scope.len() + 96;
    let mut entries = Snapshot::new();
    while let Some(path) = pending.pop() {
        if super::ignored(&path, ignored_names, backup_content) {
            continue;
        }
        let relative = root.checked(&path, path.is_empty())?;
        let metadata = match root.dir.symlink_metadata(relative) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error),
        };
        if metadata.file_type().is_symlink() || !(metadata.is_file() || metadata.is_dir()) {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Unsupported watched entry",
            ));
        }
        #[cfg(unix)]
        let identity = {
            use cap_std::fs::MetadataExt;
            Some((metadata.dev(), metadata.ino()))
        };
        #[cfg(not(unix))]
        let identity = None;
        let directory = metadata.is_dir();
        entries.insert(
            path.clone(),
            Stamp {
                directory,
                size: metadata.len(),
                modified: metadata.modified().ok().map(|t| t.into_std()),
                identity,
            },
        );
        if directory && (recursive || path == scope) {
            let listed = root.list(&path)?;
            for name in listed.files.into_iter().chain(listed.folders) {
                let next = if path.is_empty() {
                    name
                } else {
                    format!("{path}/{name}")
                };
                cost += next.len() + 96;
                if cost > 16 * 1024 * 1024 || entries.len() + pending.len() >= 100_000 {
                    return Err(io::Error::new(
                        io::ErrorKind::OutOfMemory,
                        "Watch snapshot exceeds its bounded capacity",
                    ));
                }
                pending.push(next);
            }
        }
    }
    Ok(entries)
}

pub(super) fn changes(
    old: &Snapshot,
    new: &Snapshot,
    forced: &HashSet<String>,
) -> Vec<WatchChange> {
    let mut removed = HashMap::new();
    let mut additions = HashMap::new();
    for (path, stamp) in old.iter().filter(|(path, _)| !new.contains_key(*path)) {
        if let Some(id) = stamp.identity {
            removed
                .entry(id)
                .and_modify(|value| *value = None)
                .or_insert(Some(path.clone()));
        }
    }
    for stamp in new
        .iter()
        .filter(|(path, _)| !old.contains_key(*path))
        .map(|(_, stamp)| stamp)
    {
        if let Some(id) = stamp.identity {
            *additions.entry(id).or_insert(0_usize) += 1;
        }
    }
    let mut result = Vec::new();
    for path in old
        .keys()
        .filter(|path| !new.contains_key(*path) && !path.is_empty())
    {
        result.push(WatchChange {
            r#type: "delete",
            path: path.clone(),
            previous_path: None,
        });
    }
    for (path, stamp) in new {
        if path.is_empty() {
            continue;
        }
        match old.get(path) {
            None => {
                let previous_path = stamp
                    .identity
                    .filter(|id| additions.get(id) == Some(&1))
                    .and_then(|id| removed.get(&id).cloned().flatten());
                result.push(WatchChange {
                    r#type: "create",
                    path: path.clone(),
                    previous_path,
                });
            }
            Some(previous) if previous != stamp || (!stamp.directory && forced.contains(path)) => {
                result.push(WatchChange {
                    r#type: "modify",
                    path: path.clone(),
                    previous_path: None,
                });
            }
            _ => {}
        }
    }
    result
}
