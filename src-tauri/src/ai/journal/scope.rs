use super::storage;
use cap_std::fs::Dir;
use jj_store_conversations::store_capture::ContextV1;
use jj_store_core::PublicationScope;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io;

#[derive(Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub(super) struct Scope {
    pub schema: u32,
    pub context: ContextV1,
    pub provider: [u8; 32],
}
impl Scope {
    pub fn new(context: ContextV1, provider: &PublicationScope) -> io::Result<Self> {
        context.validate().map_err(|_| storage::denied())?;
        if provider.repository != Some(context.repository)
            || provider.authority.is_empty()
            || provider.authority.len() > 4096
            || provider.authority.chars().any(char::is_control)
        {
            return Err(storage::denied());
        }
        let provider = Sha256::new_with_prefix(b"lapis-desktop/capture-provider/v1\0")
            .chain_update(provider.authority.as_bytes())
            .chain_update(context.repository.as_bytes())
            .finalize()
            .into();
        Ok(Self {
            schema: 1,
            context,
            provider,
        })
    }
    pub fn key(&self) -> String {
        let digest = Sha256::new_with_prefix(b"lapis-desktop/capture-journal/v1\0")
            .chain_update(self.provider)
            .chain_update(self.context.source().as_bytes())
            .finalize();
        digest.iter().map(|b| format!("{b:02x}")).collect()
    }
    pub fn initialize(&self, dir: &Dir) -> io::Result<()> {
        if storage::read(dir, "binding.json", 16 * 1024)?.is_none() {
            // Missing scope is not permission to adopt an interrupted journal.
            for entry in dir.entries()? {
                if entry?.file_name() != "lease" {
                    return Err(storage::denied());
                }
            }
            storage::write(dir, "binding.json", &serde_json::to_vec(self)?, true)?;
        }
        self.verify(dir)
    }
    pub fn verify(&self, dir: &Dir) -> io::Result<()> {
        let bytes = storage::read(dir, "binding.json", 16 * 1024)?.ok_or_else(storage::denied)?;
        let stored: Self = serde_json::from_slice(&bytes)?;
        if stored != *self {
            return Err(storage::denied());
        }
        Ok(())
    }
}
