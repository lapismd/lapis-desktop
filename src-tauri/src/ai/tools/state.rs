use super::{Outcome, unavailable};
use sha2::{Digest, Sha256};
use std::{collections::HashMap, io};
use tokio::sync::oneshot;
use uuid::Uuid;

pub(super) struct Pending {
    pub reply: oneshot::Sender<Outcome>,
    pub cancelled: bool,
}
#[derive(Default)]
pub(super) struct State {
    pub fenced: bool,
    pub turn: Option<Uuid>,
    pub calls: HashMap<Uuid, Pending>,
    pub total: usize,
    receipts: HashMap<Uuid, [u8; 32]>,
}
impl State {
    /// Reconcile the exact execution acknowledgement, never execute a callback.
    pub fn acknowledge(&mut self, id: Uuid, outcome: &Outcome) -> io::Result<Option<Pending>> {
        let bytes = serde_json::to_vec(outcome).map_err(|_| unavailable())?;
        if bytes.len() >= super::framing::FRAME_BYTES {
            return Err(unavailable());
        }
        let digest: [u8; 32] = Sha256::digest(bytes).into();
        if let Some(original) = self.receipts.get(&id) {
            return if *original == digest {
                Ok(None)
            } else {
                Err(unavailable())
            };
        }
        let pending = self.calls.remove(&id).ok_or_else(unavailable)?;
        self.receipts.insert(id, digest);
        Ok(Some(pending))
    }
}
