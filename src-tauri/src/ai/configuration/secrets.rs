//! AI configuration uses its existing device-local Keychain namespace.
use crate::credentials::{DesktopCredentials, io_error, text};
use lapis_app_core::credentials::{ScopedCredentialStore, SecretBytes, SecretName};
use std::{io, path::Path, sync::Arc};
use zeroize::Zeroizing;

pub trait Secrets: Send + Sync {
    fn supported(&self) -> bool;
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>>;
    fn set(&self, id: &str, value: &str) -> io::Result<()>;
    fn remove(&self, id: &str) -> io::Result<()>;
}

struct Keychain(DesktopCredentials);
pub fn device(root: &Path) -> Arc<dyn Secrets> {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(root.as_os_str().as_encoded_bytes());
    Arc::new(Keychain(DesktopCredentials::keychain(format!(
        "org.lapismd.desktop.ai.{digest:x}"
    ))))
}

impl Secrets for Keychain {
    fn supported(&self) -> bool {
        DesktopCredentials::keychain_supported()
    }
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>> {
        let name = SecretName::new(id).map_err(io_error)?;
        let value = self
            .0
            .get(&name)
            .map_err(io_error)?
            .ok_or(io::ErrorKind::NotFound)?;
        Ok(Zeroizing::new(text(&value).map_err(io_error)?.to_owned()))
    }
    fn set(&self, id: &str, value: &str) -> io::Result<()> {
        let name = SecretName::new(id).map_err(io_error)?;
        let value = SecretBytes::new(value.as_bytes().to_vec()).map_err(io_error)?;
        self.0.set(&name, &value).map_err(io_error)
    }
    fn remove(&self, id: &str) -> io::Result<()> {
        self.0
            .delete(&SecretName::new(id).map_err(io_error)?)
            .map_err(io_error)
    }
}
