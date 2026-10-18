//! Profile-owned durable capture records; provider receipts remain authoritative.
mod scope;
use crate::vault::private_profile as storage;
use cap_std::fs::{Dir, MetadataExt as _};
use jj_store_conversations::{capture::CaptureError, store_capture::*};
use jj_store_core::PublicationScope;
use jj_store_model::RequestId;
use scope::Scope;
use std::{
    fs::File,
    io,
    sync::{Arc, Mutex},
};

/// Native host admission, invoked at construction and around every transition.
pub type Admission = Arc<dyn Fn() -> Result<(), CaptureError> + Send + Sync>;

/// One exclusive source/backend lease, retained through each bounded synchronous
/// atomic transition. Async methods never detach IO or suspend while writing.
pub struct ProfileJournal {
    scope: Scope,
    dir: Dir,
    lease: File,
    gate: Mutex<()>,
    admit: Admission,
}
impl ProfileJournal {
    pub fn open(
        profile: &Dir,
        context: ContextV1,
        provider: &PublicationScope,
        admit: Admission,
    ) -> io::Result<Self> {
        admit().map_err(|_| storage::denied())?;
        let scope = Scope::new(context, provider)?;
        let root = storage::directory(profile, "ai-capture-v1")?;
        let dir = storage::directory(&root, &scope.key())?;
        let lease = storage::file(&dir, "lease", true)?;
        rustix::fs::flock(&lease, rustix::fs::FlockOperation::NonBlockingLockExclusive)?;
        lease.sync_all()?;
        let journal = Self {
            scope,
            dir,
            lease,
            gate: Mutex::new(()),
            admit,
        };
        journal.verify().map_err(|_| storage::denied())?;
        journal.scope.initialize(&journal.dir)?;
        (journal.admit)().map_err(|_| storage::denied())?;
        Ok(journal)
    }
    pub fn context(&self) -> &ContextV1 {
        &self.scope.context
    }
    fn verify(&self) -> Result<(), CaptureError> {
        (self.admit)()?;
        use std::os::unix::fs::MetadataExt as _;
        let held = self.lease.metadata().map_err(|_| CaptureError::Unknown)?;
        let selected = self
            .dir
            .symlink_metadata("lease")
            .map_err(|_| CaptureError::Unknown)?;
        if !selected.is_file()
            || selected.nlink() != 1
            || (held.dev(), held.ino()) != (selected.dev(), selected.ino())
        {
            return Err(CaptureError::Unknown);
        }
        Ok(())
    }
    fn retained(&self, request: RequestId) -> Result<Option<EntryV1>, CaptureError> {
        let bytes = storage::read(&self.dir, &filename(request), MAX_JOURNAL_BYTES)
            .map_err(|_| CaptureError::Unknown)?;
        bytes
            .map(|bytes| {
                let entry = EntryV1::decode(&bytes)?;
                if entry.candidate.context != self.scope.context
                    || entry.candidate.request() != request
                {
                    return Err(CaptureError::ReceiptMismatch);
                }
                Ok(entry)
            })
            .transpose()
    }
    fn candidate(&self, c: &CandidateV1) -> Result<EntryV1, CaptureError> {
        c.validate()?;
        if c.context != self.scope.context {
            return Err(CaptureError::ReceiptMismatch);
        }
        let entry = self.retained(c.request())?.ok_or(CaptureError::Unknown)?;
        if entry.candidate != *c {
            return Err(CaptureError::ReceiptMismatch);
        }
        Ok(entry)
    }
    fn transition<T>(
        &self,
        action: impl FnOnce() -> Result<T, CaptureError>,
    ) -> Result<T, CaptureError> {
        let _guard = self.gate.lock().map_err(|_| CaptureError::Unknown)?;
        self.verify()?;
        self.scope
            .verify(&self.dir)
            .map_err(|_| CaptureError::Unknown)?;
        let result = action()?;
        self.verify().map_err(|_| CaptureError::Unknown)?;
        self.scope
            .verify(&self.dir)
            .map_err(|_| CaptureError::Unknown)?;
        Ok(result)
    }
    fn store(&self, entry: &EntryV1, exclusive: bool) -> Result<(), CaptureError> {
        let bytes = entry.encode()?;
        storage::write(
            &self.dir,
            &filename(entry.candidate.request()),
            &bytes,
            exclusive,
        )
        .map_err(|_| CaptureError::Unknown)
    }
}
fn filename(request: RequestId) -> String {
    format!("{request}.json")
}
#[async_trait::async_trait]
impl Journal for ProfileJournal {
    async fn load(&self, request: RequestId) -> Result<Option<EntryV1>, CaptureError> {
        self.transition(|| self.retained(request))
    }
    async fn begin(&self, c: &CandidateV1) -> Result<Claim, CaptureError> {
        self.transition(|| {
            c.validate()?;
            if c.context != self.scope.context {
                return Err(CaptureError::ReceiptMismatch);
            }
            if let Some(entry) = self.retained(c.request())? {
                if entry.candidate != *c {
                    return Err(CaptureError::ReceiptMismatch);
                }
                return Ok(Claim::Existing(Box::new(entry)));
            }
            self.store(&EntryV1::new(c.clone())?, true)?;
            Ok(Claim::New)
        })
    }
    async fn prepared(&self, c: &CandidateV1, p: &PreparedV1) -> Result<(), CaptureError> {
        self.transition(|| {
            let mut entry = self.candidate(c)?;
            if let Some(prior) = &entry.prepared {
                return if prior == p {
                    Ok(())
                } else {
                    Err(CaptureError::ReceiptMismatch)
                };
            }
            p.validate(c)?;
            entry.prepared = Some(p.clone());
            self.store(&entry, false)
        })
    }
    async fn confirm(&self, c: &CandidateV1, p: &ConfirmationV1) -> Result<(), CaptureError> {
        self.transition(|| {
            let mut entry = self.candidate(c)?;
            p.validate(
                c,
                entry
                    .prepared
                    .as_ref()
                    .ok_or(CaptureError::ReceiptMismatch)?,
            )?;
            if let Some(prior) = &entry.confirmation {
                return if prior == p {
                    Ok(())
                } else {
                    Err(CaptureError::ReceiptMismatch)
                };
            }
            entry.confirmation = Some(p.clone());
            self.store(&entry, false)
        })
    }
}
