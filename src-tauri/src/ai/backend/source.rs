//! Native source policy is fixed before opening a backend; discovery never writes.
use super::{VaultLease, storage};
use crate::{
    repository::{source::Source, storage::Locations},
    vault::VaultDescriptor,
};
use std::io;

pub(super) enum Selection {
    Workspace,
    Vault(Locations, VaultDescriptor),
}
impl Selection {
    fn binding(&self, lease: &VaultLease) -> io::Result<Option<jj_vault::Binding>> {
        let Self::Vault(locations, vault) = self else {
            return Ok(None);
        };
        if vault.session_id != lease.session()
            || vault.profile_id != lease.profile()
            || std::path::Path::new(&vault.path) != lease.root()
        {
            return Err(storage::denied());
        }
        let binding = locations.binding(vault)?;
        binding.validate().map_err(|_| storage::denied())?;
        Ok(Some(binding))
    }
    pub fn capture(&self, lease: &VaultLease) -> io::Result<Source> {
        match self.binding(lease)? {
            Some(binding) => Source::managed(&binding),
            None => Source::capture(lease.root()),
        }
    }
    pub fn check(&self, lease: &VaultLease, source: &Source) -> io::Result<()> {
        // A pending move fences retained calls even while the old bytes exist.
        if let Some(binding) = self.binding(lease)?
            && binding.metadata() != source.metadata
        {
            return Err(storage::denied());
        }
        source.verify()
    }
}
