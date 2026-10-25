use super::{DatabaseConnection, invalid};
use lapis_app_core::services::Client;
use std::{collections::HashMap, io, sync::Arc};
use uuid::Uuid;

struct Entry {
    session_id: String,
    connection: Arc<DatabaseConnection>,
}

#[derive(Default)]
pub struct NativeDatabases {
    entries: HashMap<String, Entry>,
}

impl NativeDatabases {
    pub fn open(
        &mut self,
        session: &str,
        client: Arc<Client>,
    ) -> io::Result<(String, Arc<DatabaseConnection>)> {
        if session.is_empty() {
            return Err(invalid("Native database session is required"));
        }
        if let Some((id, entry)) = self
            .entries
            .iter()
            .find(|(_, entry)| entry.session_id == session)
        {
            entry.connection.require_open()?;
            if entry.connection.client.descriptor().client_id != client.descriptor().client_id {
                return Err(invalid(
                    "Database admission belongs to another vault client",
                ));
            }
            return Ok((id.clone(), entry.connection.clone()));
        }
        let id = Uuid::new_v4().to_string();
        let connection = Arc::new(DatabaseConnection::new(client));
        self.entries.insert(
            id.clone(),
            Entry {
                session_id: session.into(),
                connection: connection.clone(),
            },
        );
        Ok((id, connection))
    }

    pub fn has_session(&self, session: &str) -> bool {
        self.entries
            .values()
            .any(|entry| entry.session_id == session)
    }

    pub fn get(&self, session: &str, id: &str) -> io::Result<Arc<DatabaseConnection>> {
        self.entries
            .get(id)
            .filter(|entry| entry.session_id == session)
            .map(|entry| entry.connection.clone())
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Database admission is closed or unknown",
                )
            })
    }

    pub fn remove(&mut self, session: &str, id: &str) -> io::Result<()> {
        if !self.get(session, id)?.is_closed() {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close database observation before retiring admission",
            ));
        }
        self.entries.remove(id);
        Ok(())
    }
}
