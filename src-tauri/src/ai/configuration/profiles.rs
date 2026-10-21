//! Device-only provider configurations scoped to a stable vault/profile pair.
use super::*;

pub fn valid_profile_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}
impl ProviderStore {
    fn profiles_root(&self, vault: &str) -> io::Result<PathBuf> {
        if !valid_profile_id(vault) {
            return Err(unavailable());
        }
        let root = self.root.join("agents");
        for path in [&self.root, &root] {
            if fs::symlink_metadata(path).is_ok_and(|m| !m.is_dir()) {
                return Err(unavailable());
            }
        }
        Ok(root.join(format!("{:x}", Sha256::digest(vault.as_bytes()))))
    }
    pub fn for_agent(&self, vault: &str, id: &str) -> io::Result<Self> {
        if !valid_profile_id(id) {
            return Err(unavailable());
        }
        let root = self.profiles_root(vault)?;
        let destination = root.join(id);
        if !destination.exists() && self.agent_ids(vault)?.len() >= 64 {
            return Err(unavailable());
        }
        for path in [&root, &destination] {
            if fs::symlink_metadata(path).is_ok_and(|m| !m.is_dir()) {
                return Err(unavailable());
            }
        }
        Ok(Self {
            root: destination,
            secrets: self.secrets.clone(),
            gate: self.gate.clone(),
        })
    }
    pub fn agent_ids(&self, vault: &str) -> io::Result<Vec<String>> {
        let root = self.profiles_root(vault)?;
        if fs::symlink_metadata(&root).is_ok_and(|m| !m.is_dir()) {
            return Err(unavailable());
        }
        let entries = match fs::read_dir(root) {
            Ok(entries) => entries,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(vec![]),
            Err(e) => return Err(e),
        };
        let mut ids = Vec::new();
        for entry in entries.take(65) {
            let entry = entry?;
            let id = entry.file_name().into_string().map_err(|_| unavailable())?;
            if !entry.file_type()?.is_dir() || !valid_profile_id(&id) {
                return Err(unavailable());
            }
            ids.push(id);
        }
        if ids.len() > 64 {
            return Err(unavailable());
        }
        ids.sort();
        Ok(ids)
    }
    pub(super) fn credential_id(&self, request: uuid::Uuid) -> String {
        format!(
            "{:x}-{request}",
            Sha256::digest(self.root.as_os_str().as_encoded_bytes())
        )
    }
}
