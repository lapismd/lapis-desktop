//! Opaque original-repository read scopes, independent of backup writers.
use super::*;
impl RepositoryAdmissions {
    pub fn original_available(&self, vaults: &VaultManager, session: &str) -> io::Result<bool> {
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        if !root.path().join(".jj").exists() {
            return Ok(false);
        }
        let source = Source::capture(root.path())?;
        Ok(self
            .backup_sources
            .get(session)
            .is_none_or(|backup| backup.metadata != source.metadata))
    }
    pub fn prepare_original(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        session: &str,
    ) -> io::Result<Plan> {
        if !self.original_available(vaults, session)? {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "This vault has no separate original JJ repository",
            ));
        }
        let source = Source::capture(vaults.get(session)?.path())?;
        let previous = self
            .originals
            .values()
            .find(|grant| grant.window == window && grant.session == session);
        if previous.is_some_and(|grant| grant.source != source) {
            return Err(io::Error::other(
                "The original repository changed; reload the vault before reopening history",
            ));
        }
        let plan = self.vault.prepare(vaults, window, session)?;
        let preserve = plan.preserves_workers() && previous.is_some();
        let token = previous
            .and_then(|grant| grant.read_token.clone())
            .unwrap_or_else(|| format!("original:{}", uuid::Uuid::new_v4()));
        let generation = if preserve {
            previous.unwrap().generation
        } else {
            self.sequence = self.sequence.checked_add(1).ok_or_else(denied)?;
            self.sequence
        };
        let mut hash = Sha256::new_with_prefix(b"lapis-desktop-original-repository-v1\0");
        hash.update(vaults.descriptor(session)?.profile_id.as_bytes());
        let identity: [u8; 32] = hash.finalize().into();
        let grant = Grant {
            window: window.into(),
            session: session.into(),
            vault_generation: plan.generation().into(),
            generation,
            repository: RepositoryId::new(identity[..16].try_into().unwrap()),
            source,
            read_token: Some(token),
        };
        Ok(Plan {
            vault: plan,
            grant,
            preserve,
            prior: previous.is_some(),
        })
    }
    pub(super) fn authorize_original(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        token: &str,
    ) -> io::Result<Grant> {
        let grant = self.originals.get(token).cloned().ok_or_else(denied)?;
        if grant.window != window {
            return Err(denied());
        }
        let lease = self
            .vault
            .authorize(vaults, window)
            .map_err(|failure| failure.error)?;
        if !matches_lease(&grant, &lease) || grant.source.verify().is_err() {
            return Err(denied());
        }
        Ok(grant)
    }
}
