//! Optional device-owned compute. Reading status never starts a process or download.
use crate::ai::tools::Owner;
mod hardware;
mod lifecycle;
mod store;
mod types;
mod worker;
use crate::ai::configuration::Secrets;
use std::{
    io,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri_plugin_lapis_ai::runtime::{
    ComputeClient, ComputeCommands, ComputeConnection, PreparedLaunch,
};
pub use types::{Action, Command, Settings, Status};
use types::{Saved, View};
fn unavailable() -> io::Error {
    io::Error::other("Compute is unavailable; check configuration and refresh")
}
struct Runtime {
    client: tokio::sync::Mutex<Option<ComputeClient>>,
    commands: Mutex<Option<ComputeCommands>>,
    connection: Mutex<Option<ComputeConnection>>,
    view: Mutex<View>,
    owner: Mutex<Option<Owner>>,
    job: tokio::sync::Mutex<Option<tokio::task::JoinHandle<io::Result<()>>>>,
}
pub struct Compute {
    store: store::Store,
    secrets: Arc<dyn Secrets>,
    runtime: Arc<Runtime>,
    transition: tokio::sync::Mutex<()>,
    authorize: Mutex<Option<crate::ai::tools::Authorize>>,
    fenced: std::sync::atomic::AtomicBool,
    initialized: Mutex<bool>,
}
impl Compute {
    pub fn open(profile: PathBuf, secrets: Arc<dyn Secrets>) -> io::Result<Self> {
        let store = store::Store::new(profile.join("ai-compute"));
        Ok(Self {
            store,
            secrets,
            transition: tokio::sync::Mutex::new(()),
            authorize: Mutex::new(None),
            fenced: std::sync::atomic::AtomicBool::new(false),
            initialized: Mutex::new(false),
            runtime: Arc::new(Runtime {
                client: tokio::sync::Mutex::new(None),
                commands: Mutex::new(None),
                connection: Mutex::new(None),
                view: Mutex::new(View {
                    state: "off".into(),
                    ..Default::default()
                }),
                owner: Mutex::new(None),
                job: tokio::sync::Mutex::new(None),
            }),
        })
    }
    fn initialize(&self) -> io::Result<()> {
        let mut initialized = self.initialized.lock().map_err(|_| unavailable())?;
        if !*initialized {
            self.store.recover()?;
            *initialized = true;
        }
        Ok(())
    }
    pub fn status(&self) -> io::Result<Status> {
        self.initialize()?;
        let saved = self.store.read()?;
        Ok(Status {
            hardware: hardware::facts(),
            settings: saved.settings,
            request_id: saved.request.map(|r| r.request_id),
            outcome: saved.outcome,
            runtime: self.runtime.view.lock().map_err(|_| unavailable())?.clone(),
        })
    }
    pub async fn command(
        self: &Arc<Self>,
        command: Command,
        plan: PreparedLaunch,
        scope: Owner,
        authorize: crate::ai::tools::Authorize,
    ) -> io::Result<()> {
        let _transition = self.transition.lock().await;
        if let Action::Stop { owner_id } = command.action {
            if self
                .runtime
                .owner
                .lock()
                .map_err(|_| unavailable())?
                .as_ref()
                != Some(&scope)
            {
                return Ok(());
            }
            drop(_transition);
            return self.stop_owned(&scope.session, owner_id).await;
        }
        authorize()?;
        let observing = self.clone();
        let saved = tokio::task::spawn_blocking(move || {
            observing.initialize()?;
            observing.store.read()
        })
        .await
        .map_err(|_| unavailable())??;
        if saved.request.as_ref().map(|r| r.request_id) == Some(command.request_id) {
            let store = self.store.clone();
            let exact = command.clone();
            tokio::task::spawn_blocking(move || store.admit(&exact))
                .await
                .map_err(|_| unavailable())??;
            return Ok(());
        }
        let mut job = self.runtime.job.lock().await;
        if let Some(task) = job.as_mut() {
            if !task.is_finished() && saved.outcome.as_deref() == Some("pending") {
                return Err(unavailable());
            }
            task.await.map_err(|_| unavailable())?.ok();
            job.take();
        }
        drop(job);
        let store = self.store.clone();
        let admitted = command.clone();
        if !tokio::task::spawn_blocking(move || store.admit(&admitted))
            .await
            .map_err(|_| unavailable())??
        {
            return Ok(());
        }
        if let Err(error) = authorize() {
            let store = self.store.clone();
            let refused = command.clone();
            tokio::task::spawn_blocking(move || store.finish(&refused, "rejected"))
                .await
                .map_err(|_| unavailable())??;
            return Err(error);
        }
        {
            let mut owner = self.runtime.owner.lock().map_err(|_| unavailable())?;
            if owner.as_ref() != Some(&scope) {
                self.runtime
                    .view
                    .lock()
                    .map_err(|_| unavailable())?
                    .owner_id = Some(uuid::Uuid::new_v4());
            }
            *owner = Some(scope);
        }
        *self.authorize.lock().map_err(|_| unavailable())? = Some(authorize);
        self.fenced
            .store(false, std::sync::atomic::Ordering::SeqCst);
        let this = self.clone();
        let task = tokio::spawn(async move {
            let result = worker::run(&this, &command, plan).await;
            let store = this.store.clone();
            let outcome = if result.is_ok() {
                "completed"
            } else {
                "unknown"
            };
            if result.is_err() {
                this.runtime.view.lock().map_err(|_| unavailable())?.state = "attention".into();
            }
            tokio::task::spawn_blocking(move || store.finish(&command, outcome))
                .await
                .map_err(|_| unavailable())??;
            result
        });
        *self.runtime.job.lock().await = Some(task);
        Ok(())
    }
    fn check(&self) -> io::Result<()> {
        if self.fenced.load(std::sync::atomic::Ordering::SeqCst) {
            return Err(unavailable());
        }
        let authorize = self
            .authorize
            .lock()
            .map_err(|_| unavailable())?
            .clone()
            .ok_or_else(unavailable)?;
        authorize()
    }
    pub fn fence(&self, generation: Option<&str>) -> io::Result<()> {
        if generation.is_none()
            || self
                .runtime
                .owner
                .lock()
                .map_err(|_| unavailable())?
                .as_ref()
                .is_some_and(|owner| Some(owner.generation.as_str()) == generation)
        {
            self.fenced.store(true, std::sync::atomic::Ordering::SeqCst);
        }
        Ok(())
    }
    pub fn environment(
        &self,
        paired: bool,
    ) -> io::Result<std::collections::BTreeMap<String, String>> {
        let saved = self.store.read()?;
        let connection = self.runtime.connection.lock().map_err(|_| unavailable())?;
        let connection = connection.as_ref().ok_or_else(unavailable)?;
        let endpoint = if paired {
            let peer = saved
                .settings
                .target_peer
                .as_ref()
                .ok_or_else(unavailable)?;
            connection.peer_endpoint(peer).map_err(|_| unavailable())?
        } else {
            if self.runtime.view.lock().map_err(|_| unavailable())?.state != "serving" {
                return Err(unavailable());
            }
            connection.endpoint().clone()
        };
        Ok(std::collections::BTreeMap::from([
            ("BUZZ_AGENT_PROVIDER".into(), "openai".into()),
            (
                "BUZZ_AGENT_MODEL".into(),
                saved.settings.model.ok_or_else(unavailable)?,
            ),
            ("OPENAI_COMPAT_BASE_URL".into(), endpoint.to_string()),
            (
                "OPENAI_COMPAT_API_KEY".into(),
                connection.bearer_token().into(),
            ),
        ]))
    }
}
