//! Secret-free observations bound to an already admitted presentation scope.
use super::{AccountObservation, AccountServices, denied};
use crate::vault::VaultManager;
use serde::Serialize;
use std::io;
use uuid::Uuid;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Presentation {
    provider: &'static str,
    revision: u64,
    snapshot: Snapshot,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Snapshot {
    profile_id: Uuid,
    vault_id: Uuid,
    phase: &'static str,
    account: Option<AccountObservation>,
}

impl AccountServices {
    pub fn presentation(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        handle: Uuid,
    ) -> io::Result<Presentation> {
        let account = self.observation(vaults, window, handle)?;
        let link = self.links.get_mut(window).ok_or_else(denied)?;
        if link.observed != account {
            link.revision = link
                .revision
                .checked_add(1)
                .filter(|revision| *revision <= 9_007_199_254_740_991)
                .ok_or_else(denied)?;
            link.observed = account.clone();
        }
        let phase = match &account {
            None => "unconfigured",
            Some(AccountObservation::Uninspected) => "uninspected",
            Some(AccountObservation::Ready { .. }) => "ready",
            Some(AccountObservation::RecoveryRequired { .. }) => "recovery-required",
            Some(AccountObservation::Closed) => "closed",
        };
        Ok(Presentation {
            provider: "lapis-server",
            revision: link.revision,
            snapshot: Snapshot {
                profile_id: self.identity.id(),
                vault_id: link.vault,
                phase,
                account,
            },
        })
    }
}
