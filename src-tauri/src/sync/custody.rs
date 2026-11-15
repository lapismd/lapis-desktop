use lapis_app_core::{
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
        cfg!(target_os = "macos")
    }
    fn read(&self, key: &str) -> io::Result<Option<HostSecretBytes>> {
        self.admit(key)?;
        #[cfg(target_os = "macos")]
        {
            let record =
                match security_framework::passwords::get_generic_password(&self.service, key) {
                    Ok(bytes) => Some(HostSecretBytes::new(bytes)?),
                    Err(error) if error.code() == -25300 => None,
                    Err(_) => return Err(unavailable()),
                };
            self.profile.verify_physical_root()?;
            Ok(record)
        }
        #[cfg(not(target_os = "macos"))]
        Err(unsupported())
    }
    fn write(&self, key: &str, value: &HostSecretBytes) -> io::Result<()> {
        self.admit(key)?;
        #[cfg(target_os = "macos")]
        {
            security_framework::passwords::set_generic_password(
                &self.service,
                key,
                value.expose_secret(),
            )
            .map_err(|_| unavailable())?;
            self.profile.verify_physical_root()
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = value;
            Err(unsupported())
        }
    }
}
#[cfg(target_os = "macos")]
fn unavailable() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Sync account Keychain custody did not complete",
    )
}
#[cfg(not(target_os = "macos"))]
fn unsupported() -> io::Error {
    io::Error::new(
        io::ErrorKind::Unsupported,
        "Sync account OS custody is unavailable on this platform",
    )
}
