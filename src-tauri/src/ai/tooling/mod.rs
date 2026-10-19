//! Device tooling adapted from jj-store's agent_execution/tooling.
mod install;
pub mod paths;
mod status;
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs, io,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::Duration,
};
pub const ADAPTER_VERSION: &str = "1.13.1";
pub const CODEX_VERSION: &str = "0.156.1";
pub use jj_store_model::RequestId;
pub use jj_store_service::agent_execution::tooling::{Action, Outcome, Runtime, Status};

#[derive(Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Journal {
    selected: Option<RequestId>,
    requests: BTreeMap<RequestId, Outcome>,
}
#[derive(Clone)]
pub struct Tooling {
    root: PathBuf,
    state: Arc<Mutex<Journal>>,
    gate: Arc<tokio::sync::Mutex<()>>,
}
pub fn selected_paths(profile: &Path) -> io::Result<Vec<PathBuf>> {
    let journal = read(&profile.join("ai-clients"))?;
    Ok(paths::directories(profile, journal.selected))
}
fn read(root: &Path) -> io::Result<Journal> {
    match fs::read(root.join("state.json")) {
        Ok(bytes) if bytes.len() <= 65536 => {
            serde_json::from_slice(&bytes).map_err(io::Error::other)
        }
        Ok(_) => Err(io::Error::other("AI client state exceeds its limit")),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(Journal::default()),
        Err(error) => Err(error),
    }
}
impl Tooling {
    pub fn open(profile: PathBuf) -> io::Result<Self> {
        let root = profile.join("ai-clients");
        fs::create_dir_all(&root)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&root, fs::Permissions::from_mode(0o700))?;
        }
        let mut state = read(&root)?;
        for outcome in state
            .requests
            .values_mut()
            .filter(|v| v.state == "installing")
        {
            outcome.state = "interrupted".into();
            outcome.error = Some(
                "Installation was interrupted. Check again before explicitly retrying.".into(),
            );
        }
        let this = Self {
            root,
            state: Arc::new(Mutex::new(state)),
            gate: Arc::default(),
        };
        this.update(|_| Ok(()))?;
        Ok(this)
    }
    fn update<T>(&self, action: impl FnOnce(&mut Journal) -> io::Result<T>) -> io::Result<T> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| io::Error::other("AI clients unavailable"))?;
        let before = serde_json::to_vec(&*state).map_err(io::Error::other)?;
        let result = action(&mut state)?;
        let persist = (|| {
            let next = self.root.join("state.pending");
            fs::write(
                &next,
                serde_json::to_vec(&*state).map_err(io::Error::other)?,
            )?;
            fs::File::open(&next)?.sync_all()?;
            fs::rename(next, self.root.join("state.json"))?;
            fs::File::open(&self.root)?.sync_all()
        })();
        if let Err(error) = persist {
            // A rename may have committed before directory sync failed. Reconcile
            // the durable receipt rather than claiming the request never existed.
            *state = read(&self.root)
                .or_else(|_| serde_json::from_slice(&before).map_err(io::Error::other))?;
            return Err(error);
        }
        Ok(result)
    }
    pub fn outcome(&self, request: RequestId) -> io::Result<Outcome> {
        self.state
            .lock()
            .map_err(|_| io::Error::other("AI clients unavailable"))?
            .requests
            .get(&request)
            .cloned()
            .ok_or_else(|| {
                io::Error::new(io::ErrorKind::NotFound, "Unknown AI installation request")
            })
    }
    pub async fn install(&self, request: RequestId) -> io::Result<Outcome> {
        let _guard = self.gate.clone().lock_owned().await;
        if let Ok(outcome) = self.outcome(request) {
            return Ok(outcome);
        }
        let status = self.status(true).await?;
        if !status.install_supported {
            return Err(io::Error::other(
                status
                    .install_unavailable
                    .unwrap_or("Another client installation is running".into()),
            ));
        }
        let paths = selected_paths(self.root.parent().unwrap())?;
        let node = paths::resolve(&paths, "node")
            .ok_or_else(|| io::Error::other("Install Node.js 22 or newer"))?;
        let npm = paths::resolve(&paths, "npm")
            .ok_or_else(|| io::Error::other("Install npm with Node.js"))?;
        let outcome = self.update(|state| {
            if state.requests.len() >= 128 {
                return Err(io::Error::other("AI installation receipt limit reached"));
            }
            let outcome = Outcome {
                version: 1,
                request_id: request,
                runtime_id: "codex".into(),
                state: "installing".into(),
                error: None,
            };
            state.requests.insert(request, outcome.clone());
            Ok(outcome)
        })?;
        let owner = self.clone();
        tokio::spawn(async move {
            let result = install::prepare(&owner.root, request, &node, &npm, &paths).await;
            let _guard = owner.gate.clone().lock_owned().await;
            let _ = tokio::task::spawn_blocking(move || {
                owner.update(|state| {
                    let outcome = state
                        .requests
                        .get_mut(&request)
                        .ok_or_else(|| io::Error::other("Installation receipt unavailable"))?;
                    match result {
                        Ok(()) => {
                            outcome.state = "completed".into();
                            state.selected = Some(request);
                        }
                        Err(message) => {
                            outcome.state = "failed".into();
                            outcome.error = Some(message.into());
                        }
                    }
                    Ok(())
                })
            })
            .await;
        });
        Ok(outcome)
    }
}

fn private_directory(path: &Path) -> io::Result<()> {
    fs::create_dir_all(path)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o700))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests;
