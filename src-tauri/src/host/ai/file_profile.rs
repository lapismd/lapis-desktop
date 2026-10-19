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
    bundle: Option<PathBuf>,
    path: Option<Vec<PathBuf>>,
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
    ready: Mutex<Option<Ready>>,
    bundle: OnceLock<PathBuf>,
    verified: Mutex<Option<(PathBuf, Config)>>,
    preparing: Mutex<()>,
}
fn invalid() -> io::Error {
    io::Error::other("Local AI configuration or verified runtime is unavailable")
}
impl FileProfile {
    pub fn configure(&self, settings: PathBuf, home: PathBuf) -> io::Result<()> {
        if !settings.is_absolute() || !home.is_absolute() {
            return Err(invalid());
        }
        self.source
            .set(Source { settings, home })
            .map_err(|_| invalid())
    }
    #[cfg(any(not(feature = "e2e"), test))]
    pub fn configure_bundle(&self, bundle: PathBuf) -> io::Result<()> {
        self.bundle.set(bundle).map_err(|_| invalid())
    }
    pub fn bundle_ready(&self) -> bool {
        let explicit = self.source.get().and_then(|source| {
            let info = std::fs::symlink_metadata(&source.settings).ok()?;
            if !info.is_file() || info.len() > 16384 {
                return None;
            }
            let bytes = std::fs::read(&source.settings).ok()?;
            let settings: Settings = serde_json::from_slice(&bytes).ok()?;
            settings.bundle
        });
        explicit
            .as_ref()
            .or(self.bundle.get())
            .is_some_and(|path| verified_config(path, &self.verified).is_ok())
    }
    /// Called on a blocking worker before admission; no host/service lock is held.
    pub fn prepare(&self) -> io::Result<()> {
        let _guard = self.preparing.lock().map_err(|_| invalid())?;
        let prepared = self
            .source
            .get()
            .map(|source| load(source, self.bundle.get(), &self.verified))
            .transpose()?
            .flatten();
        *self.ready.lock().map_err(|_| invalid())? = prepared;
        Ok(())
    }
    pub fn contains(&self, target: &str) -> bool {
        target == "codex" && self.ready.lock().is_ok_and(|ready| ready.is_some())
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
        let guard = self.ready.lock().map_err(|_| invalid())?;
        let ready = guard.as_ref().ok_or_else(invalid)?;
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
fn load(
    source: &Source,
    bundled: Option<&PathBuf>,
    verified: &Mutex<Option<(PathBuf, Config)>>,
) -> io::Result<Option<Ready>> {
    let bytes = match std::fs::symlink_metadata(&source.settings) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => {
            if bundled.is_none() {
                return Ok(None);
            }
            None
        }
        Err(error) => return Err(error),
        Ok(metadata) => {
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
            Some(bytes)
        }
    };
    let repair = |reason: String| {
        io::Error::other(format!(
            "{reason} Update AI configuration at {} and retry.",
            source.settings.display()
        ))
    };
    let settings: Settings = match bytes {
        Some(bytes) => serde_json::from_slice(&bytes).map_err(|_| {
            repair("AI configuration must contain version, bundle and path fields only.".into())
        })?,
        None => Settings {
            version: 1,
            bundle: None,
            path: None,
        },
    };
    if settings.path.as_ref().is_some_and(|paths| {
        paths.is_empty() || paths.len() > 8 || paths.iter().any(|path| !path.is_absolute())
    }) {
        return Err(repair(
            "AI configuration path requires one to eight absolute executable search directories."
                .into(),
        ));
    }
    let bundle_path = settings.bundle.or_else(|| bundled.cloned()).ok_or_else(|| repair("The application AI runtime is missing. Use a complete application bundle or prepare it with pnpm ai:prepare.".into()))?;
    let profile = source.settings.parent().ok_or_else(invalid)?;
    let discovered = lapis_desktop::ai::tooling::selected_paths(profile)?;
    let managed = discovered
        .first()
        .is_some_and(|path| path.starts_with(profile.join("ai-clients/tooling")));
    let paths = if managed {
        discovered
    } else {
        settings.path.unwrap_or(discovered)
    };
    if settings.version != 1
        || !bundle_path.is_absolute()
        || paths.is_empty()
        || paths.len() > 64
        || paths.iter().any(|path| !path.is_absolute())
    {
        return Err(repair("AI configuration requires version 1, an absolute bundle path and one to eight absolute executable search directories.".into()));
    }
    for path in &paths {
        if !path.is_dir() {
            return Err(repair(format!(
                "AI executable search directory is missing or is not a folder: {}.",
                path.display()
            )));
        }
    }
    if !paths.iter().any(|path| path.join("codex-acp").is_file()) {
        return Err(repair("Install @agentclientprotocol/codex-acp and include its executable directory in path; codex-acp was not found.".into()));
    }
    let config = verified_config(&bundle_path, verified).map_err(|error| repair(format!(
        "AI runtime bundle verification failed at {} ({error}). Restore a verified runtime bundle.", bundle_path.display()
    )))?;
    let path = std::env::join_paths(&paths)
        .map_err(|_| repair("AI executable search directories cannot form a PATH.".into()))?
        .into_string()
        .map_err(|_| repair("AI executable search directories must be valid text.".into()))?;
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

// Application resources are immutable for this process. Replacing a helper
// bundle requires restart, as in jj-store; client selection stays refreshable.
fn verified_config(path: &Path, cache: &Mutex<Option<(PathBuf, Config)>>) -> io::Result<Config> {
    let mut cache = cache.lock().map_err(|_| invalid())?;
    if let Some((selected, config)) = cache.as_ref()
        && selected == path
    {
        return Ok(config.clone());
    }
    let bundle = ResourceBundle::load(path).map_err(|error| io::Error::other(error.to_string()))?;
    let mut config =
        Config::parse("version = 1", path).map_err(|error| io::Error::other(error.to_string()))?;
    bundle.configure(&mut config);
    *cache = Some((path.to_owned(), config.clone()));
    Ok(config)
}

#[cfg(test)]
pub(super) mod tests;
