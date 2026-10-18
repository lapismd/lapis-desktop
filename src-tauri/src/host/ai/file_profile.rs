//! Explicit device-local Codex admission; transcript files remain renderer-owned.
use serde::Deserialize;
use std::io::Read;
use std::{
    collections::BTreeMap,
    io,
    path::{Path, PathBuf},
    sync::{Mutex, OnceLock},
};
use tauri_plugin_lapis_ai::{
    Launch, Target,
    runtime::{Config, Environment, PreparedLaunch, ResourceBundle},
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Settings {
    version: u8,
    bundle: PathBuf,
    path: Vec<PathBuf>,
}
struct Source {
    settings: PathBuf,
    home: PathBuf,
}
struct Ready {
    executable: PathBuf,
    environment: BTreeMap<String, String>,
}
#[derive(Default)]
pub(super) struct FileProfile {
    source: OnceLock<Source>,
    ready: OnceLock<Option<Ready>>,
    preparing: Mutex<()>,
}
fn invalid() -> io::Error {
    io::Error::other("Local AI configuration or verified runtime is unavailable")
}
impl FileProfile {
    pub fn configure(&self, settings: PathBuf, home: PathBuf) -> io::Result<()> {
        if self.ready.get().is_some() || !settings.is_absolute() || !home.is_absolute() {
            return Err(invalid());
        }
        self.source
            .set(Source { settings, home })
            .map_err(|_| invalid())
    }
    /// Called on a blocking worker before admission; no host/service lock is held.
    pub fn prepare(&self) -> io::Result<()> {
        let _guard = self.preparing.lock().map_err(|_| invalid())?;
        if self.ready.get().is_some() {
            return Ok(());
        }
        let prepared = self.source.get().map(load).transpose()?.flatten();
        self.ready.set(prepared).map_err(|_| invalid())
    }
    pub fn contains(&self, target: &str) -> bool {
        target == "codex" && self.ready.get().is_some_and(Option::is_some)
    }
    pub fn targets(&self) -> Vec<Target> {
        if self.contains("codex") {
            vec![Target {
                id: "codex".into(),
                label: "Codex".into(),
            }]
        } else {
            vec![]
        }
    }
    pub fn launch(&self, target: &str, root: &Path) -> io::Result<Option<Launch>> {
        if !self.contains(target) {
            return Ok(None);
        }
        let ready = self
            .ready
            .get()
            .and_then(Option::as_ref)
            .ok_or_else(invalid)?;
        Ok(Some(Launch {
            prepared: PreparedLaunch {
                executable: ready.executable.clone(),
                arguments: vec![],
                directory: root.into(),
                environment: Environment(ready.environment.clone()),
            },
            directory: root.into(),
            resume: None,
        }))
    }
}
fn load(source: &Source) -> io::Result<Option<Ready>> {
    let metadata = match std::fs::symlink_metadata(&source.settings) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        value => value?,
    };
    if !metadata.is_file() || metadata.len() > 16384 {
        return Err(invalid());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&source.settings)?
        .take(16385)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 16384 {
        return Err(invalid());
    }
    let settings: Settings = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
    if settings.version != 1
        || !settings.bundle.is_absolute()
        || settings.path.is_empty()
        || settings.path.len() > 8
        || settings
            .path
            .iter()
            .any(|path| !path.is_absolute() || !path.is_dir())
    {
        return Err(invalid());
    }
    if !settings
        .path
        .iter()
        .any(|path| path.join("codex-acp").is_file())
    {
        return Err(invalid());
    }
    let bundle = ResourceBundle::load(&settings.bundle).map_err(|_| invalid())?;
    let mut config = Config::parse("version = 1", source.settings.parent().ok_or_else(invalid)?)
        .map_err(|_| invalid())?;
    bundle.configure(&mut config);
    let path = std::env::join_paths(&settings.path)
        .map_err(|_| invalid())?
        .into_string()
        .map_err(|_| invalid())?;
    let home = source.home.to_str().ok_or_else(invalid)?.to_owned();
    // No inherited compatibility variables, process hooks or renderer-supplied credentials.
    let environment = BTreeMap::from([
        ("HOME".into(), home),
        ("PATH".into(), path),
        ("JJ_ACP_RUNNER".into(), "codex".into()),
        ("JJ_ACP_CONTROL_VERSION".into(), "3".into()),
        ("JJ_ACP_CANCEL_GRACE".into(), "2".into()),
        ("JJ_ACP_REAP_TIMEOUT".into(), "2".into()),
    ]);
    Ok(Some(Ready {
        executable: config.runtime.acp.ok_or_else(invalid)?,
        environment,
    }))
}

#[cfg(test)]
mod tests;
