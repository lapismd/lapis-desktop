use super::{invalid, records::Record};
use crate::ai::backend::BackendCall;
use jj_collab::CollabCommandResultV1;
use jj_store_core::*;
use jj_store_git::{GitProvider, LocalRepository, repository::LocalCollabReceipt};
use jj_store_model::{PrincipalId, RepositoryId};
use std::{
    io,
    path::Path,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

struct Host {
    call: Arc<BackendCall>,
    actor: Option<PrincipalId>,
    read_only: bool,
}
#[async_trait::async_trait]
impl StoreHost for Host {
    async fn authorize(&self, kind: StoreKind, access: Access) -> Result<()> {
        if !matches!(kind, StoreKind::Agent | StoreKind::Thread)
            || self.read_only && !matches!(access, Access::Read)
        {
            return Err(Error::Denied);
        }
        self.call.check().map_err(|_| Error::Denied)
    }
    fn actor(&self, writing: bool) -> Result<Option<PrincipalId>> {
        if self.read_only && writing {
            return Err(Error::Denied);
        }
        self.call.check().map_err(|_| Error::Denied)?;
        Ok(self.actor)
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
    open_with_policy(
        call,
        root,
        Some(record.actor),
        record
            .repository
            .or_else(|| record.receipt.as_ref().map(|r| r.repository)),
        false,
        None,
    )
}
/// Committed source reads require neither a private creation intent nor actor.
pub(super) fn read_current(call: Arc<BackendCall>) -> io::Result<RepositoryStores> {
    let (_, root, _) = call.conversation_location()?;
    open_with_policy(call, &root, None, None, true, None)
}
pub(super) fn write_current(
    call: Arc<BackendCall>,
    actor: PrincipalId,
    repository: RepositoryId,
) -> io::Result<RepositoryStores> {
    let (_, root, _) = call.conversation_location()?;
    open_with_policy(call, &root, Some(actor), Some(repository), false, None)
}
pub(super) fn capture_current(
    call: Arc<BackendCall>,
    actor: PrincipalId,
    identity: super::identity::Identity,
) -> io::Result<RepositoryStores> {
    let (_, root, _) = call.conversation_location()?;
    let repository = identity.repository.ok_or_else(invalid)?;
    open_with_policy(
        call,
        &root,
        Some(actor),
        Some(repository),
        false,
        Some(identity),
    )
}
fn open_with_policy(
    call: Arc<BackendCall>,
    root: &Path,
    actor: Option<PrincipalId>,
    expected_repository: Option<RepositoryId>,
    read_only: bool,
    capture_identity: Option<super::identity::Identity>,
) -> io::Result<RepositoryStores> {
    call.check()?;
    let metadata = metadata(&call)?;
    let observed_repository = metadata
        .identity()
        .map_err(|_| invalid())?
        .map(|id| id.repository);
    let mut repository = LocalRepository::new(root, metadata);
    if let Some(id) = expected_repository.or(observed_repository) {
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
    let context = StoreContext::new(
        provider.scope(),
        Arc::new(Host {
            call: call.clone(),
            actor,
            read_only,
        }),
    );
    let mut stores = factories
        .loader()
        .open(&config, context.clone())
        .map_err(|_| invalid())?;
    if let Some(identity) = capture_identity {
        stores = super::capture_stores::guard(stores, context, identity).map_err(|_| invalid())?;
    }
    stores
        .require_shared_publication(&[StoreKind::Agent, StoreKind::Thread])
        .map_err(|_| invalid())?;
    call.check()?;
    Ok(stores)
}
fn metadata(call: &BackendCall) -> io::Result<jj_store_git::metadata::MetadataStore> {
    let path = call.repository_metadata()?.ok_or_else(invalid)?;
    let metadata = jj_store_jj::local_repository::default_metadata_store(&path)
        .map_err(|_| invalid())?
        .carrier()
        .clone();
    call.check()?;
    Ok(metadata)
}
pub(super) fn repository(call: &BackendCall) -> io::Result<Option<RepositoryId>> {
    let identity = metadata(call)?.identity().map_err(|_| invalid())?;
    call.check()?;
    Ok(identity.map(|id| id.repository))
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
