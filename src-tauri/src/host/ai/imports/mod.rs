pub(crate) mod commands;
mod lifetime;
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::{
    ai::imports::{Catalog, ImportScope},
    vault::admission::VaultLease,
};
pub use lifetime::{close_vault, window_destroyed};
use std::{
    collections::{HashMap, HashSet},
    io,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri::Manager;
use uuid::Uuid;
pub struct NativeImports {
    pub(super) home: PathBuf,
    owners: Mutex<HashMap<String, Owner>>,
    destroyed: Mutex<HashSet<String>>,
    pub(super) transitions: Arc<tokio::sync::Mutex<()>>,
}
struct Owner {
    handle: Uuid,
    session: String,
    scope: Arc<ImportScope>,
}
fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Local transcript import is unavailable",
    )
}
pub fn initialize(app: &tauri::AppHandle) -> io::Result<()> {
    #[cfg(not(feature = "e2e"))]
    let home = app.path().home_dir().map_err(|_| denied())?;
    #[cfg(feature = "e2e")]
    let home = PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT").map_err(|_| denied())?)
        .join("import-home");
    app.manage(Arc::new(NativeImports {
        home,
        owners: Mutex::new(HashMap::new()),
        destroyed: Mutex::new(HashSet::new()),
        transitions: Arc::new(tokio::sync::Mutex::new(())),
    }));
    Ok(())
}
impl NativeImports {
    fn check_window(&self, window: &str) -> io::Result<()> {
        if self
            .destroyed
            .lock()
            .map_err(|_| denied())?
            .contains(window)
        {
            return Err(denied());
        }
        Ok(())
    }
    fn open(
        self: &Arc<Self>,
        host: &NativeHost,
        window: &str,
        lease: VaultLease,
    ) -> io::Result<Uuid> {
        self.check_window(window)?;
        let weak_host = Arc::downgrade(&host.0);
        let weak_owner = Arc::downgrade(self);
        let checking_window = window.to_owned();
        let session = lease.session().to_owned();
        let checking_session = session.clone();
        let generation = lease.generation().to_owned();
        let scope = ImportScope::new(Arc::new(move || {
            weak_owner
                .upgrade()
                .ok_or_else(denied)?
                .check_window(&checking_window)?;
            let host = weak_host.upgrade().ok_or_else(denied)?;
            let mut services = host.lock().map_err(|_| denied())?;
            let NativeServices {
                imports, vaults, ..
            } = &mut *services;
            let current = imports
                .authorize(vaults, &checking_window)
                .map_err(|_| denied())?;
            if current.session() != checking_session || current.generation() != generation {
                return Err(denied());
            }
            Ok(())
        }));
        let handle = Uuid::new_v4();
        let mut owners = self.owners.lock().map_err(|_| denied())?;
        if owners.contains_key(window) {
            return Err(denied());
        }
        owners.insert(
            window.into(),
            Owner {
                handle,
                session,
                scope,
            },
        );
        Ok(handle)
    }
    fn matching(&self, window: &str, handle: Uuid) -> io::Result<Option<Arc<ImportScope>>> {
        Ok(self
            .owners
            .lock()
            .map_err(|_| denied())?
            .get(window)
            .filter(|owner| owner.handle == handle)
            .map(|owner| owner.scope.clone()))
    }
    fn scope(&self, window: &str, handle: Uuid) -> io::Result<Arc<ImportScope>> {
        self.check_window(window)?;
        self.matching(window, handle)?.ok_or_else(denied)
    }
    /// No catalog mutex is held during parsing; cancellation/fencing stays responsive.
    fn catalog(scope: &ImportScope) -> io::Result<Catalog> {
        Ok(scope.catalog.lock().map_err(|_| denied())?.clone())
    }
}

#[cfg(test)]
mod tests;
