//! Native admission adapter. Call under the host's existing shared file IO gate.
use super::VaultManager;
use lapis_app_core::services::{Client, Runtime};
use lapis_app_protocol::files::{FileCommand, FileValue};
use std::{collections::HashMap, io};
use uuid::Uuid;

#[derive(Default)]
pub struct VaultServices {
    runtime: Runtime,
    clients: HashMap<String, Client>,
}
impl VaultServices {
    pub fn files(
        &mut self,
        vaults: &VaultManager,
        session: &str,
        command: FileCommand,
    ) -> io::Result<FileValue> {
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        if !self.clients.contains_key(session) {
            let id = Uuid::parse_str(&vaults.descriptor(session)?.profile_id)
                .map_err(|_| io::Error::other("Invalid native vault identity"))?;
            let service = self
                .runtime
                .admit_root(id, root.try_clone()?)
                .map_err(io::Error::other)?;
            self.clients
                .insert(session.into(), service.attach().map_err(io::Error::other)?);
        }
        self.clients[session]
            .files(command)
            .map_err(io::Error::other)
    }
    /// Explicit vault closure, not a client/window disconnection. Never hold the
    /// file IO gate while a service drains its previously admitted workers.
    pub fn close(&mut self, vaults: &VaultManager, session: &str) -> io::Result<()> {
        vaults.get(session)?;
        if let Some(client) = self.clients.get(session) {
            let id = client.descriptor().vault_id;
            let service = self.runtime.get(id).map_err(io::Error::other)?;
            if service.status().map_err(io::Error::other)?.clients == 1 {
                self.runtime.close_vault(id).map_err(io::Error::other)?;
            }
        }
        self.clients.remove(session);
        Ok(())
    }
}
