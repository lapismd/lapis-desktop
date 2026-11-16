//! One coalescing passive waiter per scope; dropping a link wakes its waiter.
use super::{AccountObservation, AccountServices, denied};
use crate::vault::VaultManager;
use std::{future::pending, io};
use tokio::sync::{OwnedSemaphorePermit, watch};
use uuid::Uuid;

pub struct ObservationWait {
    lifetime: watch::Receiver<()>,
    account: Option<watch::Receiver<AccountObservation>>,
    _permit: OwnedSemaphorePermit,
}

impl ObservationWait {
    /// The host supplies the deadline and revalidates scope after every wait.
    pub async fn changed(&mut self) -> io::Result<()> {
        tokio::select! {
            _ = self.lifetime.changed() => Err(denied()),
            result = async {
                match &mut self.account {
                    Some(account) => account.changed().await.map_err(|_| denied()),
                    None => pending().await,
                }
            } => result,
        }
    }
}

impl AccountServices {
    pub fn observe(
        &mut self,
        vaults: &VaultManager,
        window: &str,
        handle: Uuid,
    ) -> io::Result<ObservationWait> {
        self.validate(vaults, window, handle)?;
        let link = self.links.get(window).ok_or_else(denied)?;
        let permit = link.observer.clone().try_acquire_owned().map_err(|_| {
            io::Error::new(
                io::ErrorKind::WouldBlock,
                "Native Sync observation is already waiting",
            )
        })?;
        let account = self.accounts.get(&link.vault).map(|account| {
            let mut receiver = account.owner.subscribe();
            receiver.borrow_and_update();
            receiver
        });
        Ok(ObservationWait {
            lifetime: link.lifetime.subscribe(),
            account,
            _permit: permit,
        })
    }
}
