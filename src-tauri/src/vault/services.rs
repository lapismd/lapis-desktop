//! Native admission adapter. Call under the host's existing shared file IO gate.
use super::VaultManager;
use lapis_app_core::{
    embedding::host::NativeEmbeddingHost,
    services::{BackupStorage, Client, DatabaseStorage, Runtime},
    vault::VaultRoot,
};
use lapis_app_protocol::files::{FileCommand, FileValue};
use std::{
    collections::{HashMap, HashSet},
    io,
    path::Path,
    sync::{Arc, Mutex},
};
use uuid::Uuid;

#[derive(Default)]
pub struct VaultServices {
    runtime: Runtime,
    profile: Option<VaultRoot>,
    clients: HashMap<String, Arc<Client>>,
    detached: HashSet<Uuid>,
}
impl VaultServices {
    /// Installation policy selects the shared owner, never an IPC-supplied path.
    pub fn new(profile: &Path) -> io::Result<Self> {
        let profile = VaultRoot::open(profile)?;
        for name in ["databases", "models"] {
            if let Err(error) = profile.mkdir(name, false)
                && error.kind() != io::ErrorKind::AlreadyExists
            {
                return Err(error);
            }
            let directory = profile.open_directory(name)?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                directory
                    .into_std_file()
                    .set_permissions(std::fs::Permissions::from_mode(0o700))?;
            }
            #[cfg(not(unix))]
            drop(directory);
        }
        let embeddings = NativeEmbeddingHost::managed(&profile.path().join("models"))
            .map_err(io::Error::other)?;
        let storage = DatabaseStorage::new(&profile.path().join("databases"), embeddings)
            .map_err(io::Error::other)?;
        profile.verify_physical_root()?;
        Ok(Self {
            runtime: Runtime::with_database(storage),
            profile: Some(profile),
            clients: HashMap::new(),
            detached: HashSet::new(),
        })
    }

    pub fn new_with_backup(
        profile: &Path,
        history: &Path,
        files: Arc<Mutex<()>>,
    ) -> io::Result<Self> {
        let mut services = Self::new(profile)?;
        let mut directories = std::fs::DirBuilder::new();
        directories.recursive(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::DirBuilderExt;
            directories.mode(0o700);
        }
        directories.create(history)?;
        let storage = BackupStorage::new(history)
            .map_err(io::Error::other)?
            .with_files_gate(files);
        services.runtime = services.runtime.with_backup(storage);
        Ok(services)
    }

    pub fn with_turns(
        mut self,
        profile: &Path,
        policy: Arc<dyn lapis_app_core::services::AgentPolicy>,
        runtime: tokio::runtime::Handle,
    ) -> io::Result<Self> {
        let root = VaultRoot::open(profile)?;
        if let Err(error) = root.mkdir("turns", false)
            && error.kind() != io::ErrorKind::AlreadyExists
        {
            return Err(error);
        }
        let directory = root.open_directory("turns")?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            directory
                .into_std_file()
                .set_permissions(std::fs::Permissions::from_mode(0o700))?;
        }
        root.verify_physical_root()?;
        let storage =
            lapis_app_core::services::TurnStorage::new(&root.path().join("turns"), policy, runtime)
                .map_err(io::Error::other)?;
        self.runtime = self.runtime.with_turns(storage);
        Ok(self)
    }

    pub fn client(&mut self, vaults: &VaultManager, session: &str) -> io::Result<Arc<Client>> {
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        if let Some(profile) = &self.profile {
            profile.verify_physical_root()?;
            if profile.path().starts_with(root.path()) || root.path().starts_with(profile.path()) {
                return Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Native profile, database and model storage must stay outside vault content",
                ));
            }
        }
        if !self.clients.contains_key(session) {
            let id = Uuid::parse_str(&vaults.descriptor(session)?.profile_id)
                .map_err(|_| io::Error::other("Invalid native vault identity"))?;
            let service = self
                .runtime
                .admit_root(id, root.try_clone()?)
                .map_err(io::Error::other)?;
            self.clients.insert(
                session.into(),
                Arc::new(service.attach().map_err(io::Error::other)?),
            );
            self.detached.remove(&id);
        }
        Ok(self.clients[session].clone())
    }

    pub fn files(
        &mut self,
        vaults: &VaultManager,
        session: &str,
        command: FileCommand,
    ) -> io::Result<FileValue> {
        self.client(vaults, session)?
            .files(command)
            .map_err(io::Error::other)
    }
    /// Explicit vault closure, not a client/window disconnection. Never hold the
    /// file IO gate while a service drains its previously admitted workers.
    pub fn close(&mut self, vaults: &VaultManager, session: &str) -> io::Result<()> {
        vaults.get(session)?;
        if let Some(client) = self.clients.get(session) {
            let id = client.descriptor().vault_id;
            // Host admissions, not temporary Arc clones or response waiters,
            // determine when the last explicit vault close drains its owner.
            if self
                .clients
                .values()
                .filter(|client| client.descriptor().vault_id == id)
                .count()
                == 1
            {
                self.runtime.close_vault(id).map_err(io::Error::other)?;
                self.detached.remove(&id);
            }
        }
        self.clients.remove(session);
        Ok(())
    }

    /// Renderer reload retires admission, not the vault-owned backup/database.
    pub fn detach(&mut self, vaults: &VaultManager, session: &str) -> io::Result<()> {
        vaults.get(session)?;
        if let Some(client) = self.clients.remove(session) {
            let id = client.descriptor().vault_id;
            if !self
                .clients
                .values()
                .any(|client| client.descriptor().vault_id == id)
            {
                self.detached.insert(id);
            }
        }
        Ok(())
    }

    /// Before destructive App teardown on Quit, reconcile vaults left by reload.
    pub fn close_detached(&mut self) -> io::Result<()> {
        for id in self.detached.clone() {
            self.runtime.close_vault(id).map_err(io::Error::other)?;
            self.detached.remove(&id);
        }
        Ok(())
    }

    pub fn shutdown(&mut self) -> io::Result<()> {
        self.runtime.shutdown().map_err(io::Error::other)?;
        self.clients.clear();
        self.detached.clear();
        Ok(())
    }
}
