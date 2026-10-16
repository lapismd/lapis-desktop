use super::{DbReply, DbRequest, NativeDatabase, invalid};
use std::{collections::HashMap, io, path::PathBuf};
use uuid::Uuid;

struct Entry {
    session_id: String,
    profile_id: String,
    database: NativeDatabase,
}

pub struct NativeDatabases {
    directory: PathBuf,
    entries: HashMap<String, Entry>,
}

impl NativeDatabases {
    pub fn new(directory: PathBuf) -> Self {
        Self {
            directory,
            entries: HashMap::new(),
        }
    }

    pub async fn open(&mut self, session_id: String, profile_id: String) -> io::Result<String> {
        let profile_id = Uuid::parse_str(&profile_id)
            .map_err(|_| invalid("Invalid database profile identity"))?
            .to_string();
        if let Some((id, entry)) = self
            .entries
            .iter()
            .find(|(_, entry)| entry.profile_id == profile_id || entry.session_id == session_id)
        {
            if entry.profile_id == profile_id && entry.session_id == session_id {
                return Ok(id.clone());
            }
            return Err(invalid("Database is already owned by another admission"));
        }
        let database = NativeDatabase::open(&self.directory, &profile_id).await?;
        let id = Uuid::new_v4().to_string();
        self.entries.insert(
            id.clone(),
            Entry {
                session_id,
                profile_id,
                database,
            },
        );
        Ok(id)
    }

    pub fn has_session(&self, session_id: &str) -> bool {
        self.entries
            .values()
            .any(|entry| entry.session_id == session_id)
    }

    fn owned(&mut self, session_id: &str, connection_id: &str) -> io::Result<&mut Entry> {
        self.entries
            .get_mut(connection_id)
            .filter(|entry| entry.session_id == session_id)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Database admission is closed or unknown",
                )
            })
    }

    pub async fn execute(
        &mut self,
        session_id: &str,
        connection_id: &str,
        request: DbRequest,
    ) -> io::Result<DbReply> {
        self.owned(session_id, connection_id)?
            .database
            .execute(request)
            .await
    }

    pub async fn close(&mut self, session_id: &str, connection_id: &str) -> io::Result<()> {
        self.owned(session_id, connection_id)?
            .database
            .close()
            .await?;
        self.entries.remove(connection_id);
        Ok(())
    }
}
