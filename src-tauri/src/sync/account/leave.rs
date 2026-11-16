//! Native host leave transaction. The host retains its transition guard through
//! preparation, its other owners' leave checks, commit and registry completion.
use super::{AccountObservation, AccountServices, denied};
use crate::vault::VaultManager;
use lapis_app_core::sync::account::owner::{AccountClosePreparation, PreparedAccountClose};
use std::io;
use uuid::Uuid;

struct Scope {
    registry: Uuid,
    session: String,
    vault: Uuid,
    root: (u64, u64),
    close_owner: bool,
}

pub struct SessionClosePreparation {
    scope: Scope,
    preparation: Option<AccountClosePreparation>,
}
impl SessionClosePreparation {
    pub async fn wait(self) -> io::Result<PreparedSessionClose> {
        let prepared = match self.preparation {
            Some(preparation) => Some(preparation.wait().await?),
            None => None,
        };
        Ok(PreparedSessionClose {
            scope: self.scope,
            prepared,
        })
    }
}

/// Dropping before commit leaves both account ownership and window handles intact.
pub struct PreparedSessionClose {
    scope: Scope,
    prepared: Option<PreparedAccountClose>,
}
impl PreparedSessionClose {
    /// Blocking native commit, called off UI/async executors after other checks.
    pub fn commit(self) -> io::Result<ClosedSession> {
        if let Some(prepared) = self.prepared {
            prepared.commit()?;
        }
        Ok(ClosedSession(self.scope))
    }
}

/// Original-scope completion proof; cannot be constructed from renderer input.
pub struct ClosedSession(Scope);

impl AccountServices {
    pub fn prepare_session_close(
        &mut self,
        vaults: &VaultManager,
        session: &str,
        reload: bool,
    ) -> io::Result<SessionClosePreparation> {
        self.identity.verify()?;
        let vault =
            Uuid::parse_str(&vaults.descriptor(session)?.profile_id).map_err(|_| denied())?;
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        let physical = root.physical_identity()?;
        let mut close_owner = false;
        let preparation = if let Some(account) = self.accounts.get(&vault) {
            if account.root != physical {
                return Err(denied());
            }
            close_owner = !reload && account.sessions.iter().all(|other| other == session);
            if close_owner {
                Some(account.owner.prepare_close()?)
            } else {
                None
            }
        } else {
            None
        };
        Ok(SessionClosePreparation {
            scope: Scope {
                registry: self.registry,
                session: session.into(),
                vault,
                root: physical,
                close_owner,
            },
            preparation,
        })
    }

    /// Revalidate the original native scope before any final host teardown effects.
    pub fn validate_session_close(
        &self,
        vaults: &VaultManager,
        session: &str,
        prepared: &PreparedSessionClose,
    ) -> io::Result<()> {
        let scope = &prepared.scope;
        if scope.registry != self.registry || scope.session != session {
            return Err(denied());
        }
        self.identity.verify()?;
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        if Uuid::parse_str(&vaults.descriptor(session)?.profile_id).ok() != Some(scope.vault)
            || root.physical_identity()? != scope.root
            || self
                .accounts
                .get(&scope.vault)
                .is_some_and(|account| account.root != scope.root)
        {
            return Err(denied());
        }
        Ok(())
    }

    /// Finish only after native commit, before removing the admitted vault session.
    /// A failed/unknown commit never supplies this proof and cannot revoke handles.
    pub fn finish_session_close(
        &mut self,
        vaults: &VaultManager,
        closed: ClosedSession,
    ) -> io::Result<()> {
        let scope = closed.0;
        if scope.registry != self.registry {
            return Err(denied());
        }
        self.identity.verify()?;
        let root = vaults.get(&scope.session)?;
        root.verify_physical_root()?;
        if Uuid::parse_str(&vaults.descriptor(&scope.session)?.profile_id).ok() != Some(scope.vault)
            || root.physical_identity()? != scope.root
        {
            return Err(denied());
        }
        if let Some(account) = self.accounts.get_mut(&scope.vault) {
            if account.root != scope.root
                || (scope.close_owner
                    && !matches!(
                        *account.owner.subscribe().borrow(),
                        AccountObservation::Closed
                    ))
            {
                return Err(denied());
            }
            account.sessions.remove(&scope.session);
        }
        let windows: Vec<_> = self
            .links
            .iter()
            .filter(|(_, link)| link.session == scope.session)
            .map(|(window, _)| window.clone())
            .collect();
        for window in windows {
            self.detach(&window);
        }
        Ok(())
    }
}
