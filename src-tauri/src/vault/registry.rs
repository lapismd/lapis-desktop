//! Durable identity catalog; recent-vault display eviction never deletes identity.
use super::{invalid, profiles::RecentVault};
use cap_std::fs::Dir;
use cap_tempfile::TempFile;
use std::io::{self, Write as _};

pub(super) fn load(directory: &Dir, legacy: &[RecentVault]) -> io::Result<Vec<RecentVault>> {
    let entries: Vec<RecentVault> = match directory.read("vault-registry.json") {
        Ok(bytes) if bytes.len() <= 4 * 1024 * 1024 => serde_json::from_slice(&bytes)
            .map_err(|_| invalid("Vault identity registry is invalid"))?,
        Ok(_) => return Err(invalid("Vault identity registry is too large")),
        Err(error) if error.kind() == io::ErrorKind::NotFound => legacy.to_vec(),
        Err(error) => return Err(error),
    };
    if entries.len() > 4096 {
        return Err(invalid("Vault identity registry is full"));
    }
    let mut ids = std::collections::HashSet::new();
    if entries.iter().any(|entry| !ids.insert(&entry.id)) {
        return Err(invalid(
            "Vault identity registry contains duplicate identities",
        ));
    }
    Ok(entries)
}
pub(super) fn save(directory: &Dir, entries: &[RecentVault]) -> io::Result<()> {
    if entries.len() > 4096 {
        return Err(invalid("Vault identity registry is full"));
    }
    let bytes = serde_json::to_vec(entries)?;
    if bytes.len() > 4 * 1024 * 1024 {
        return Err(invalid("Vault identity registry is too large"));
    }
    let mut staged = TempFile::new(directory)?;
    staged.write_all(&bytes)?;
    staged.as_file().sync_all()?;
    staged.replace("vault-registry.json")?;
    Ok(())
}
