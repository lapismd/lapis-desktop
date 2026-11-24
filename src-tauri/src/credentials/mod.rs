//! OS credential persistence for Desktop. Callers supply host-selected scopes.

use jj_forge::accounts::store::{ScopedNativeSecrets, SecretStore};
use lapis_app_core::credentials::{
    CredentialError, ScopedCredentialStore, SecretBytes, SecretName,
};
use std::io;
use std::{path::Path, sync::Arc};

pub fn plugin_scope(
    profile: &Path,
    plugin: &SecretName,
) -> Result<Arc<dyn ScopedCredentialStore>, CredentialError> {
    use sha2::{Digest, Sha256};
    if !DesktopCredentials::keychain_supported() {
        return Err(CredentialError::Unavailable);
    }
    let profile = Sha256::digest(profile.as_os_str().as_encoded_bytes());
    let id = Sha256::digest(plugin.as_str().as_bytes());
    Ok(Arc::new(DesktopCredentials::keychain(format!(
        "org.lapismd.desktop.plugin-secrets.v1.{profile:x}.{id:x}"
    ))))
}

pub(crate) enum DesktopCredentials {
    // Keep the exact Keychain domain used by the existing Forge integration.
    Repository(ScopedNativeSecrets),
    Keychain(String),
}

impl DesktopCredentials {
    pub(crate) fn repository(service: &'static str) -> Self {
        Self::Repository(ScopedNativeSecrets::new(service))
    }

    pub(crate) fn keychain(service: String) -> Self {
        Self::Keychain(service)
    }

    pub(crate) fn keychain_supported() -> bool {
        cfg!(target_os = "macos")
    }
}

impl ScopedCredentialStore for DesktopCredentials {
    fn get(&self, name: &SecretName) -> Result<Option<SecretBytes>, CredentialError> {
        let raw = match self {
            Self::Repository(store) => store
                .get(name.as_str())
                .map_err(repository_error)?
                .map(String::into_bytes),
            Self::Keychain(service) => keychain::get(service, name.as_str())?,
        };
        raw.map(SecretBytes::new).transpose()
    }

    fn set(&self, name: &SecretName, value: &SecretBytes) -> Result<(), CredentialError> {
        match self {
            Self::Repository(store) => store
                .set(name.as_str(), text(value)?)
                .map_err(repository_error),
            Self::Keychain(service) => keychain::set(service, name.as_str(), value.expose_secret()),
        }
    }

    fn delete(&self, name: &SecretName) -> Result<(), CredentialError> {
        match self {
            Self::Repository(store) => store.remove(name.as_str()).map_err(repository_error),
            Self::Keychain(service) => keychain::delete(service, name.as_str()),
        }
    }
}

impl SecretStore for DesktopCredentials {
    fn get(&self, id: &str) -> jj_forge::Result<Option<String>> {
        let name = SecretName::new(id).map_err(forge_error)?;
        ScopedCredentialStore::get(self, &name)
            .map_err(forge_error)?
            .map(|value| text(&value).map(str::to_owned).map_err(forge_error))
            .transpose()
    }

    fn set(&self, id: &str, value: &str) -> jj_forge::Result<()> {
        let name = SecretName::new(id).map_err(forge_error)?;
        let secret = SecretBytes::new(value.as_bytes().to_vec()).map_err(forge_error)?;
        ScopedCredentialStore::set(self, &name, &secret).map_err(forge_error)
    }

    fn remove(&self, id: &str) -> jj_forge::Result<()> {
        let name = SecretName::new(id).map_err(forge_error)?;
        ScopedCredentialStore::delete(self, &name).map_err(forge_error)
    }
}

pub(crate) fn text(value: &SecretBytes) -> Result<&str, CredentialError> {
    std::str::from_utf8(value.expose_secret()).map_err(|_| CredentialError::Unavailable)
}

pub(crate) fn io_error(error: CredentialError) -> io::Error {
    match error {
        CredentialError::InvalidInput => io::Error::new(io::ErrorKind::InvalidInput, error),
        CredentialError::Locked => io::Error::new(io::ErrorKind::PermissionDenied, error),
        CredentialError::Unavailable => io::Error::new(io::ErrorKind::Unsupported, error),
    }
}

fn repository_error(error: jj_forge::Error) -> CredentialError {
    match error {
        jj_forge::Error::Unsupported => CredentialError::Unavailable,
        _ => CredentialError::Locked,
    }
}

fn forge_error(error: CredentialError) -> jj_forge::Error {
    match error {
        CredentialError::InvalidInput => jj_forge::Error::Invalid,
        CredentialError::Locked => jj_forge::Error::State,
        CredentialError::Unavailable => jj_forge::Error::Unsupported,
    }
}

mod keychain;
