use super::{VaultRoot, invalid};
use cap_std::{ambient_authority, fs::Dir};
use cap_tempfile::TempFile;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecentVault {
    pub id: String,
    pub name: String,
    pub path: String,
    root_identity: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultDescriptor {
    pub profile_id: String,
    pub session_id: String,
    pub name: String,
    pub path: String,
    pub resource_token: String,
}

struct Admission {
    root: VaultRoot,
    descriptor: VaultDescriptor,
}

pub struct VaultManager {
    profile_dir: Dir,
    recents: Vec<RecentVault>,
    sessions: HashMap<String, Admission>,
}

fn identity(root: &VaultRoot) -> io::Result<String> {
    #[cfg(unix)]
    {
        use cap_std::fs::MetadataExt;
        let metadata = root.dir.dir_metadata()?;
        Ok(format!("{}:{}", metadata.dev(), metadata.ino()))
    }
    #[cfg(not(unix))]
    Ok(root.path().to_string_lossy().into_owned())
}

pub fn validate_name(name: &str) -> io::Result<()> {
    if name.trim() != name
        || name.is_empty()
        || name.len() > 255
        || name == "."
        || name == ".."
        || name.contains(['/', '\\', '\0', ':'])
    {
        return Err(invalid("Enter a single folder name"));
    }
    Ok(())
}

impl VaultManager {
    pub fn new(profile_directory: &Path) -> io::Result<Self> {
        std::fs::create_dir_all(profile_directory)?;
        let profile_dir = Dir::open_ambient_dir(profile_directory, ambient_authority())?;
        let recents: Vec<RecentVault> = match profile_dir.read("recent-vaults.json") {
            Ok(bytes) if bytes.len() <= 128 * 1024 => serde_json::from_slice(&bytes)
                .map_err(|_| invalid("Recent vault profile is invalid"))?,
            Ok(_) => return Err(invalid("Recent vault profile is too large")),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Vec::new(),
            Err(error) => return Err(error),
        };
        if recents.len() > 20 {
            return Err(invalid("Too many recent vault profiles"));
        }
        Ok(Self {
            profile_dir,
            recents,
            sessions: HashMap::new(),
        })
    }

    pub fn recents(&self) -> &[RecentVault] {
        &self.recents
    }

    pub fn remember_notes(&self, session_id: Option<&str>) -> io::Result<()> {
        let profile_id = session_id
            .map(|id| {
                self.descriptor(id)
                    .map(|descriptor| descriptor.profile_id.clone())
            })
            .transpose()?;
        let mut staged = TempFile::new(&self.profile_dir)?;
        staged.write_all(&serde_json::to_vec(&profile_id)?)?;
        staged.as_file().sync_all()?;
        staged.replace("last-notes.json")?;
        Ok(())
    }

    pub fn restore_notes(&mut self) -> io::Result<Option<VaultDescriptor>> {
        let bytes = match self.profile_dir.read("last-notes.json") {
            Ok(bytes) if bytes.len() <= 1024 => bytes,
            Ok(_) => return Err(invalid("Saved Notes profile is too large")),
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(error),
        };
        let profile_id: Option<String> = serde_json::from_slice(&bytes)
            .map_err(|_| invalid("Saved Notes profile is invalid"))?;
        profile_id.map(|id| self.open_recent(&id)).transpose()
    }

    pub fn select(
        &mut self,
        selection: Option<PathBuf>,
        create_name: Option<&str>,
    ) -> io::Result<Option<VaultDescriptor>> {
        let Some(selection) = selection else {
            return Ok(None);
        };
        if self.sessions.len() >= 16 {
            return Err(invalid("Close a vault before opening another"));
        }
        let root = if let Some(name) = create_name {
            validate_name(name)?;
            let parent = VaultRoot::open(&selection)?;
            parent.create_child(name)?
        } else {
            VaultRoot::open(&selection)?
        };
        self.admit(root, None).map(Some)
    }

    pub fn open_recent(&mut self, profile_id: &str) -> io::Result<VaultDescriptor> {
        let profile = self
            .recents
            .iter()
            .find(|profile| profile.id == profile_id)
            .ok_or_else(|| invalid("Unknown recent vault"))?
            .clone();
        let root = VaultRoot::open(Path::new(&profile.path))?;
        if root.path() != Path::new(&profile.path) || identity(&root)? != profile.root_identity {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Vault folder changed; select it again",
            ));
        }
        if self.sessions.len() >= 16 {
            return Err(invalid("Close a vault before opening another"));
        }
        self.admit(root, Some(profile.id))
    }

    fn admit(&mut self, root: VaultRoot, id: Option<String>) -> io::Result<VaultDescriptor> {
        let path = root
            .path()
            .to_str()
            .ok_or_else(|| invalid("Folder path is not UTF-8"))?
            .to_owned();
        let profile_id = id
            .or_else(|| {
                self.recents
                    .iter()
                    .find(|entry| entry.path == path)
                    .map(|entry| entry.id.clone())
            })
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        let name = root
            .path()
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("Vault")
            .to_owned();
        let mut recents = self.recents.clone();
        recents.retain(|entry| entry.id != profile_id);
        recents.insert(
            0,
            RecentVault {
                id: profile_id.clone(),
                name: name.clone(),
                path: path.clone(),
                root_identity: identity(&root)?,
            },
        );
        recents.truncate(20);
        let mut staged = TempFile::new(&self.profile_dir)?;
        staged.write_all(&serde_json::to_vec(&recents)?)?;
        staged.as_file().sync_all()?;
        staged.replace("recent-vaults.json")?;
        let descriptor = VaultDescriptor {
            profile_id,
            session_id: Uuid::new_v4().to_string(),
            name,
            path,
            resource_token: Uuid::new_v4().to_string(),
        };
        self.recents = recents;
        self.sessions.insert(
            descriptor.session_id.clone(),
            Admission {
                root,
                descriptor: descriptor.clone(),
            },
        );
        Ok(descriptor)
    }

    pub fn get(&self, session_id: &str) -> io::Result<&VaultRoot> {
        self.sessions
            .get(session_id)
            .map(|entry| &entry.root)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Vault admission is closed or unknown",
                )
            })
    }

    pub fn descriptor(&self, session_id: &str) -> io::Result<&VaultDescriptor> {
        self.sessions
            .get(session_id)
            .map(|entry| &entry.descriptor)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Vault admission is closed or unknown",
                )
            })
    }

    pub fn resource(&self, token: &str) -> io::Result<&VaultRoot> {
        self.sessions
            .values()
            .find(|entry| entry.descriptor.resource_token == token)
            .map(|entry| &entry.root)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Resource admission is closed or unknown",
                )
            })
    }

    pub fn close(&mut self, session_id: &str) -> io::Result<()> {
        self.sessions
            .remove(session_id)
            .ok_or_else(|| invalid("Vault admission is already closed"))?;
        Ok(())
    }
}
