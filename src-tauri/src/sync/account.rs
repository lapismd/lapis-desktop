//! Native account admission, independent of Tauri and view lifetime.
//! The host serializes admission and lifecycle transitions; Core owns execution.
use super::profile::SyncProfile;
use crate::vault::{VaultManager, admission::VaultAdmissions};
use lapis_app_core::{
    sync::account::{
        AccountEndpoint, AccountTransportPolicy,
        owner::{AccountCommand, AccountObservation, AccountOwner, AccountWork},
        protected::{HostAccountCustody, ProtectedAccountState},
        session::AccountSession,
    },
    vault::VaultRoot,
};
use std::{
    collections::{HashMap, HashSet},
    io,
    sync::Arc,
};
use tokio::sync::watch;
use uuid::Uuid;

struct Account {
    owner: AccountOwner,
    origin: String,
    root: (u64, u64),
    sessions: HashSet<String>,
}
struct Link {
    handle: Uuid,
    vault: Uuid,
    session: String,
    generation: String,
}

/// Explicitly selected native service, never constructed by disabled Sync.
/// No secret, filesystem root, execution owner or custody port crosses IPC.
pub struct AccountServices {
    profile: VaultRoot,
    identity: SyncProfile,
    custody: Arc<dyn HostAccountCustody>,
    admissions: VaultAdmissions,
    accounts: HashMap<Uuid, Account>,
    links: HashMap<String, Link>,
}
impl AccountServices {
    pub fn new(profile: &VaultRoot, custody: Arc<dyn HostAccountCustody>) -> io::Result<Self> {
        if !custody.supported() {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Selected Sync custody is unavailable",
            ));
        }
        Ok(Self {
            profile: profile.try_clone()?,
            identity: SyncProfile::open(profile)?,
            custody,
            admissions: VaultAdmissions::default(),
            accounts: HashMap::new(),
            links: HashMap::new(),
        })
    }

    /// Blocking native admission. Production accepts HTTPS origins only.
    pub fn admit(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        session: &str,
        origin: &str,
    ) -> io::Result<Uuid> {
        self.identity.verify()?;
        let vault =
            Uuid::parse_str(&vaults.descriptor(session)?.profile_id).map_err(|_| denied())?;
        let root = vaults.get(session)?;
        root.verify_physical_root()?;
        let endpoint = AccountEndpoint::open(origin, AccountTransportPolicy::Https)?;
        if let Some(account) = self.accounts.get(&vault) {
            if account.origin != endpoint.origin() || account.root != root.physical_identity()? {
                return Err(denied());
            }
            if matches!(
                *account.owner.subscribe().borrow(),
                AccountObservation::Closed
            ) {
                return Err(io::Error::new(
                    io::ErrorKind::NotConnected,
                    "Inspect completed native Sync close before re-admission",
                ));
            }
        } else if self.accounts.len() >= 16 {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close a retained Sync account before admitting another vault",
            ));
        }
        let plan = self.admissions.prepare(vaults, window, session)?;
        let lease = self.admissions.complete(vaults, &plan)?;
        if let std::collections::hash_map::Entry::Vacant(entry) = self.accounts.entry(vault) {
            let store = ProtectedAccountState::open(
                &self.profile,
                root,
                self.identity.id(),
                vault,
                &endpoint,
                self.custody.clone(),
            )?;
            let origin = endpoint.origin().to_owned();
            entry.insert(Account {
                owner: AccountOwner::new(AccountSession::new(store, endpoint)),
                origin,
                root: root.physical_identity()?,
                sessions: HashSet::new(),
            });
        }
        self.identity.verify()?;
        self.accounts
            .get_mut(&vault)
            .unwrap()
            .sessions
            .insert(session.into());
        let handle = Uuid::new_v4();
        self.links.insert(
            window.into(),
            Link {
                handle,
                vault,
                session: session.into(),
                generation: lease.generation().into(),
            },
        );
        Ok(handle)
    }

    /// Must also be called after every wait and before every observation delivery.
    pub fn validate(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        handle: Uuid,
    ) -> io::Result<()> {
        self.identity.verify()?;
        let link = self
            .links
            .get(window)
            .filter(|link| link.handle == handle)
            .ok_or_else(denied)?;
        let lease = self
            .admissions
            .authorize(vaults, window)
            .map_err(|failure| failure.error)?;
        let account = self.accounts.get(&link.vault).ok_or_else(denied)?;
        if lease.generation() != link.generation
            || lease.session() != link.session
            || Uuid::parse_str(lease.profile()).ok() != Some(link.vault)
            || vaults.get(&link.session)?.physical_identity()? != account.root
        {
            return Err(denied());
        }
        Ok(())
    }

    pub fn submit(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        handle: Uuid,
        command: AccountCommand,
    ) -> io::Result<AccountWork> {
        self.validate(vaults, window, handle)?;
        if matches!(command, AccountCommand::Close) {
            return Err(denied());
        }
        self.accounts[&self.links[window].vault]
            .owner
            .submit(command)
    }

    pub fn subscribe(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        handle: Uuid,
    ) -> io::Result<watch::Receiver<AccountObservation>> {
        self.validate(vaults, window, handle)?;
        Ok(self.accounts[&self.links[window].vault].owner.subscribe())
    }

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

fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Native Sync account admission is unavailable",
    )
}
