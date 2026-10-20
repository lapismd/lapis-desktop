//! Adapted from JJ Store agent_execution/secrets.rs; OS custody stays device-local.
use std::{io, path::Path, sync::Arc};
use zeroize::Zeroizing;

pub trait Secrets: Send + Sync {
    fn supported(&self) -> bool;
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>>;
    fn set(&self, id: &str, value: &str) -> io::Result<()>;
    fn remove(&self, id: &str) -> io::Result<()>;
}

struct Keychain(String);
pub fn device(root: &Path) -> Arc<dyn Secrets> {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(root.as_os_str().as_encoded_bytes());
    Arc::new(Keychain(format!("org.lapismd.desktop.ai.{digest:x}")))
}

impl Secrets for Keychain {
    fn supported(&self) -> bool {
        cfg!(target_os = "macos")
    }
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>> {
        #[cfg(target_os = "macos")]
        {
            let bytes = Zeroizing::new(
                security_framework::passwords::get_generic_password(&self.0, id).map_err(
                    |error| {
                        if error.code() == -25300 {
                            io::Error::from(io::ErrorKind::NotFound)
                        } else {
                            super::unavailable()
                        }
                    },
                )?,
            );
            Ok(Zeroizing::new(
                String::from_utf8(bytes.to_vec()).map_err(|_| super::unavailable())?,
            ))
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = id;
            Err(super::unavailable())
        }
    }
    fn set(&self, id: &str, value: &str) -> io::Result<()> {
        #[cfg(target_os = "macos")]
        {
            security_framework::passwords::set_generic_password(&self.0, id, value.as_bytes())
                .map_err(|_| super::unavailable())
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = (id, value);
            Err(super::unavailable())
        }
    }
    fn remove(&self, id: &str) -> io::Result<()> {
        #[cfg(target_os = "macos")]
        {
            match security_framework::passwords::delete_generic_password(&self.0, id) {
                Ok(()) => Ok(()),
                Err(error) if error.code() == -25300 => Ok(()),
                Err(_) => Err(super::unavailable()),
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = id;
            Err(super::unavailable())
        }
    }
}
