use crate::vault::VaultManager;
use cap_std::fs::Dir;
use std::{
    collections::HashMap,
    io,
    path::{Path, PathBuf},
    sync::Arc,
};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct VaultLease {
    generation: String,
    session: String,
    profile: String,
    root: PathBuf,
    identity: (u64, u64),
    witness: Arc<Dir>,
}
impl VaultLease {
    pub fn generation(&self) -> &str {
        &self.generation
    }
    pub fn session(&self) -> &str {
        &self.session
    }
    pub fn profile(&self) -> &str {
        &self.profile
    }
    pub fn root(&self) -> &Path {
        &self.root
    }
    fn same_root(&self, other: &Self) -> bool {
        self.profile == other.profile && self.root == other.root && self.identity == other.identity
    }
    fn verify_retained(&self) -> io::Result<()> {
        use cap_std::fs::MetadataExt;
        use std::os::unix::fs::MetadataExt as _;
        let retained = self.witness.dir_metadata()?;
        let current = std::fs::symlink_metadata(&self.root)?;
        if !current.is_dir()
            || (retained.dev(), retained.ino()) != self.identity
            || (current.dev(), current.ino()) != self.identity
        {
            return Err(denied("Vault folder identity changed"));
        }
        Ok(())
    }
}
#[derive(Debug)]
pub struct AdmissionPlan {
    window: String,
    ticket: Uuid,
    lease: VaultLease,
    preserve: bool,
}
impl AdmissionPlan {
    pub fn preserves_workers(&self) -> bool {
        self.preserve
    }
    pub fn generation(&self) -> &str {
        self.lease.generation()
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RetiredAdmission {
    pub window: String,
    pub generation: String,
}
#[derive(Debug)]
pub struct AdmissionFailure {
    pub retired: Option<RetiredAdmission>,
    pub error: io::Error,
}
enum State {
    Pending { ticket: Uuid, preserve: bool },
    Active,
    Suspended,
}
struct Entry {
    lease: VaultLease,
    state: State,
}

/// Native-only transitions; no renderer-supplied root or generation.
#[derive(Default)]
pub struct VaultAdmissions {
    entries: HashMap<String, Entry>,
    closing: HashMap<String, Vec<RetiredAdmission>>,
}
impl VaultAdmissions {
    pub fn prepare(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        session: &str,
    ) -> io::Result<AdmissionPlan> {
        if window.is_empty()
            || window.len() > 256
            || window.chars().any(char::is_control)
            || (!self.entries.contains_key(window) && self.entries.len() >= 16)
            || self.closing.contains_key(session)
        {
            return Err(denied("Vault admission is unavailable"));
        }
        let mut lease = current(vaults, session, Uuid::new_v4().to_string())?;
        let previous = self.entries.get(window);
        let preserve = previous.is_some_and(|entry| {
            !matches!(entry.state, State::Pending { .. }) && entry.lease.same_root(&lease)
        });
        if preserve {
            lease.generation = previous.unwrap().lease.generation.clone();
        }
        let ticket = Uuid::new_v4();
        self.entries.insert(
            window.into(),
            Entry {
                lease: lease.clone(),
                state: State::Pending { ticket, preserve },
            },
        );
        Ok(AdmissionPlan {
            window: window.into(),
            ticket,
            lease,
            preserve,
        })
    }
    /// Required worker retirement must succeed before this phase.
    pub fn complete(
        &mut self,
        vaults: &VaultManager,
        plan: &AdmissionPlan,
    ) -> io::Result<VaultLease> {
        let matches = self.entries.get(&plan.window).is_some_and(
            |entry| matches!(entry.state, State::Pending { ticket, .. } if ticket == plan.ticket),
        );
        if !matches || self.closing.contains_key(&plan.lease.session) {
            return Err(denied("Vault admission transition is stale"));
        }
        let verified = current(vaults, &plan.lease.session, plan.lease.generation.clone());
        match verified {
            Ok(lease) if lease.same_root(&plan.lease) => {
                self.entries.get_mut(&plan.window).unwrap().state = State::Active;
                Ok(lease)
            }
            result => {
                self.entries.remove(&plan.window);
                Err(result
                    .err()
                    .unwrap_or_else(|| denied("Vault folder identity changed")))
            }
        }
    }
    pub fn authorize(
        &mut self,
        vaults: &VaultManager,
        window: &str,
    ) -> Result<VaultLease, AdmissionFailure> {
        self.authorize_scope(vaults, window, None)
    }
    /// Native retained work only; this never admits renderer operations.
    pub fn authorize_retained(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        generation: &str,
    ) -> Result<VaultLease, AdmissionFailure> {
        self.authorize_scope(vaults, window, Some(generation))
    }
    fn authorize_scope(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        retained: Option<&str>,
    ) -> Result<VaultLease, AdmissionFailure> {
        let unavailable = || AdmissionFailure {
            retired: None,
            error: denied("Vault scope is disabled or suspended"),
        };
        let entry = self
            .entries
            .get(window)
            .filter(|entry| match retained {
                None => matches!(entry.state, State::Active),
                Some(generation) => {
                    entry.lease.generation == generation
                        && !matches!(
                            entry.state,
                            State::Pending {
                                preserve: false,
                                ..
                            }
                        )
                }
            })
            .ok_or_else(unavailable)?;
        let original = entry.lease.clone();
        let suspended = retained.is_some() && matches!(entry.state, State::Suspended);
        let verified = if suspended {
            original.verify_retained().map(|()| original.clone())
        } else {
            current(vaults, &original.session, original.generation.clone())
        };
        match verified {
            Ok(lease)
                if lease.same_root(&original)
                    && (suspended || !self.closing.contains_key(&original.session)) =>
            {
                Ok(lease)
            }
            result => {
                self.entries.remove(window);
                Err(AdmissionFailure {
                    retired: Some(RetiredAdmission {
                        window: window.into(),
                        generation: original.generation,
                    }),
                    error: result
                        .err()
                        .unwrap_or_else(|| denied("Vault folder identity changed")),
                })
            }
        }
    }
    /// True retains workers for reload while denying renderer operations.
    pub fn leave(&mut self, window: &str, reload: bool) -> bool {
        if reload
            && let Some(entry) = self.entries.get_mut(window)
            && !matches!(entry.state, State::Pending { .. })
        {
            entry.state = State::Suspended;
            return true;
        }
        self.entries.remove(window);
        false
    }
    pub fn begin_close_vault(&mut self, session: &str) -> Vec<RetiredAdmission> {
        if let Some(retired) = self.closing.get(session) {
            return retired.clone();
        }
        let windows: Vec<_> = self
            .entries
            .iter()
            .filter(|(_, entry)| {
                entry.lease.session == session && !matches!(entry.state, State::Suspended)
            })
            .map(|(window, entry)| RetiredAdmission {
                window: window.clone(),
                generation: entry.lease.generation.clone(),
            })
            .collect();
        for retired in &windows {
            self.entries.remove(&retired.window);
        }
        self.closing.insert(session.into(), windows.clone());
        windows
    }
    pub fn finish_close_vault(&mut self, session: &str) {
        self.closing.remove(session);
    }
}
fn current(vaults: &VaultManager, session: &str, generation: String) -> io::Result<VaultLease> {
    let root = vaults.get(session)?;
    root.verify_physical_root()?;
    let descriptor = vaults.descriptor(session)?;
    Ok(VaultLease {
        generation,
        session: session.into(),
        profile: descriptor.profile_id.clone(),
        root: root.path().into(),
        identity: root.physical_identity()?,
        witness: Arc::new(root.dir.try_clone()?),
    })
}
fn denied(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::PermissionDenied, message)
}
