#![forbid(unsafe_code)]
#[cfg(not(debug_assertions))]
compile_error!("The custody probe is restricted to debug acceptance artifacts");

#[cfg(target_os = "macos")]
mod native {
    use lapis_app_core::{
        sync::account::protected::{HostAccountCustody, HostSecretBytes},
        vault::VaultRoot,
    };
    use lapis_desktop::sync::custody::AccountCustody;
    use serde_json::{Value, json};
    use std::{io, path::PathBuf};

    const KEY: &str =
        "lapis.sync.account.v1.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const PAYLOAD: &[u8] = b"lapis-sync-task-owned-keychain-probe-v1";

    fn denied() -> io::Error {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Explicit isolated native custody probe required",
        )
    }

    pub fn run() -> io::Result<Value> {
        if std::env::var("LAPIS_DESKTOP_NATIVE_LANE").as_deref() != Ok("1") {
            return Err(denied());
        }
        let arguments: Vec<_> = std::env::args().skip(1).collect();
        if arguments.len() != 1 || !["store", "read", "cleanup"].contains(&arguments[0].as_str()) {
            return Err(denied());
        }
        let allowed = std::fs::canonicalize(".local/native-test")?;
        let path =
            PathBuf::from(std::env::var_os("LAPIS_DESKTOP_SYNC_CUSTODY_ROOT").ok_or_else(denied)?);
        let path = std::fs::canonicalize(path)?;
        if !path.starts_with(allowed)
            || !path
                .parent()
                .and_then(|parent| parent.file_name())
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with("sync-custody-"))
            || !path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| ["profile", "other-profile"].contains(&name))
        {
            return Err(denied());
        }
        // This is process-local and restored on drop; never prompt from API tests.
        let _interaction =
            security_framework::os::macos::keychain::SecKeychain::disable_user_interaction()
                .map_err(|_| denied())?;
        let root = VaultRoot::open(&path)?;
        let custody = AccountCustody::for_profile(&root)?;
        match arguments[0].as_str() {
            "store" => {
                if custody.read(KEY)?.is_some() {
                    return Err(denied());
                }
                custody.write(KEY, &HostSecretBytes::new(PAYLOAD.to_vec())?)?;
                Ok(json!({"stored": true, "service": custody.service_name()}))
            }
            "read" => {
                let value = custody.read(KEY)?;
                if value
                    .as_ref()
                    .is_some_and(|value| value.expose_secret() != PAYLOAD)
                {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        "Unexpected isolated test value",
                    ));
                }
                Ok(json!({"present": value.is_some()}))
            }
            "cleanup" => {
                match security_framework::passwords::delete_generic_password(
                    custody.service_name(),
                    KEY,
                ) {
                    Ok(()) => (),
                    Err(error) if error.code() == -25300 => (),
                    Err(_) => {
                        return Err(io::Error::new(
                            io::ErrorKind::PermissionDenied,
                            "Isolated custody cleanup did not complete",
                        ));
                    }
                }
                if custody.read(KEY)?.is_some() {
                    return Err(denied());
                }
                Ok(json!({"removed": true}))
            }
            _ => Err(denied()),
        }
    }
}

fn main() {
    #[cfg(target_os = "macos")]
    match native::run() {
        Ok(value) => println!("{value}"),
        Err(error) => {
            eprintln!("Native Sync custody probe failed: {error}");
            std::process::exit(1);
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        eprintln!("The isolated custody probe requires macOS");
        std::process::exit(1);
    }
}
