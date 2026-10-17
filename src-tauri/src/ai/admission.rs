use crate::vault::VaultManager;
use std::{
    collections::HashMap,
    io,
    path::{Path, PathBuf},
};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct AiLease {
    generation: String,
    session: String,
    profile: String,
    root: PathBuf,
    identity: (u64, u64),
}
impl AiLease {
    pub fn generation(&self) -> &str {
        &self.generation
    }
    pub fn root(&self) -> &Path {
        &self.root
    }
    fn same_root(&self, other: &Self) -> bool {
        self.profile == other.profile && self.root == other.root && self.identity == other.identity
    }
}
#[derive(Debug)]
pub struct AdmissionPlan {
    window: String,
    ticket: Uuid,
    lease: AiLease,
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
    Pending(Uuid),
    Active,
    Suspended,
}
struct Entry {
    lease: AiLease,
    state: State,
}

/// Native-only transitions; no renderer-supplied root or generation.
#[derive(Default)]
pub struct AiAdmissions {
    entries: HashMap<String, Entry>,
    closing: HashMap<String, Vec<RetiredAdmission>>,
}
impl AiAdmissions {
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
            return Err(denied("AI admission is unavailable"));
        }
        let mut lease = current(vaults, session, Uuid::new_v4().to_string())?;
        let previous = self.entries.get(window);
        let preserve = previous.is_some_and(|entry| {
            !matches!(entry.state, State::Pending(_)) && entry.lease.same_root(&lease)
        });
        if preserve {
            lease.generation = previous.unwrap().lease.generation.clone();
        }
        let ticket = Uuid::new_v4();
        self.entries.insert(
            window.into(),
            Entry {
                lease: lease.clone(),
                state: State::Pending(ticket),
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
    pub fn complete(&mut self, vaults: &VaultManager, plan: &AdmissionPlan) -> io::Result<AiLease> {
        let matches = self.entries.get(&plan.window).is_some_and(
            |entry| matches!(entry.state, State::Pending(ticket) if ticket == plan.ticket),
        );
        if !matches || self.closing.contains_key(&plan.lease.session) {
            return Err(denied("AI admission transition is stale"));
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
                    .unwrap_or_else(|| denied("AI vault identity changed")))
            }
        }
    }
    pub fn authorize(
        &mut self,
        vaults: &VaultManager,
        window: &str,
    ) -> Result<AiLease, AdmissionFailure> {
        let unavailable = || AdmissionFailure {
            retired: None,
            error: denied("AI is disabled or suspended"),
        };
        let entry = self
            .entries
            .get(window)
            .filter(|entry| matches!(entry.state, State::Active))
            .ok_or_else(unavailable)?;
        let original = entry.lease.clone();
        let verified = current(vaults, &original.session, original.generation.clone());
        match verified {
            Ok(lease)
                if lease.same_root(&original) && !self.closing.contains_key(&original.session) =>
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
                        .unwrap_or_else(|| denied("AI vault identity changed")),
                })
            }
        }
    }
    /// True retains workers for reload while denying renderer operations.
    pub fn leave(&mut self, window: &str, reload: bool) -> bool {
        if reload
            && let Some(entry) = self.entries.get_mut(window)
            && !matches!(entry.state, State::Pending(_))
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
fn current(vaults: &VaultManager, session: &str, generation: String) -> io::Result<AiLease> {
    let root = vaults.get(session)?;
    root.verify_physical_root()?;
    let descriptor = vaults.descriptor(session)?;
    Ok(AiLease {
        generation,
        session: session.into(),
        profile: descriptor.profile_id.clone(),
        root: root.path().into(),
        identity: root.physical_identity()?,
    })
}
fn denied(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::PermissionDenied, message)
}
