//! App-specific conversation membership on the exact pin consumed by StoreCapture.
use super::identity::Identity;
use jj_collab::{
    CollabCommandResultV1, CollabObjectV1, ThreadCommandV1, ThreadPurposeV1, ThreadStateV1,
};
use jj_store_core::*;
use jj_store_model::RequestId;
use std::sync::Arc;
#[cfg(test)]
mod tests;

struct ConversationThread {
    inner: Arc<dyn ThreadStore>,
    identity: Identity,
}
impl StoreBinding for ConversationThread {
    fn name(&self) -> &str {
        self.inner.name()
    }
    fn scope(&self) -> &PublicationScope {
        self.inner.scope()
    }
    fn publication_group(&self) -> Option<Arc<PublicationGroup>> {
        self.inner.publication_group()
    }
}
#[async_trait::async_trait]
impl ThreadStore for ConversationThread {
    async fn snapshot(&self) -> Result<Pinned<ThreadData>> {
        let pin = self.inner.snapshot().await?;
        let state = ThreadStateV1::read(pin.data.root.clone(), &pin.data.graph)
            .map_err(|_| Error::Denied)?;
        let reference = *state
            .threads
            .get(&self.identity.thread_id)
            .ok_or(Error::Denied)?;
        let CollabObjectV1::ThreadVersion(header) =
            pin.data.graph.get(reference).map_err(|_| Error::Denied)?
        else {
            return Err(Error::Denied);
        };
        if pin.scope.repository != self.identity.repository
            || header.thread_id != self.identity.thread_id
            || header.status == jj_collab::ThreadStatusV1::Tombstoned
            || header.purpose
                != Some(ThreadPurposeV1::Conversation {
                    target: self.identity.target.clone(),
                })
        {
            return Err(Error::Denied);
        }
        // Keep the provider's exact pin and header. Its atomic publication checks
        // this same observed header, including under concurrent source changes.
        // Archiving cannot discard a reply from an already running provider.
        Ok(pin)
    }
    async fn execute(
        &self,
        _: &StoreRequest<ThreadCommandV1>,
    ) -> Result<StoreOutcome<CollabCommandResultV1>> {
        Err(Error::Denied)
    }
    async fn status(&self, _: RequestId) -> Result<StoreOutcome<CollabCommandResultV1>> {
        Err(Error::Denied)
    }
}
pub(super) fn guard(
    stores: RepositoryStores,
    context: StoreContext,
    identity: Identity,
) -> Result<RepositoryStores> {
    let agent = stores.agent().ok_or(Error::Denied)?.clone();
    let thread = Arc::new(ConversationThread {
        inner: stores.thread().ok_or(Error::Denied)?.clone(),
        identity,
    });
    let mut factories = StoreFactories::empty();
    factories.add_agent_store("git", move |_| Ok(agent.clone()))?;
    factories.add_thread_store("git", move |_| Ok(thread.clone()))?;
    let mut config = StoreConfig::default();
    config.enable(StoreKind::Agent, "git");
    config.enable(StoreKind::Thread, "git");
    let guarded = factories.loader().open(&config, context)?;
    guarded.require_shared_publication(&[StoreKind::Agent, StoreKind::Thread])?;
    Ok(guarded)
}
