//! Native repository grants independent of AI admission and renderer authority.
pub(crate) mod source;
use crate::vault::{
    VaultManager,
    admission::{AdmissionPlan, RetiredAdmission, VaultAdmissions, VaultLease},
};
use jj_store_model::RepositoryId;
use sha2::{Digest, Sha256};
use source::Source;
use std::{collections::HashMap, io, path::Path};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Grant {
    window: String,
    session: String,
    vault_generation: String,
    generation: u64,
    repository: RepositoryId,
    source: Source,
}
impl Grant {
    pub fn window(&self) -> &str {
        &self.window
    }
    pub fn session(&self) -> &str {
        &self.session
    }
    pub fn generation(&self) -> u64 {
        self.generation
    }
    pub fn repository(&self) -> RepositoryId {
        self.repository
    }
    pub fn metadata_path(&self) -> &Path {
        &self.source.metadata
    }
}
pub struct Plan {
    vault: AdmissionPlan,
    grant: Grant,
    preserve: bool,
}
impl Plan {
    pub fn preserves_reads(&self) -> bool {
        self.preserve
    }
}
#[derive(Default)]
pub struct RepositoryAdmissions {
    backup_sources: HashMap<String, Source>,
    vault: VaultAdmissions,
    grants: HashMap<String, Grant>,
    sequence: u64,
}
impl RepositoryAdmissions {
    pub fn bind_backup(
        &mut self,
        vaults: &VaultManager,
        session: &str,
        state: &Path,
    ) -> io::Result<()> {
        let source = Source::external(vaults.get(session)?.path(), state)?;
        self.backup_sources.insert(session.to_owned(), source);
        Ok(())
    }
    pub fn prepare(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        session: &str,
    ) -> io::Result<Plan> {
        let plan = self.vault.prepare(vaults, window, session)?;
        // Pending vault admission denies reads throughout discovery and cleanup.
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        let source = match self.backup_sources.get(session) {
            Some(source) => {
                source.verify()?;
                source.clone()
            }
            None => Source::capture(root.path())?,
        };
        let descriptor = vaults.descriptor(session)?;
        let mut digest = Sha256::new();
        digest.update(b"lapis-desktop-repository-v1\0");
        digest.update(descriptor.profile_id.as_bytes());
        let identity: [u8; 32] = digest.finalize().into();
        let repository = RepositoryId::new(identity[..16].try_into().unwrap());
        let previous = self.grants.get(window);
        let preserve = plan.preserves_workers()
            && previous
                .is_some_and(|grant| grant.source == source && grant.repository == repository);
        let generation = if preserve {
            previous.unwrap().generation
        } else {
            self.sequence = self.sequence.checked_add(1).ok_or_else(denied)?;
            self.sequence
        };
        let grant = Grant {
            window: window.into(),
            session: session.into(),
            vault_generation: plan.generation().into(),
            generation,
            repository,
            source,
        };
        Ok(Plan {
            vault: plan,
            grant,
            preserve,
        })
    }
    /// The host must drain retired reads before completing a replacement plan.
    pub fn complete(&mut self, vaults: &VaultManager, plan: &Plan) -> io::Result<Grant> {
        plan.grant.source.verify()?;
        let lease = self.vault.complete(vaults, &plan.vault)?;
        if !matches_lease(&plan.grant, &lease) {
            return Err(denied());
        }
        self.grants
            .insert(plan.grant.window.clone(), plan.grant.clone());
        Ok(plan.grant.clone())
    }
    pub fn authorize(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        session: &str,
    ) -> io::Result<Grant> {
        let lease = match self.vault.authorize(vaults, window) {
            Ok(lease) => lease,
            Err(failure) => {
                if failure.retired.is_some() {
                    self.grants.remove(window);
                }
                return Err(failure.error);
            }
        };
        let grant = self.grants.get(window).ok_or_else(denied)?;
        if grant.session != session || !matches_lease(grant, &lease) {
            return Err(denied());
        }
        if grant.source.verify().is_err() {
            self.leave(window, false);
            return Err(denied());
        }
        Ok(grant.clone())
    }
    pub fn check(&mut self, vaults: &VaultManager, grant: &Grant) -> io::Result<()> {
        if self.authorize(vaults, &grant.window, &grant.session)? != *grant {
            return Err(denied());
        }
        Ok(())
    }
    pub fn leave(&mut self, window: &str, reload: bool) -> bool {
        let retained = self.vault.leave(window, reload);
        if !retained {
            self.grants.remove(window);
        }
        retained
    }
    pub fn begin_close_vault(&mut self, session: &str) -> Vec<RetiredAdmission> {
        let retired = self.vault.begin_close_vault(session);
        for entry in &retired {
            if self
                .grants
                .get(&entry.window)
                .is_some_and(|grant| grant.vault_generation == entry.generation)
            {
                self.grants.remove(&entry.window);
            }
        }
        retired
    }
    /// A replacement can activate only after the host drained its predecessor.
    /// Delayed closure must therefore leave a newer active generation intact.
    pub fn retirement_is_current(&self, retired: &RetiredAdmission) -> bool {
        self.grants
            .get(&retired.window)
            .is_none_or(|grant| grant.vault_generation == retired.generation)
    }
    pub fn finish_close_vault(&mut self, session: &str) {
        self.backup_sources.remove(session);
        self.vault.finish_close_vault(session);
    }
}
fn matches_lease(grant: &Grant, lease: &VaultLease) -> bool {
    grant.session == lease.session() && grant.vault_generation == lease.generation()
}
fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Repository admission is unavailable",
    )
}
