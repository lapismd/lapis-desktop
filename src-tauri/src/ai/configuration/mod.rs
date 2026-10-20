//! Native provider configuration. No execution, vault state or readable secrets.
mod secrets;
mod types;
pub use secrets::{Secrets, device as device_secrets};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs, io,
    path::PathBuf,
    sync::{Arc, Mutex},
};
pub use types::{ProviderConfiguration, Save, Status};
use types::{State, providers};
use zeroize::Zeroizing;

pub(super) fn unavailable() -> io::Error {
    io::Error::other("AI provider configuration is unavailable")
}
#[derive(Clone)]
pub struct ProviderStore {
    root: PathBuf,
    secrets: Arc<dyn Secrets>,
    gate: Arc<Mutex<()>>,
}
impl ProviderStore {
    pub fn open(profile: PathBuf) -> Self {
        let secrets = secrets::device(&profile);
        Self::with_secrets(profile, secrets)
    }
    pub fn with_secrets(profile: PathBuf, secrets: Arc<dyn Secrets>) -> Self {
        Self {
            root: profile.join("ai-providers"),
            secrets,
            gate: Arc::default(),
        }
    }
    fn read(&self) -> io::Result<State> {
        let path = self.root.join("settings.json");
        match fs::symlink_metadata(&path) {
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(State::default()),
            Err(error) => Err(error),
            Ok(metadata) if metadata.is_file() && metadata.len() <= 32768 => {
                serde_json::from_slice(&fs::read(path)?).map_err(|_| unavailable())
            }
            _ => Err(unavailable()),
        }
    }
    fn view(&self, state: State) -> Status {
        Status {
            revision: state.revision,
            credential_available: state
                .credentials
                .contains_key(&state.configuration.provider),
            configuration: state.configuration,
            keychain_supported: self.secrets.supported(),
            last_request: state.last_request,
            cleanup_pending: !state.retired.is_empty(),
            providers: providers(),
        }
    }
    pub fn status(&self) -> io::Result<Status> {
        Ok(self.view(self.read()?))
    }
    pub fn save(&self, mut command: Save) -> io::Result<Status> {
        let secret = command.secret.take().map(Zeroizing::new);
        validate(&command.configuration)?;
        if (command.clear_secret && secret.is_some())
            || secret
                .as_ref()
                .is_some_and(|s| s.len() < 8 || s.len() > 4096 || s.chars().any(char::is_control))
        {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Enter a valid provider credential",
            ));
        }
        let digest = {
            let mut digest = Sha256::new();
            digest.update(serde_json::to_vec(&command.configuration).map_err(|_| unavailable())?);
            digest.update(command.expected_revision.to_be_bytes());
            digest.update([u8::from(command.clear_secret), u8::from(secret.is_some())]);
            if let Some(secret) = &secret {
                digest.update(secret.as_bytes());
            }
            format!("{:x}", digest.finalize())
        };
        let _guard = self.gate.lock().map_err(|_| unavailable())?;
        let mut state = self.read()?;
        if state.last_request == Some(command.request_id) {
            return if state.last_digest == digest {
                self.cleanup(&mut state)?;
                Ok(self.view(state))
            } else {
                Err(unavailable())
            };
        }
        if state.revision != command.expected_revision {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "AI provider settings changed. Check again before saving.",
            ));
        }
        let id = command.request_id.to_string();
        if state.retired.len() >= 64 {
            return Err(unavailable());
        }
        if let Some(secret) = &secret {
            self.secrets.set(&id, secret)?;
            if let Some(previous) = state
                .credentials
                .insert(command.configuration.provider.clone(), id)
            {
                state.retired.insert(previous);
            }
        }
        if command.clear_secret
            && let Some(previous) = state.credentials.remove(&command.configuration.provider)
        {
            state.retired.insert(previous);
        }
        state.configuration = command.configuration;
        state.revision = state.revision.checked_add(1).ok_or_else(unavailable)?;
        state.last_request = Some(command.request_id);
        state.last_digest = digest;
        self.persist(&state)?;
        self.cleanup(&mut state)?;
        Ok(self.view(state))
    }
    fn cleanup(&self, state: &mut State) -> io::Result<()> {
        let previous = state.retired.len();
        state
            .retired
            .retain(|reference| self.secrets.remove(reference).is_err());
        if state.retired.len() != previous {
            self.persist(state)?;
        }
        Ok(())
    }
    fn persist(&self, state: &State) -> io::Result<()> {
        fs::create_dir_all(&self.root)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&self.root, fs::Permissions::from_mode(0o700))?;
        }
        let mut temporary = tempfile::NamedTempFile::new_in(&self.root)?;
        use std::io::Write;
        temporary.write_all(&serde_json::to_vec(state).map_err(|_| unavailable())?)?;
        temporary.as_file().sync_all()?;
        temporary
            .persist(self.root.join("settings.json"))
            .map_err(|_| unavailable())?;
        fs::File::open(&self.root)?.sync_all()
    }
    pub fn compute_selected(&self) -> io::Result<bool> {
        Ok(matches!(
            self.read()?.configuration.provider.as_str(),
            "local" | "paired"
        ))
    }
    pub fn environment(&self) -> io::Result<BTreeMap<String, String>> {
        let _guard = self.gate.lock().map_err(|_| unavailable())?;
        let state = self.read()?;
        validate(&state.configuration)?;
        let provider = providers()
            .into_iter()
            .find(|p| p.id == state.configuration.provider)
            .ok_or_else(unavailable)?;
        if provider.managed {
            return Err(unavailable());
        }
        let mut environment = BTreeMap::from([
            ("BUZZ_AGENT_PROVIDER".into(), provider.runtime_provider),
            (
                "BUZZ_AGENT_MODEL".into(),
                state.configuration.model.unwrap_or_else(|| "auto".into()),
            ),
        ]);
        if let Some(endpoint) = state.configuration.endpoint.or(provider.default_endpoint) {
            environment.insert(provider.endpoint_env, endpoint);
        }
        if let Some(name) = provider.credential_env {
            let reference = state
                .credentials
                .get(&state.configuration.provider)
                .ok_or_else(unavailable)?;
            environment.insert(name, self.secrets.get(reference)?.to_string());
        }
        Ok(environment)
    }
}
fn validate(configuration: &ProviderConfiguration) -> io::Result<()> {
    let provider = providers()
        .into_iter()
        .find(|p| p.id == configuration.provider)
        .ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "Choose a supported AI provider",
            )
        })?;
    if configuration
        .model
        .as_ref()
        .is_some_and(|s| s.trim().is_empty() || s.len() > 256 || s.chars().any(char::is_control))
    {
        return Err(unavailable());
    }
    if let Some(endpoint) = &configuration.endpoint {
        let url = url::Url::parse(endpoint).map_err(|_| unavailable())?;
        let loopback = matches!(url.host(), Some(url::Host::Ipv4(ip)) if ip.is_loopback())
            || matches!(url.host(), Some(url::Host::Ipv6(ip)) if ip.is_loopback());
        if endpoint.len() > 2048
            || (!matches!(url.scheme(), "https") && !(url.scheme() == "http" && loopback))
            || !url.username().is_empty()
            || url.password().is_some()
            || url.query().is_some()
            || url.fragment().is_some()
        {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Use an HTTPS provider URL or a loopback HTTP endpoint",
            ));
        }
    } else if provider.endpoint_required {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "This provider requires an endpoint",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests;
