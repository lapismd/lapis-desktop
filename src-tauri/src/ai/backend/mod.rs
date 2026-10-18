//! Device-owned backend selection; native authority and publication stay injected.
mod model;
mod owner;
#[cfg(test)]
mod tests;
use crate::{
    repository::source::Source,
    vault::{admission::VaultLease, private_profile as storage},
};
use cap_std::fs::Dir;
use jj_store_model::RequestId;
pub use model::{Backend, Selection, SelectionReceipt};
use model::{MAX_CHOICES, State};
pub use owner::{BackendCall, BackendScope};
use sha2::{Digest, Sha256};
use std::{fs::File, io, os::unix::fs::MetadataExt, sync::Arc};

pub type Admission = Arc<dyn Fn() -> io::Result<VaultLease> + Send + Sync>;
pub struct BackendProfiles {
    context: Arc<Context>,
}
pub(super) struct Context {
    profile: Dir,
    lease: VaultLease,
    physical: [u64; 2],
    key: String,
    admit: Admission,
}
pub(super) struct Lease {
    pub dir: Dir,
    pub file: File,
}
pub(super) fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidData,
        "Backend selection is invalid or conflicts with its original request",
    )
}
fn unknown() -> io::Error {
    io::Error::other("Backend choice outcome unknown; read the original request status")
}
impl BackendProfiles {
    pub fn new(profile: Dir, admit: Admission) -> io::Result<Self> {
        let lease = admit()?;
        if uuid::Uuid::parse_str(lease.profile())
            .ok()
            .is_none_or(|id| id.to_string() != lease.profile())
        {
            return Err(invalid());
        }
        let m = std::fs::symlink_metadata(lease.root())?;
        if !m.is_dir() || m.file_type().is_symlink() {
            return Err(storage::denied());
        }
        let physical = [m.dev(), m.ino()];
        let digest = Sha256::new_with_prefix(b"lapis-desktop/backend-profile/v1\0")
            .chain_update(lease.profile().as_bytes())
            .chain_update(physical[0].to_be_bytes())
            .chain_update(physical[1].to_be_bytes())
            .finalize();
        let key = digest.iter().map(|b| format!("{b:02x}")).collect();
        let context = Arc::new(Context {
            profile,
            lease,
            physical,
            key,
            admit,
        });
        context.check()?;
        Ok(Self { context })
    }
    pub fn read(&self) -> io::Result<Selection> {
        self.context.check()?;
        let state = self.context.read()?;
        self.context.check()?;
        Ok(state.selection)
    }
    pub fn status(&self, request: RequestId) -> io::Result<Option<SelectionReceipt>> {
        self.context.check()?;
        let state = self.context.committed()?;
        self.context.check()?;
        Ok(state.receipts.into_iter().find(|r| r.request_id == request))
    }
    pub fn select(
        &self,
        request: RequestId,
        expected: u32,
        backend: Backend,
    ) -> io::Result<SelectionReceipt> {
        self.context.check()?;
        let lease = self.context.lock()?;
        let committed = self.context.committed()?;
        if let Some(prior) = committed.receipts.iter().find(|r| r.request_id == request) {
            if prior.expected_revision != expected || prior.selection.backend != backend {
                return Err(invalid());
            }
            self.context.check()?;
            return Ok(prior.clone());
        }
        let mut state = self.context.read()?;
        if state.selection.revision != expected || state.receipts.len() >= MAX_CHOICES {
            return Err(invalid());
        }
        let source = if backend == Backend::Jj {
            Some(Source::capture(self.context.lease.root())?)
        } else {
            None
        };
        let receipt = SelectionReceipt {
            request_id: request,
            expected_revision: expected,
            selection: Selection {
                backend,
                revision: expected.checked_add(1).ok_or_else(invalid)?,
            },
        };
        state.selection = receipt.selection.clone();
        state.source = source.as_ref().map(Source::fingerprint);
        state.receipts.push(receipt.clone());
        state.validate(self.context.lease.profile(), self.context.physical)?;
        let bytes = serde_json::to_vec(&state).map_err(|_| invalid())?;
        if bytes.len() > 128 * 1024 {
            return Err(invalid());
        }
        self.context.check()?;
        lease.verify()?;
        storage::write(&lease.dir, "prepared.json", &bytes, false).map_err(|_| unknown())?;
        storage::write(&lease.dir, "selection.json", &bytes, false).map_err(|_| unknown())?;
        self.context.check().map_err(|_| unknown())?;
        lease.verify().map_err(|_| unknown())?;
        if let Some(source) = source {
            source.verify().map_err(|_| unknown())?;
        }
        Ok(receipt)
    }
    pub fn open_scope(&self) -> io::Result<Arc<BackendScope>> {
        self.context.check()?;
        let lease = self.context.lock()?;
        let state = self.context.read()?;
        let source = if state.selection.backend == Backend::Jj {
            let source = Source::capture(self.context.lease.root())?;
            if Some(source.fingerprint()) != state.source {
                return Err(storage::denied());
            }
            Some(source)
        } else {
            None
        };
        self.context.check()?;
        Ok(Arc::new(BackendScope::new(
            self.context.clone(),
            lease,
            state.selection,
            source,
        )))
    }
}
impl Context {
    pub fn check(&self) -> io::Result<()> {
        let current = (self.admit)()?;
        let m = std::fs::symlink_metadata(current.root())?;
        if current.generation() != self.lease.generation()
            || current.profile() != self.lease.profile()
            || current.root() != self.lease.root()
            || !m.is_dir()
            || m.file_type().is_symlink()
            || [m.dev(), m.ino()] != self.physical
        {
            return Err(storage::denied());
        }
        Ok(())
    }
    fn dir(&self, create: bool) -> io::Result<Option<Dir>> {
        if create {
            let root = storage::directory(&self.profile, "ai-backends-v1")?;
            return storage::directory(&root, &self.key).map(Some);
        }
        let Some(root) = storage::existing_directory(&self.profile, "ai-backends-v1")? else {
            return Ok(None);
        };
        storage::existing_directory(&root, &self.key)
    }
    fn committed(&self) -> io::Result<State> {
        let bytes = self
            .dir(false)?
            .map(|dir| storage::read(&dir, "selection.json", 128 * 1024))
            .transpose()?
            .flatten();
        let state = match bytes {
            None => State::empty(self.lease.profile().into(), self.physical),
            Some(bytes) => serde_json::from_slice(&bytes).map_err(|_| invalid())?,
        };
        state.validate(self.lease.profile(), self.physical)?;
        Ok(state)
    }
    fn read(&self) -> io::Result<State> {
        let state = self.committed()?;
        let prepared = self
            .dir(false)?
            .map(|d| storage::read(&d, "prepared.json", 128 * 1024))
            .transpose()?
            .flatten();
        match prepared {
            None if state.selection.revision == 0 => {}
            Some(bytes) => {
                let prepared: State = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
                prepared.validate(self.lease.profile(), self.physical)?;
                if prepared != state {
                    return Err(unknown());
                }
            }
            _ => return Err(unknown()),
        }
        Ok(state)
    }
    fn lock(&self) -> io::Result<Lease> {
        let dir = self.dir(true)?.ok_or_else(storage::denied)?;
        let file = storage::file(&dir, "lease", true)?;
        rustix::fs::flock(&file, rustix::fs::FlockOperation::NonBlockingLockExclusive)?;
        let lease = Lease { dir, file };
        lease.file.sync_all()?;
        lease.verify()?;
        Ok(lease)
    }
}
impl Lease {
    pub fn verify(&self) -> io::Result<()> {
        use cap_std::fs::MetadataExt as _;
        let held = self.file.metadata()?;
        let selected = self.dir.symlink_metadata("lease")?;
        if !selected.is_file()
            || selected.nlink() != 1
            || (held.dev(), held.ino()) != (selected.dev(), selected.ino())
        {
            return Err(storage::denied());
        }
        Ok(())
    }
}
impl Drop for Lease {
    fn drop(&mut self) {
        // Native owners/calls retain this lease. An incidental inherited
        // descriptor must not extend it after the final logical owner drops.
        let _ = rustix::fs::flock(&self.file, rustix::fs::FlockOperation::Unlock);
    }
}
