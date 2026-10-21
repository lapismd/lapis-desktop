mod browser;
pub(crate) mod commands;
mod lifetime;
mod requests;
use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::{
    ai::imports::{Catalog, ImportIndex, ImportScope},
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
#[derive(Clone, Copy, Default, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Purpose {
    #[default]
    Import,
    Capture,
}
pub struct NativeImports {
    pub(super) home: PathBuf,
    pub(super) index: Mutex<ImportIndex>,
    owners: Mutex<HashMap<Uuid, Owner>>,
    destroyed: Mutex<HashSet<String>>,
    pub(super) transitions: Arc<tokio::sync::Mutex<()>>,
}
struct Owner {
    window: String,
    purpose: Purpose,
    workspace: PathBuf,
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
    #[cfg(not(feature = "e2e"))]
    let cache = app
        .path()
        .app_cache_dir()
        .map_err(|_| denied())?
        .join("ai-session-index");
    #[cfg(feature = "e2e")]
    let cache = home.parent().ok_or_else(denied)?.join("import-cache");
    app.manage(Arc::new(NativeImports {
        index: Mutex::new(ImportIndex::new(home.clone(), cache)),
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
        purpose: Purpose,
    ) -> io::Result<Uuid> {
        self.check_window(window)?;
        let weak_host = Arc::downgrade(&host.0);
        let weak_owner = Arc::downgrade(self);
        let checking_window = window.to_owned();
        let workspace = lease.root().to_path_buf();
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
                .authorize_retained(vaults, &checking_window, &generation)
                .map_err(|_| denied())?;
            if current.session() != checking_session || current.generation() != generation {
                return Err(denied());
            }
            Ok(())
        }));
        let handle = Uuid::new_v4();
        let mut owners = self.owners.lock().map_err(|_| denied())?;
        if owners
            .values()
            .any(|owner| owner.window == window && owner.purpose == purpose)
        {
            return Err(denied());
        }
        owners.insert(
            handle,
            Owner {
                window: window.into(),
                purpose,
                workspace,
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
            .get(&handle)
            .filter(|owner| owner.window == window)
            .map(|owner| owner.scope.clone()))
    }
    fn scope(&self, window: &str, handle: Uuid) -> io::Result<Arc<ImportScope>> {
        self.check_window(window)?;
        self.matching(window, handle)?.ok_or_else(denied)
    }
    fn workspace(&self, window: &str, handle: Uuid, purpose: Purpose) -> io::Result<PathBuf> {
        self.check_window(window)?;
        self.owners
            .lock()
            .map_err(|_| denied())?
            .get(&handle)
            .filter(|o| o.window == window && o.purpose == purpose)
            .map(|o| o.workspace.clone())
            .ok_or_else(denied)
    }
    fn has_window(&self, window: &str) -> io::Result<bool> {
        Ok(self
            .owners
            .lock()
            .map_err(|_| denied())?
            .values()
            .any(|o| o.window == window))
    }
    /// No catalog mutex is held during parsing; cancellation/fencing stays responsive.
    fn catalog(scope: &ImportScope) -> io::Result<Catalog> {
        Ok(scope.catalog.lock().map_err(|_| denied())?.clone())
    }
}

#[cfg(test)]
mod tests;
