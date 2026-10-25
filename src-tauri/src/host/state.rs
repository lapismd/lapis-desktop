use lapis_desktop::{database::NativeDatabases, vault::VaultManager, watch::WatchRegistry};
use serde::Serialize;
use std::{
    io,
    sync::{Arc, Mutex},
};
use tauri::Manager;

pub struct NativeServices {
    pub repository: lapis_desktop::repository::RepositoryAdmissions,
    pub imports: lapis_desktop::vault::admission::VaultAdmissions,
    pub ai: lapis_desktop::vault::admission::VaultAdmissions,
    pub vaults: VaultManager,
    pub core_vaults: lapis_desktop::vault::services::VaultServices,
    pub databases: NativeDatabases,
    pub watches: WatchRegistry,
    pub fs_gate: Arc<Mutex<()>>,
}

impl NativeServices {
    pub fn close_vault(&mut self, session_id: &str) -> io::Result<()> {
        self.close_vault_mode(session_id, false)
    }

    pub fn close_vault_mode(&mut self, session_id: &str, reload: bool) -> io::Result<()> {
        self.vaults.get(session_id)?;
        if self.databases.has_session(session_id) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        // A watcher never acquires the services lock. Do not hold fs_gate here:
        // joining a worker waiting to snapshot would otherwise deadlock.
        if reload {
            self.core_vaults.detach(&self.vaults, session_id)?;
        } else {
            self.core_vaults.close(&self.vaults, session_id)?;
        }
        self.watches.close_session(session_id)?;
        self.with_files(|services| services.vaults.close(session_id))?;
        self.ai.finish_close_vault(session_id);
        self.imports.finish_close_vault(session_id);
        self.repository.finish_close_vault(session_id);
        Ok(())
    }

    pub fn with_files<T>(
        &mut self,
        action: impl FnOnce(&mut Self) -> io::Result<T>,
    ) -> io::Result<T> {
        let gate = self.fs_gate.clone();
        let _guard = gate
            .lock()
            .map_err(|_| io::Error::other("File IO owner is unavailable"))?;
        action(self)
    }
}

#[derive(Clone)]
pub struct NativeHost(pub Arc<Mutex<NativeServices>>);

#[derive(Serialize)]
pub struct NativeError {
    code: &'static str,
    message: String,
}

impl std::fmt::Display for NativeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.message.fmt(f)
    }
}

impl From<io::Error> for NativeError {
    fn from(error: io::Error) -> Self {
        if let Some(service) = error
            .get_ref()
            .and_then(|cause| cause.downcast_ref::<lapis_app_core::services::Error>())
        {
            use lapis_app_protocol::ErrorCode;
            let code = match service.code() {
                ErrorCode::InvalidRequest | ErrorCode::ProtocolMismatch => "EINVAL",
                ErrorCode::PermissionDenied | ErrorCode::Closed => "EACCES",
                ErrorCode::NotFound => "ENOENT",
                ErrorCode::Conflict => "ECONFLICT",
                ErrorCode::AlreadyExists => "EEXIST",
                ErrorCode::DirectoryNotEmpty => "ENOTEMPTY",
                ErrorCode::IsDirectory => "EISDIR",
                ErrorCode::NotDirectory => "ENOTDIR",
                ErrorCode::Busy => "EBUSY",
                ErrorCode::Unsupported => "ENOTSUP",
                ErrorCode::Io => "EIO",
            };
            return Self {
                code,
                message: service.to_string(),
            };
        }
        let code = if error
            .get_ref()
            .is_some_and(|cause| cause.is::<lapis_app_core::vault::TextWriteConflict>())
        {
            "ECONFLICT"
        } else {
            match error.kind() {
                io::ErrorKind::NotFound => "ENOENT",
                io::ErrorKind::PermissionDenied => "EACCES",
                io::ErrorKind::AlreadyExists => "EEXIST",
                io::ErrorKind::InvalidInput | io::ErrorKind::InvalidData => "EINVAL",
                io::ErrorKind::WouldBlock => "EBUSY",
                io::ErrorKind::DirectoryNotEmpty => "ENOTEMPTY",
                io::ErrorKind::IsADirectory => "EISDIR",
                io::ErrorKind::NotADirectory => "ENOTDIR",
                io::ErrorKind::Unsupported => "ENOTSUP",
                _ => "EIO",
            }
        };
        Self {
            code,
            message: error.to_string(),
        }
    }
}

pub fn history_root(
    app: &tauri::AppHandle,
) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    #[cfg(not(feature = "e2e"))]
    {
        Ok(app.path().app_data_dir()?.join("vault-history"))
    }
    #[cfg(feature = "e2e")]
    {
        let _ = app;
        Ok(
            std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?)
                .join("vault-history"),
        )
    }
}

pub fn initialize(
    app: &tauri::AppHandle,
) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    crate::host::ai::user_commands::initialize(app);
    crate::host::ai::imports::initialize(app)?;
    #[cfg(not(feature = "e2e"))]
    let profile = app.path().app_data_dir()?;
    #[cfg(feature = "e2e")]
    let profile =
        std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?).join("profile");
    let vaults = VaultManager::new(&profile)?;
    let fs_gate = Arc::new(Mutex::new(()));
    let core_vaults = lapis_desktop::vault::services::VaultServices::new_with_backup(
        &profile,
        &history_root(app)?,
        fs_gate.clone(),
    )?;
    app.manage(NativeHost(Arc::new(Mutex::new(NativeServices {
        imports: lapis_desktop::vault::admission::VaultAdmissions::default(),
        ai: lapis_desktop::vault::admission::VaultAdmissions::default(),
        repository: lapis_desktop::repository::RepositoryAdmissions::default(),
        vaults,
        core_vaults,
        databases: NativeDatabases::default(),
        watches: WatchRegistry::default(),
        fs_gate,
    }))));
    Ok(profile)
}

pub async fn access<T: Send + 'static>(
    host: NativeHost,
    action: impl FnOnce(&mut NativeServices) -> io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut services = host
            .0
            .lock()
            .map_err(|_| io::Error::other("Native owner is unavailable"))?;
        action(&mut services)
    })
    .await
    .map_err(|_| io::Error::other("Native operation could not complete"))?
    .map_err(Into::into)
}
