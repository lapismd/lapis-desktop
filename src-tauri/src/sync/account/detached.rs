//! Reload-retained accounts drain only at native Quit preparation.
use super::{AccountServices, denied};
use lapis_app_core::sync::account::owner::{AccountClosePreparation, PreparedAccountClose};
use std::io;
use uuid::Uuid;

type Entry<T> = (Uuid, (u64, u64), T);
pub struct DetachedClosePreparation {
    registry: Uuid,
    entries: Vec<Entry<AccountClosePreparation>>,
}

pub struct PreparedDetachedClose {
    registry: Uuid,
    entries: Vec<Entry<PreparedAccountClose>>,
}

impl DetachedClosePreparation {
    pub async fn wait(self) -> io::Result<PreparedDetachedClose> {
        let mut entries = Vec::new();
        for (vault, root, preparation) in self.entries {
            entries.push((vault, root, preparation.wait().await?));
        }
        Ok(PreparedDetachedClose {
            registry: self.registry,
            entries,
        })
    }
}

impl AccountServices {
    pub fn prepare_detached_close(&self) -> io::Result<DetachedClosePreparation> {
        self.identity.verify()?;
        let mut vaults: Vec<_> = self
            .accounts
            .iter()
            .filter(|(_, account)| account.sessions.is_empty())
            .map(|(id, _)| *id)
            .collect();
        vaults.sort();
        let mut entries = Vec::new();
        for vault in vaults {
            let account = &self.accounts[&vault];
            entries.push((vault, account.root, account.owner.prepare_close()?));
        }
        Ok(DetachedClosePreparation {
            registry: self.registry,
            entries,
        })
    }

    pub fn validate_detached_close(&self, prepared: &PreparedDetachedClose) -> io::Result<()> {
        self.identity.verify()?;
        if prepared.registry != self.registry {
            return Err(denied());
        }
        for (vault, root, _) in &prepared.entries {
            if !self
                .accounts
                .get(vault)
                .is_some_and(|account| account.root == *root && account.sessions.is_empty())
            {
                return Err(denied());
            }
        }
        Ok(())
    }

    /// Blocking native commit after the other Quit owners approve. A failed or
    /// partial commit retains every owner; positive inspection alone collects it.
    pub fn commit_detached_close(&mut self, prepared: PreparedDetachedClose) -> io::Result<usize> {
        self.validate_detached_close(&prepared)?;
        for (_, _, account) in prepared.entries {
            account.commit()?;
        }
        Ok(self.collect_closed())
    }
}
