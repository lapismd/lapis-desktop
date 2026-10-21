use super::{Action, Command, Saved, Settings, unavailable};
use std::{
    fs,
    io::{self, Write},
    path::PathBuf,
    sync::{Arc, Mutex},
};
#[derive(Clone)]
pub(super) struct Store {
    pub root: PathBuf,
    gate: Arc<Mutex<()>>,
}
impl Store {
    pub fn new(root: PathBuf) -> Self {
        Self {
            root,
            gate: Arc::default(),
        }
    }
    pub fn read(&self) -> io::Result<Saved> {
        let path = self.root.join("settings.json");
        match fs::symlink_metadata(&path) {
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(Saved::default()),
            Ok(meta) if meta.is_file() && meta.len() <= 65536 => {
                serde_json::from_slice(&fs::read(path)?).map_err(|_| unavailable())
            }
            _ => Err(unavailable()),
        }
    }
    pub fn persist(&self, saved: &Saved) -> io::Result<()> {
        use std::os::unix::fs::PermissionsExt;
        fs::create_dir_all(&self.root)?;
        fs::set_permissions(&self.root, fs::Permissions::from_mode(0o700))?;
        let mut file = tempfile::NamedTempFile::new_in(&self.root)?;
        file.write_all(&serde_json::to_vec(saved).map_err(|_| unavailable())?)?;
        file.as_file().sync_all()?;
        file.persist(self.root.join("settings.json"))
            .map_err(|_| unavailable())?;
        fs::File::open(&self.root)?.sync_all()
    }
    pub fn admit(&self, command: &Command) -> io::Result<bool> {
        let _guard = self.gate.lock().map_err(|_| unavailable())?;
        let mut saved = self.read()?;
        if let Some(old) = &saved.request {
            if old.request_id == command.request_id {
                if serde_json::to_vec(old).ok() != serde_json::to_vec(command).ok() {
                    return Err(unavailable());
                }
                return Ok(false);
            }
            if saved.outcome.as_deref() == Some("pending") {
                return Err(io::Error::new(
                    io::ErrorKind::WouldBlock,
                    "Compute already has a pending operation. Check progress or stop compute before retrying.",
                ));
            }
        }
        if command.expected_revision != saved.settings.revision {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Compute settings changed; refresh before retrying",
            ));
        }
        if let Action::Configure { settings } = &command.action {
            settings.validate()?;
        }
        saved.request = Some(command.clone());
        saved.outcome = Some("pending".into());
        saved.failure = None;
        self.persist(&saved)?;
        Ok(true)
    }
    pub fn finish(&self, command: &Command, outcome: &str) -> io::Result<()> {
        self.finish_with_failure(command, outcome, None)
    }
    pub fn finish_with_failure(
        &self,
        command: &Command,
        outcome: &str,
        failure: Option<tauri_plugin_lapis_ai::runtime::ComputeFailure>,
    ) -> io::Result<()> {
        let _guard = self.gate.lock().map_err(|_| unavailable())?;
        let mut saved = self.read()?;
        if saved.request.as_ref().map(|r| r.request_id) != Some(command.request_id) {
            return Err(unavailable());
        }
        if outcome == "completed"
            && let Action::Configure { settings } = &command.action
        {
            saved.settings = Settings {
                revision: saved
                    .settings
                    .revision
                    .checked_add(1)
                    .ok_or_else(unavailable)?,
                ..settings.clone()
            };
        }
        saved.outcome = Some(outcome.into());
        saved.failure = failure;
        self.persist(&saved)
    }
    pub fn recover(&self) -> io::Result<()> {
        let _guard = self.gate.lock().map_err(|_| unavailable())?;
        let mut saved = self.read()?;
        if saved.outcome.as_deref() == Some("pending") {
            saved.outcome = Some("unknown".into());
            self.persist(&saved)?;
        }
        Ok(())
    }
}
