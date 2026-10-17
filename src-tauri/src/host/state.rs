use lapis_desktop::{database::NativeDatabases, vault::VaultManager, watch::WatchRegistry};
use serde::Serialize;
use std::{
    io,
    sync::{Arc, Mutex},
};
use tauri::Manager;

pub struct NativeServices {
    pub vaults: VaultManager,
    pub databases: NativeDatabases,
    pub watches: WatchRegistry,
    pub fs_gate: Arc<Mutex<()>>,
}

impl NativeServices {
    pub fn close_vault(&mut self, session_id: &str) -> io::Result<()> {
        self.vaults.get(session_id)?;
        if self.databases.has_session(session_id) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        // A watcher never acquires the services lock. Do not hold fs_gate here:
        // joining a worker waiting to snapshot would otherwise deadlock.
        self.watches.close_session(session_id)?;
        self.with_files(|services| services.vaults.close(session_id))
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

impl From<io::Error> for NativeError {
    fn from(error: io::Error) -> Self {
        let code = if error
            .get_ref()
            .is_some_and(|cause| cause.is::<lapis_desktop::vault::TextWriteConflict>())
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

pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    crate::host::ai::user_commands::initialize(app);
    #[cfg(not(feature = "e2e"))]
    let profile = app.path().app_data_dir()?;
    #[cfg(feature = "e2e")]
    let profile =
        std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?).join("profile");
    app.manage(NativeHost(Arc::new(Mutex::new(NativeServices {
        vaults: VaultManager::new(&profile)?,
        databases: NativeDatabases::new(profile.join("databases")),
        watches: WatchRegistry::default(),
        fs_gate: Arc::new(Mutex::new(())),
    }))));
    Ok(())
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
