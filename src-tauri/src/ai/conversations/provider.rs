use super::{invalid, records::Record};
use crate::ai::backend::BackendCall;
use jj_collab::CollabCommandResultV1;
use jj_store_core::*;
use jj_store_git::{GitProvider, LocalRepository, repository::LocalCollabReceipt};
use jj_store_model::PrincipalId;
use std::{
    io,
    path::Path,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

struct Host {
    call: Arc<BackendCall>,
    actor: PrincipalId,
}
#[async_trait::async_trait]
impl StoreHost for Host {
    async fn authorize(&self, kind: StoreKind, _: Access) -> Result<()> {
        if !matches!(kind, StoreKind::Agent | StoreKind::Thread) {
            return Err(Error::Denied);
        }
        self.call.check().map_err(|_| Error::Denied)
    }
    fn actor(&self, _: bool) -> Result<Option<PrincipalId>> {
        self.call.check().map_err(|_| Error::Denied)?;
        Ok(Some(self.actor))
    }
    fn now_millis(&self) -> Result<i64> {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| Error::Denied)?
            .as_millis()
            .try_into()
            .map_err(|_| Error::Denied)
    }
}
pub(super) fn open(
    call: Arc<BackendCall>,
    root: &Path,
    record: &Record,
) -> io::Result<RepositoryStores> {
    call.check()?;
    let info = jj_store_jj::local_repository::inspect_workspace(root).map_err(|_| invalid())?;
    if Some(&info.metadata) != call.repository_metadata()?.as_ref() {
        return Err(invalid());
    }
    let metadata = info
        .open_metadata()
        .map_err(|_| invalid())?
        .carrier()
        .clone();
    let mut repository = LocalRepository::new(root, metadata);
    if let Some(id) = record
        .repository
        .or_else(|| record.receipt.as_ref().map(|r| r.repository))
        .or(info.repository)
    {
        repository = repository.bound_to(id);
    }
    let provider = GitProvider::new(repository);
    let mut factories = StoreFactories::empty();
    provider
        .add_agent_store(&mut factories, "git")
        .map_err(|_| invalid())?;
    provider
        .add_thread_store(&mut factories, "git")
        .map_err(|_| invalid())?;
    let mut config = StoreConfig::default();
    config.enable(StoreKind::Agent, "git");
    config.enable(StoreKind::Thread, "git");
    let stores = factories
        .loader()
        .open(
            &config,
            StoreContext::new(
                provider.scope(),
                Arc::new(Host {
                    call: call.clone(),
                    actor: record.actor,
                }),
            ),
        )
        .map_err(|_| invalid())?;
    stores
        .require_shared_publication(&[StoreKind::Agent, StoreKind::Thread])
        .map_err(|_| invalid())?;
    call.check()?;
    Ok(stores)
}
pub(super) fn confirm(
    record: &mut Record,
    receipt: StoreReceipt<CollabCommandResultV1>,
) -> io::Result<()> {
    let original: LocalCollabReceipt =
        serde_json::from_slice(&receipt.provider_receipt).map_err(|_| invalid())?;
    record.verify_receipt(&original)?;
    if serde_json::to_vec(&original).map_err(|_| invalid())? != receipt.provider_receipt
        || receipt.request_id != original.request_id
        || receipt.actor != original.actor
        || receipt.repository != original.repository
        || receipt.version != original.domain_state_version
        || receipt.selection != original.domain_object.to_string().as_bytes()
        || receipt.result != original.result
        || record.receipt.as_ref().is_some_and(|old| *old != original)
    {
        return Err(invalid());
    }
    record.receipt = Some(original);
    Ok(())
}
