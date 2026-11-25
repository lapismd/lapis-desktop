use crate::credentials::{DesktopCredentials, io_error};
use lapis_app_core::{
    credentials::{ScopedCredentialStore, SecretBytes, SecretName},
    sync::account::protected::{HostAccountCustody, HostSecretBytes},
    vault::VaultRoot,
};
use sha2::{Digest, Sha256};
use std::io;

/// Native-only OS port. The captured profile cannot be replaced by an IPC path.
/// This type deliberately implements neither Debug nor Serialize.
pub struct AccountCustody {
    profile: VaultRoot,
    service: String,
}
impl AccountCustody {
    pub fn for_profile(profile: &VaultRoot) -> io::Result<Self> {
        profile.verify_physical_root()?;
        let (device, inode) = profile.physical_identity()?;
        let mut digest = Sha256::new();
        digest.update(b"lapis-desktop-sync-account-custody-v1\0");
        digest.update(device.to_le_bytes());
        digest.update(inode.to_le_bytes());
        digest.update(profile.path().as_os_str().as_encoded_bytes());
        let result = Self {
            profile: profile.try_clone()?,
            service: format!(
                "org.lapismd.desktop.sync.account.v1.{:x}",
                digest.finalize()
            ),
        };
        result.profile.verify_physical_root()?;
        Ok(result)
    }
    /// Public namespace metadata for native diagnostics and isolated OS cleanup.
    /// No secret, arbitrary lookup or renderer capability is returned.
    pub fn service_name(&self) -> &str {
        &self.service
    }
    fn admit(&self, key: &str) -> io::Result<()> {
        self.profile.verify_physical_root()?;
        if !key
            .strip_prefix("lapis.sync.account.v1.")
            .is_some_and(|id| {
                id.len() == 64
                    && id
                        .bytes()
                        .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
            })
        {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid Sync account custody scope",
            ));
        }
        Ok(())
    }
}
impl HostAccountCustody for AccountCustody {
    fn supported(&self) -> bool {
        DesktopCredentials::keychain_supported()
    }
    fn read(&self, key: &str) -> io::Result<Option<HostSecretBytes>> {
        self.admit(key)?;
        let store = DesktopCredentials::keychain(self.service.clone());
        let name = SecretName::new(key).map_err(io_error)?;
        let record = store
            .get(&name)
            .map_err(io_error)?
            .map(|value| HostSecretBytes::new(value.expose_secret().to_vec()))
            .transpose()?;
        self.profile.verify_physical_root()?;
        Ok(record)
    }
    fn write(&self, key: &str, value: &HostSecretBytes) -> io::Result<()> {
        self.admit(key)?;
        let store = DesktopCredentials::keychain(self.service.clone());
        let name = SecretName::new(key).map_err(io_error)?;
        let value = SecretBytes::new(value.expose_secret().to_vec()).map_err(io_error)?;
        store.set(&name, &value).map_err(io_error)?;
        self.profile.verify_physical_root()
    }
}
