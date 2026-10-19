//! Installation-scoped forge custody. Native workers never lock vault services.
use jj_forge::accounts::{Command, Inventory, Manager, now};
use std::{
    io,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tokio::sync::Semaphore;

pub struct ForgeAccounts {
    manager: Arc<Mutex<Option<Arc<Manager>>>>,
    root: Option<PathBuf>,
    slots: Arc<Semaphore>,
    cancellation: Arc<Semaphore>,
}
impl ForgeAccounts {
    pub fn new(manager: Manager, concurrency: usize) -> io::Result<Self> {
        if !(1..=4).contains(&concurrency) {
            return Err(io::Error::other("Invalid forge worker limit"));
        }
        Ok(Self {
            manager: Arc::new(Mutex::new(Some(Arc::new(manager)))),
            root: None,
            slots: Arc::new(Semaphore::new(concurrency)),
            cancellation: Arc::new(Semaphore::new(1)),
        })
    }
    pub fn native(root: PathBuf) -> Self {
        Self {
            manager: Arc::new(Mutex::new(None)),
            root: Some(root),
            slots: Arc::new(Semaphore::new(4)),
            cancellation: Arc::new(Semaphore::new(1)),
        }
    }
    pub async fn execute(&self, command: Option<Command>) -> io::Result<Inventory> {
        // Revocation must be able to fence a poll waiting on a network reply.
        let cancel = matches!(&command, Some(Command::CancelOauth { .. }));
        let permit = if cancel {
            self.cancellation
                .clone()
                .acquire_owned()
                .await
                .map_err(|_| io::Error::other("Forge cancellation is closed"))?
        } else {
            self.slots
                .clone()
                .try_acquire_owned()
                .map_err(|_| io::Error::new(io::ErrorKind::WouldBlock, "Forge accounts are busy"))?
        };
        let owner = self.manager.clone();
        let root = self.root.clone();
        tokio::task::spawn_blocking(move || {
            let _permit = permit;
            let manager = {
                let mut saved = owner
                    .lock()
                    .map_err(|_| io::Error::other("Forge account owner unavailable"))?;
                if saved.is_none() {
                    let client_id = jj_forge::accounts::native()
                        .map_err(|_| io::Error::other("Forge application identity unavailable"))?
                        .client_id
                        .clone();
                    let manager = Manager::new(
                        root.ok_or_else(|| io::Error::other("Forge account profile unavailable"))?,
                        Arc::new(jj_forge::accounts::store::ScopedNativeSecrets::new(
                            "md.lapis.desktop.forge.v1",
                        )),
                        Arc::new(jj_forge::accounts::http::Http),
                        client_id,
                    );
                    *saved = Some(Arc::new(manager));
                }
                saved.as_ref().unwrap().clone()
            };
            let result = match command {
                None => manager.inventory(),
                Some(command) => tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()?
                    .block_on(async { manager.execute(command, now()?).await }),
            };
            result.map_err(|error| io::Error::other(format!("Forge account action: {error}")))
        })
        .await
        .map_err(|_| io::Error::other("Forge account worker stopped"))?
    }
}
