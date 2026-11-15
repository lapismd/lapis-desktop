//! Desktop OS custody. Only secret-free metadata lives in the private profile.
use cap_std::fs::PermissionsExt as _;
use jj_forge::accounts::store::SecretStore;
use lapis_app_core::{
    services::RemoteTokenStore,
    vault::{VaultRoot, WriteOptions},
};
use lapis_app_protocol::repository_remotes::*;
use serde::{Deserialize, Serialize};
use std::{io, path::Path, sync::Arc};
use uuid::Uuid;
use zeroize::{Zeroize, Zeroizing};
const PATH: &str = "tokens.json";
const MAX: usize = 128 * 1024;

pub struct DesktopTokens {
    root: VaultRoot,
    secrets: Arc<dyn SecretStore>,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Record {
    id: String,
    label: String,
    host: String,
    username: String,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Secret {
    id: String,
    host: String,
    username: String,
    token: String,
}
impl Drop for Secret {
    fn drop(&mut self) {
        self.token.zeroize();
    }
}
impl DesktopTokens {
    /// Host-selected private metadata and namespaced OS store, never IPC paths.
    pub fn open(directory: &Path, secrets: Arc<dyn SecretStore>) -> io::Result<Self> {
        let root = VaultRoot::open(directory)?;
        if root
            .directory_handle()?
            .dir_metadata()?
            .permissions()
            .mode()
            & 0o077
            != 0
        {
            return Err(unavailable());
        }
        Ok(Self { root, secrets })
    }
    fn loaded(&self) -> io::Result<(Vec<Record>, Option<Vec<u8>>)> {
        self.root.verify_physical_root()?;
        let Some(metadata) = self.root.stat(PATH)? else {
            return Ok((vec![], None));
        };
        if metadata.r#type != "file" || metadata.size > MAX as u64 {
            return Err(unavailable());
        }
        let bytes = self.root.read_range(PATH, 0, MAX + 1)?;
        if bytes.len() > MAX {
            return Err(unavailable());
        }
        let records: Vec<Record> = serde_json::from_slice(&bytes).map_err(|_| unavailable())?;
        let mut ids = std::collections::HashSet::new();
        for record in &records {
            let id = Uuid::parse_str(&record.id).map_err(|_| unavailable())?;
            if id.is_nil()
                || id.to_string() != record.id
                || !ids.insert(&record.id)
                || record.host != endpoint(&format!("https://{}", record.host))?
                || !username(&record.username)
                || !label(&record.label)
            {
                return Err(unavailable());
            }
        }
        self.root.verify_physical_root()?;
        Ok((records, Some(bytes)))
    }
    fn write(&self, records: &[Record], before: Option<&[u8]>) -> io::Result<()> {
        let bytes = serde_json::to_vec(records).map_err(|_| unavailable())?;
        if bytes.len() > MAX {
            return Err(unavailable());
        }
        self.root
            .write_if_unchanged(PATH, &bytes[..], before, &WriteOptions::default())?;
        self.root.verify_physical_root()
    }
    fn secret(&self, record: &Record) -> io::Result<Secret> {
        let raw = Zeroizing::new(
            self.secrets
                .get(&key(&record.id))
                .map_err(|_| unavailable())?
                .ok_or_else(unavailable)?,
        );
        let secret: Secret = serde_json::from_str(&raw).map_err(|_| unavailable())?;
        if secret.id != record.id
            || secret.host != record.host
            || secret.username != record.username
            || secret.token.is_empty()
            || secret.token.len() > 4096
            || secret.token.chars().any(char::is_control)
        {
            return Err(unavailable());
        }
        Ok(secret)
    }
}
impl RemoteTokenStore for DesktopTokens {
    fn state(&self) -> RemoteStorageState {
        if self.secrets.get("repository-token-access-probe").is_ok() && self.loaded().is_ok() {
            RemoteStorageState::Available
        } else {
            RemoteStorageState::Locked
        }
    }
    fn inventory(&self) -> io::Result<Vec<RemoteCredentialSummary>> {
        self.loaded()?
            .0
            .into_iter()
            .map(|record| {
                let available = self.secret(&record).is_ok();
                Ok(RemoteCredentialSummary {
                    id: record.id,
                    label: record.label,
                    host: record.host,
                    username: record.username,
                    method: RemoteCredentialMethod::Token,
                    available,
                })
            })
            .collect()
    }
    fn save(&self, input: &RemoteCredentialInput) -> io::Result<()> {
        let host = endpoint(&format!("https://{}", input.host))?;
        if !matches!(input.provider, RemoteCredentialProvider::Https)
            || host != input.host.to_lowercase()
            || !username(&input.username)
            || !label(&input.label)
            || input.token.is_empty()
            || input.token.len() > 4096
            || input.token.chars().any(char::is_control)
        {
            return Err(unavailable());
        }
        let (mut records, before) = self.loaded()?;
        let id = if let Some(id) = &input.replace {
            let record = records
                .iter()
                .find(|r| r.id == *id)
                .ok_or_else(unavailable)?;
            if record.host != host || record.username != input.username {
                return Err(unavailable());
            }
            id.clone()
        } else {
            Uuid::new_v4().to_string()
        };
        let secret = Secret {
            id: id.clone(),
            host: host.clone(),
            username: input.username.clone(),
            token: input.token.clone(),
        };
        let encoded = Zeroizing::new(serde_json::to_string(&secret).map_err(|_| unavailable())?);
        self.secrets
            .set(&key(&id), &encoded)
            .map_err(|_| unavailable())?;
        records.retain(|r| r.id != id);
        records.push(Record {
            id,
            label: input.label.clone(),
            host,
            username: input.username.clone(),
        });
        self.write(&records, before.as_deref())
    }
    fn forget(&self, id: &str) -> io::Result<()> {
        let (mut records, before) = self.loaded()?;
        if !records.iter().any(|r| r.id == id) {
            return Err(unavailable());
        }
        self.secrets.remove(&key(id)).map_err(|_| unavailable())?;
        records.retain(|r| r.id != id);
        self.write(&records, before.as_deref())
    }
    fn resolve(&self, connection: &RemoteConnection) -> io::Result<jj_vault::GitCredentials> {
        if connection.authentication != RemoteAuthentication::Token {
            return Err(unavailable());
        }
        let records = self.loaded()?.0;
        let record = records
            .iter()
            .find(|r| r.id == connection.credential)
            .ok_or_else(unavailable)?;
        if endpoint(&connection.url)? != record.host {
            return Err(unavailable());
        }
        let secret = self.secret(record)?;
        jj_vault::GitCredentials::basic(&secret.username, &secret.token).map_err(|_| unavailable())
    }
}
fn endpoint(value: &str) -> io::Result<String> {
    let url = url::Url::parse(value).map_err(|_| unavailable())?;
    if url.scheme() != "https"
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(unavailable());
    }
    Ok(url
        .origin()
        .ascii_serialization()
        .trim_start_matches("https://")
        .to_owned())
}
fn username(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"-_.".contains(&c))
}
fn label(value: &str) -> bool {
    !value.trim().is_empty() && value.len() <= 128 && !value.chars().any(char::is_control)
}
fn key(id: &str) -> String {
    format!("repository-token-{id}")
}
fn unavailable() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Repository credential storage is locked or unavailable",
    )
}
