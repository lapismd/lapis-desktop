//! Shared native remote request context; transfer never holds the vault lock.
use super::{
    RepositoryHost,
    remote::{bound, failure, runtime, worker},
};
use crate::host::state::{NativeError, NativeHost};
use jj_vault::{Binding, RemoteTransfer};
use lapis_desktop::repository::{
    forges::ForgeAccounts,
    remote::{self, RemoteState},
};

pub(super) struct Context<'a> {
    pub host: NativeHost,
    pub repository: &'a RepositoryHost,
    pub accounts: &'a ForgeAccounts,
    pub session: String,
    pub window: String,
    pub binding: Binding,
}
impl Context<'_> {
    pub async fn current(&self) -> Result<RemoteState, NativeError> {
        bound(
            self.host.clone(),
            self.session.clone(),
            self.binding.clone(),
            remote::read,
        )
        .await
    }
    pub async fn transfer(&self, revision: u64) -> Result<(RemoteTransfer, bool), NativeError> {
        let state = self.current().await?;
        if state.revision != revision {
            return Err(failure("Connection changed; refresh before continuing"));
        }
        let config = state
            .configuration
            .ok_or_else(|| failure("Connect a remote repository first"))?;
        let resolved = self
            .accounts
            .remote(
                config.account,
                config.project,
                Some(config.target.branch.clone()),
            )
            .await
            .map_err(NativeError::from)?;
        if resolved.target != config.target {
            return Err(failure(
                "Forge repository changed; reconnect before continuing",
            ));
        }
        let binding = self.binding.clone();
        worker(self.repository, move || {
            runtime()?.block_on(async {
                let transfer =
                    RemoteTransfer::connect(binding, resolved.target, resolved.credentials)
                        .await
                        .map_err(|e| std::io::Error::other(e.to_string()))?;
                Ok((transfer, resolved.can_push))
            })
        })
        .await
    }
    pub async fn fetch(&self, revision: u64) -> Result<RemoteState, NativeError> {
        let (transfer, can_push) = self.transfer(revision).await?;
        let fetched = worker(self.repository, move || {
            runtime()?.block_on(async {
                transfer
                    .fetch()
                    .await
                    .map_err(|e| std::io::Error::other(e.to_string()))
            })
        })
        .await?;
        if self.current().await?.revision != revision {
            return Err(failure("Connection changed while fetching"));
        }
        let checkpoint = if let Some(fetched) = fetched {
            let owner = self
                .repository
                .backups
                .owner(&self.session, &self.window)
                .await?;
            Some(owner.backup.import_remote(fetched).await.map_err(failure)?)
        } else {
            None
        };
        let _mutation = self.repository.remote_mutations.lock().await;
        bound(
            self.host.clone(),
            self.session.clone(),
            self.binding.clone(),
            move |binding| remote::observed(binding, revision, checkpoint, can_push),
        )
        .await
    }
}
