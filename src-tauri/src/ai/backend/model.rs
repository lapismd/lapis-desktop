use jj_store_model::RequestId;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, io};
pub const MAX_CHOICES: usize = 256;
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Backend {
    VaultFiles,
    Jj,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Selection {
    pub backend: Backend,
    pub revision: u32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SelectionReceipt {
    pub request_id: RequestId,
    pub expected_revision: u32,
    pub selection: Selection,
}
#[derive(PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct State {
    pub schema: u32,
    pub profile: String,
    pub physical: [u64; 2],
    pub selection: Selection,
    pub source: Option<[u8; 32]>,
    pub receipts: Vec<SelectionReceipt>,
}
impl State {
    pub fn empty(profile: String, physical: [u64; 2]) -> Self {
        Self {
            schema: 1,
            profile,
            physical,
            selection: Selection {
                backend: Backend::VaultFiles,
                revision: 0,
            },
            source: None,
            receipts: vec![],
        }
    }
    pub fn validate(&self, profile: &str, physical: [u64; 2]) -> io::Result<()> {
        let mut ids = BTreeSet::new();
        if self.schema != 1
            || self.profile != profile
            || self.physical != physical
            || self.receipts.len() > MAX_CHOICES
            || self.selection.revision as usize != self.receipts.len()
            || (self.selection.backend == Backend::Jj) != self.source.is_some()
            || self.receipts.iter().enumerate().any(|(i, r)| {
                r.expected_revision != i as u32
                    || r.selection.revision != i as u32 + 1
                    || !ids.insert(r.request_id)
            })
            || self
                .receipts
                .last()
                .is_some_and(|r| r.selection != self.selection)
            || self.receipts.is_empty() && self.selection.backend != Backend::VaultFiles
        {
            return Err(super::invalid());
        }
        Ok(())
    }
}
