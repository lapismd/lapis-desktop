//! Installation inputs and OS adapters; Core owns repository remote policy.
use super::credentials::DesktopTokens;
use cap_std::fs::PermissionsExt as _;
use jj_forge::accounts::{Manager, store::ScopedNativeSecrets};
use lapis_app_core::{
    services::{NativeRemoteCredentials, RemoteStorage},
    vault::VaultRoot,
};
use lapis_app_protocol::repository_remotes::RemoteHost;
use std::{
    io,
    os::unix::fs::{MetadataExt as _, PermissionsExt as _},
    path::Path,
    process::{Command, Stdio},
    sync::Arc,
};

pub fn open(profile: &Path, transfers: bool) -> io::Result<RemoteStorage> {
    let profile = VaultRoot::open(profile)?;
    let root = child(&profile, "repository-remotes")?;
    let tokens = child(&root, "tokens")?;
    let selection = child(&root, "selection")?;
    let forges = child(&profile, "forge-accounts")?;
    let client_id = jj_forge::accounts::native()
        .ok()
        .and_then(|manager| manager.client_id.clone());
    let accounts = Arc::new(Manager::new(
        forges.path().into(),
        Arc::new(ScopedNativeSecrets::new("md.lapis.desktop.forge.v1")),
        Arc::new(jj_forge::accounts::http::Http),
        client_id,
    ));
    let tokens = Arc::new(DesktopTokens::open(
        tokens.path(),
        Arc::new(ScopedNativeSecrets::new("md.lapis.desktop.repository.v1")),
    )?);
    let ssh = Command::new("ssh")
        .arg("-V")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .is_ok_and(|s| s.success());
    let credentials = Arc::new(NativeRemoteCredentials::new(
        RemoteHost::Desktop,
        tokens,
        accounts,
        ssh,
    ));
    RemoteStorage::new(selection.path(), credentials)
        .map(|s| s.with_transfers(transfers))
        .map_err(io::Error::other)
}
fn child(parent: &VaultRoot, name: &str) -> io::Result<VaultRoot> {
    parent.verify_physical_root()?;
    let root = match parent.create_child(name) {
        Ok(root) => {
            root.directory_handle()?
                .open(".")?
                .into_std()
                .set_permissions(std::fs::Permissions::from_mode(0o700))?;
            root
        }
        Err(error) if error.kind() == io::ErrorKind::AlreadyExists => {
            let witness = parent.open_directory(name)?.into_std_file().metadata()?;
            let expected = parent.path().join(name);
            let root = VaultRoot::open(&expected)?;
            if root.path() != expected
                || root.physical_identity()? != (witness.dev(), witness.ino())
            {
                return Err(unavailable());
            }
            root
        }
        Err(error) => return Err(error),
    };
    if root
        .directory_handle()?
        .dir_metadata()?
        .permissions()
        .mode()
        & 0o077
        != 0
    {
        return Err(unavailable());
    }
    parent.verify_physical_root()?;
    root.verify_physical_root()?;
    Ok(root)
}
fn unavailable() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Repository installation storage is unavailable",
    )
}
