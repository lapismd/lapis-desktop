use super::{AccountCommand, AccountObservation, AccountServices, AccountWork, denied};
use crate::vault::VaultManager;
use std::{collections::HashSet, io};
use uuid::Uuid;

impl AccountServices {
    /// View detach/reload revokes only presentation authority, never native work.
    pub fn detach(&mut self, window: &str) {
        self.links.remove(window);
        self.admissions.leave(window, false);
    }

    /// Native lifecycle only, under the host's transition guard through completion.
    /// The host retains the returned work and inspects its outcome before teardown.
    /// A failed close retains the original owner for explicit custody recovery.
    pub fn close_session(
        &mut self,
        vaults: &VaultManager,
        session: &str,
        reload: bool,
    ) -> io::Result<Option<AccountWork>> {
        self.identity.verify()?;
        let vault =
            Uuid::parse_str(&vaults.descriptor(session)?.profile_id).map_err(|_| denied())?;
        let windows: Vec<_> = self
            .links
            .iter()
            .filter(|(_, link)| link.session == session)
            .map(|(window, _)| window.clone())
            .collect();
        for window in windows {
            self.detach(&window);
        }
        let Some(account) = self.accounts.get_mut(&vault) else {
            return Ok(None);
        };
        vaults.get(session)?.verify_physical_root()?;
        if vaults.get(session)?.physical_identity()? != account.root {
            return Err(denied());
        }
        account.sessions.remove(session);
        if reload || !account.sessions.is_empty() {
            return Ok(None);
        }
        account.owner.submit(AccountCommand::Close).map(Some)
    }

    /// Positive inspection only: an unknown or failed close never releases state.
    pub fn collect_closed(&mut self) -> usize {
        let closed: HashSet<_> = self
            .accounts
            .iter()
            .filter(|(_, account)| {
                matches!(
                    *account.owner.subscribe().borrow(),
                    AccountObservation::Closed
                )
            })
            .map(|(vault, _)| *vault)
            .collect();
        let windows: Vec<_> = self
            .links
            .iter()
            .filter(|(_, link)| closed.contains(&link.vault))
            .map(|(window, _)| window.clone())
            .collect();
        for window in windows {
            self.detach(&window);
        }
        for vault in &closed {
            self.accounts.remove(vault);
        }
        closed.len()
    }
}
