mod capture;
pub(crate) mod commands;
mod conversations;
mod frames;
mod privacy;
mod processing;
mod reads;
mod retirement;
use crate::host::state::NativeHost;
use cap_std::{ambient_authority, fs::Dir};
use frames::Opened;
use jj_store_model::RequestId;
use lapis_desktop::{
    ai::backend::{BackendProfiles, BackendScope},
    vault::admission::VaultLease,
};
use std::{
    collections::HashMap,
    io,
    path::Path,
    sync::{
        Arc, Mutex, OnceLock, Weak,
        atomic::{AtomicBool, Ordering},
    },
};
use tauri::Manager;
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

struct Owner {
    generation: String,
    session: String,
    request: RequestId,
    opened: Opened,
    scope: Arc<BackendScope>,
    rebindable: bool,
    captures: HashMap<RequestId, capture::Plan>,
    reads: HashMap<Uuid, Arc<lapis_desktop::ai::conversations::ReadPin>>,
}
pub struct NativeBackends {
    pub tools: lapis_desktop::ai::tools::Registry,
    profile: Dir,
    owners: Mutex<HashMap<String, Owner>>,
    pub transitions: Arc<tokio::sync::Mutex<()>>,
    workers: OnceLock<Weak<tauri_plugin_lapis_ai::AcpHost>>,
    destroyed: AtomicBool,
    processing: Mutex<HashMap<String, Weak<processing::Authority>>>,
    privacy: OnceLock<privacy::Roots>,
    #[cfg(test)]
    blocking_started: std::sync::atomic::AtomicUsize,
}
fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Native conversation backend is unavailable",
    )
}
fn busy() -> io::Error {
    io::Error::new(
        io::ErrorKind::WouldBlock,
        "Close the original conversation backend owner first",
    )
}
pub fn initialize(app: &tauri::AppHandle, profile: &Path) -> io::Result<()> {
    let owner = NativeBackends::new(Dir::open_ambient_dir(profile, ambient_authority())?);
    let home = app.path().home_dir().map_err(|_| denied())?;
    owner
        .privacy
        .set(privacy::Roots::new(home, std::env::temp_dir())?)
        .map_err(|_| denied())?;
    if !app.manage(Arc::new(owner)) {
        return Err(busy());
    }
    Ok(())
}
impl NativeBackends {
    pub fn new(profile: Dir) -> Self {
        Self {
            tools: lapis_desktop::ai::tools::Registry::default(),
            profile,
            owners: Mutex::new(HashMap::new()),
            transitions: Arc::new(tokio::sync::Mutex::new(())),
            workers: OnceLock::new(),
            destroyed: AtomicBool::new(false),
            processing: Mutex::new(HashMap::new()),
            privacy: OnceLock::new(),
            #[cfg(test)]
            blocking_started: std::sync::atomic::AtomicUsize::new(0),
        }
    }
    fn profiles(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
    ) -> io::Result<(BackendProfiles, VaultLease)> {
        super::policy::local(context).map_err(|_| denied())?;
        let lease = self.current(host, &context.window)?;
        if lease.session() != session {
            return Err(denied());
        }
        let window = context.window.clone();
        let weak = Arc::downgrade(&host.0);
        let owner = Arc::downgrade(self);
        let generation = lease.generation().to_owned();
        let profiles = BackendProfiles::new(
            self.profile.try_clone()?,
            Arc::new(move || {
                let host = NativeHost(weak.upgrade().ok_or_else(denied)?);
                owner
                    .upgrade()
                    .ok_or_else(denied)?
                    .retained(&host, &window, &generation)
            }),
        )?;
        Ok((profiles, lease))
    }
    fn open(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        request: RequestId,
    ) -> io::Result<Opened> {
        let (profiles, lease) = self.profiles(host, context, session)?;
        let retained = self
            .owners
            .lock()
            .map_err(|_| denied())?
            .get(&context.window)
            .map(|o| (o.generation.clone(), o.opened.clone(), o.scope.clone()));
        if let Some((generation, original, scope)) = retained {
            if generation != lease.generation() {
                return Err(busy());
            }
            let call = scope.begin()?;
            if profiles.read()? != original.selection {
                return Err(denied());
            }
            call.check()?;
            let opened = {
                let mut owners = self.owners.lock().map_err(|_| denied())?;
                let owner = owners
                    .get_mut(&context.window)
                    .filter(|o| o.opened.handle == original.handle)
                    .ok_or_else(busy)?;
                if owner.request != request {
                    if !owner.rebindable {
                        return Err(busy());
                    }
                    owner.opened.handle = Uuid::new_v4();
                    owner.reads.clear();
                    owner.request = request;
                    owner.rebindable = false;
                    owner.session = session.into();
                }
                owner.opened.clone()
            };
            call.check()?;
            return Ok(opened);
        }
        let scope = profiles.open_scope()?;
        scope.begin()?.check()?;
        let opened = Opened {
            handle: Uuid::new_v4(),
            selection: scope.selection().clone(),
        };
        self.owners.lock().map_err(|_| denied())?.insert(
            context.window.clone(),
            Owner {
                generation: lease.generation().into(),
                session: session.into(),
                request,
                opened: opened.clone(),
                scope: scope.clone(),
                rebindable: false,
                captures: HashMap::new(),
                reads: HashMap::new(),
            },
        );
        scope.begin()?.check()?;
        Ok(opened)
    }
    fn closing(&self, window: &str, session: &str, handle: Uuid) -> io::Result<Option<String>> {
        let owners = self.owners.lock().map_err(|_| denied())?;
        let Some(owner) = owners.get(window) else {
            return Ok(None);
        };
        if owner.opened.handle != handle || owner.session != session {
            return Err(denied());
        }
        drop(owner.scope.drain());
        Ok(Some(owner.generation.clone()))
    }
    pub fn suspend(&self, window: &str) -> io::Result<()> {
        if let Some(owner) = self.owners.lock().map_err(|_| denied())?.get_mut(window) {
            owner.rebindable = true;
        }
        Ok(())
    }
    pub fn fence(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        self.tools.fence(window, generation)?;
        if let Some(owner) = self.owners.lock().map_err(|_| denied())?.get(window)
            && generation.is_none_or(|g| owner.generation == g)
        {
            drop(owner.scope.drain());
        }
        Ok(())
    }
    /// Caller holds transitions. A cancelled wait retains the fenced owner.
    pub async fn drain(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        self.tools.drain(window, generation).await?;
        let retained = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            owners
                .get(window)
                .filter(|o| generation.is_none_or(|g| o.generation == g))
                .map(|o| (o.opened.handle, o.scope.clone()))
        };
        if let Some((handle, scope)) = retained {
            scope.drain().await?;
            let mut owners = self.owners.lock().map_err(|_| denied())?;
            if owners
                .get(window)
                .is_some_and(|o| o.opened.handle == handle)
            {
                owners.remove(window);
            }
        }
        Ok(())
    }
}

pub async fn revoke(
    workers: &tauri_plugin_lapis_ai::AcpHost,
    backends: &NativeBackends,
    window: &str,
    generation: Option<&str>,
) -> io::Result<()> {
    backends.fence(window, generation)?;
    workers
        .revoke(window, generation)
        .await
        .map_err(|e| io::Error::other(e.to_string()))?;
    backends.drain(window, generation).await
}

#[cfg(test)]
mod tests;
