//! Immutable launch preparation shared by legacy ACP and native turn policy.
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
    runtime::{Config, PreparedLaunch, ResourceBundle},
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
    providers: lapis_desktop::ai::configuration::ProviderStore,
}
pub(super) struct Ready {
    executable: PathBuf,
    environment: BTreeMap<String, String>,
    targets: BTreeMap<String, String>,
    local_environments: BTreeMap<String, BTreeMap<String, String>>,
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
        let providers = lapis_desktop::ai::configuration::ProviderStore::open(
            settings.parent().ok_or_else(invalid)?.into(),
        );
        self.source
            .set(Source {
                settings,
                home,
                providers,
            })
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
    #[cfg(test)]
    pub fn prepare(&self) -> io::Result<()> {
        self.prepare_with_compute(None)
    }
    #[cfg(test)]
    pub fn prepare_with_compute(
        &self,
        compute: Option<BTreeMap<String, String>>,
    ) -> io::Result<()> {
        self.prepare_profiles(
            None,
            BTreeMap::from([
                ("local".into(), compute.clone()),
                ("paired".into(), compute),
            ]),
        )
    }
    pub fn prepare_profiles(
        &self,
        vault: Option<&str>,
        compute: BTreeMap<String, Option<BTreeMap<String, String>>>,
    ) -> io::Result<()> {
        let _guard = self.preparing.lock().map_err(|_| invalid())?;
        let prepared = self.load_snapshot(vault, compute)?;
        *self.ready.lock().map_err(|_| invalid())? = prepared;
        Ok(())
    }
    /// Owned preparation: subsequent vault refreshes cannot change this launch.
    pub fn snapshot(
        &self,
        vault: Option<&str>,
        compute: BTreeMap<String, Option<BTreeMap<String, String>>>,
    ) -> io::Result<Option<Ready>> {
        let _guard = self.preparing.lock().map_err(|_| invalid())?;
        self.load_snapshot(vault, compute)
    }
    fn load_snapshot(
        &self,
        vault: Option<&str>,
        compute: BTreeMap<String, Option<BTreeMap<String, String>>>,
    ) -> io::Result<Option<Ready>> {
        self.source
            .get()
            .map(|source| {
                configuration::load(source, self.bundle.get(), &self.verified, vault, compute)
            })
            .transpose()
            .map(Option::flatten)
    }
    pub fn compute_plan(&self) -> io::Result<PreparedLaunch> {
        compute_profile::plan(self)
    }
    pub fn contains(&self, target: &str) -> bool {
        self.ready
            .lock()
            .is_ok_and(|ready| ready.as_ref().is_some_and(|ready| ready.contains(target)))
    }
    pub fn retains(&self, target: &str) -> bool {
        matches!(
            target,
            "codex" | "cursor" | "opencode" | "local" | "local:restricted"
        ) || local_profile_id(target).is_some()
    }
    pub fn targets(&self) -> Vec<Target> {
        self.ready
            .lock()
            .ok()
            .and_then(|ready| ready.as_ref().map(Ready::targets))
            .unwrap_or_default()
    }
    pub fn launch(&self, target: &str, root: &Path) -> io::Result<Option<Launch>> {
        let ready = self.ready.lock().map_err(|_| invalid())?;
        ready
            .as_ref()
            .map_or(Ok(None), |ready| ready.launch(target, root))
    }
    pub fn providers(&self) -> io::Result<lapis_desktop::ai::configuration::ProviderStore> {
        self.source
            .get()
            .map(|source| source.providers.clone())
            .ok_or_else(invalid)
    }
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

mod compute_profile;
mod configuration;
#[cfg(test)]
mod external_tests;
mod local_profile;
mod prepared;
#[cfg(test)]
pub(super) mod tests;

pub(super) fn local_profile_id(target: &str) -> Option<&str> {
    target
        .strip_prefix("local:profile:")
        .filter(|id| lapis_desktop::ai::configuration::valid_profile_id(id))
}

#[cfg(test)]
mod agent_tests;
