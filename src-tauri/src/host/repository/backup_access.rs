//! Admitted backup access used by host-owned search and storage adapters.
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::Binding;
use std::{io, path::Path};
pub(super) fn failure(message: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Remote backup: {message}")).into()
}
pub(super) async fn bound<T: Send + 'static>(
    host: NativeHost,
    session: String,
    binding: Binding,
    action: impl FnOnce(&Binding) -> io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    access(host, move |s| {
        s.vaults.get(&session)?.verify_physical_root()?;
        let descriptor = s.vaults.descriptor(&session)?;
        if descriptor.profile_id != binding.vault_id
            || Path::new(&descriptor.path) != binding.root.as_path()
        {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Vault source changed",
            ));
        }
        action(&binding)
    })
    .await
}
pub(super) fn runtime() -> io::Result<tokio::runtime::Runtime> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
}
