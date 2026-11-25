use lapis_app_core::credentials::CredentialError;

#[cfg(target_os = "macos")]
const ITEM_NOT_FOUND: i32 = -25300;

pub(super) fn get(service: &str, name: &str) -> Result<Option<Vec<u8>>, CredentialError> {
    #[cfg(target_os = "macos")]
    {
        return match security_framework::passwords::get_generic_password(service, name) {
            Ok(secret) => Ok(Some(secret)),
            Err(error) if error.code() == ITEM_NOT_FOUND => Ok(None),
            Err(_) => Err(CredentialError::Locked),
        };
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (service, name);
        Err(CredentialError::Unavailable)
    }
}

pub(super) fn set(service: &str, name: &str, secret: &[u8]) -> Result<(), CredentialError> {
    #[cfg(target_os = "macos")]
    {
        return security_framework::passwords::set_generic_password(service, name, secret)
            .map_err(|_| CredentialError::Locked);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (service, name, secret);
        Err(CredentialError::Unavailable)
    }
}

pub(super) fn delete(service: &str, name: &str) -> Result<(), CredentialError> {
    #[cfg(target_os = "macos")]
    {
        match security_framework::passwords::delete_generic_password(service, name) {
            Ok(()) => Ok(()),
            Err(error) if error.code() == ITEM_NOT_FOUND => Ok(()),
            Err(_) => Err(CredentialError::Locked),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (service, name);
        Err(CredentialError::Unavailable)
    }
}
