use super::*;
use jj_collab::{CollabGraphV1, ConversationMetadataTargetV1, ThreadId};
use jj_store_model::{PrincipalId, RepositoryId};
use std::sync::Mutex;

struct Source {
    pin: Mutex<Pinned<ThreadData>>,
    scope: PublicationScope,
    group: Arc<PublicationGroup>,
}
impl StoreBinding for Source {
    fn name(&self) -> &str {
        "git"
    }
    fn scope(&self) -> &PublicationScope {
        &self.scope
    }
    fn publication_group(&self) -> Option<Arc<PublicationGroup>> {
        Some(self.group.clone())
    }
}
#[async_trait::async_trait]
impl ThreadStore for Source {
    async fn snapshot(&self) -> Result<Pinned<ThreadData>> {
        let pin = self.pin.lock().unwrap();
        Ok(Pinned {
            scope: pin.scope.clone(),
            version: pin.version,
            selection: pin.selection.clone(),
            data: pin.data.clone(),
        })
    }
    async fn execute(
        &self,
        _: &StoreRequest<ThreadCommandV1>,
    ) -> Result<StoreOutcome<CollabCommandResultV1>> {
        panic!("capture snapshot wrapper cannot delegate a ThreadStore write")
    }
    async fn status(&self, _: RequestId) -> Result<StoreOutcome<CollabCommandResultV1>> {
        panic!("capture snapshot wrapper cannot delegate a ThreadStore status")
    }
}
fn identity() -> Identity {
    Identity {
        target: ConversationMetadataTargetV1::Conversation {
            id: "external:original".into(),
        },
        thread_id: ThreadId::new([1; 16]),
        repository: Some(RepositoryId::new([2; 16])),
    }
}
fn pin(target: Option<&str>) -> Pinned<ThreadData> {
    let identity = identity();
    let command = match target {
        Some(id) => ThreadCommandV1::CreateConversation {
            thread_id: identity.thread_id,
            title: "Canonical source".into(),
            target: ConversationMetadataTargetV1::Conversation { id: id.into() },
        },
        None => ThreadCommandV1::CreateAnnotation {
            thread_id: identity.thread_id,
            title: "Annotation source".into(),
        },
    };
    let mut graph = CollabGraphV1::default();
    let (root, _) = ThreadStateV1::empty()
        .apply(
            &command,
            PrincipalId::new([3; 16]),
            RequestId::new([4; 16]),
            1,
            &mut graph,
        )
        .unwrap();
    Pinned {
        scope: PublicationScope {
            repository: identity.repository,
            authority: "native-test-source".into(),
        },
        version: 1,
        selection: vec![1, 255],
        data: ThreadData {
            root,
            graph: Arc::new(graph),
        },
    }
}

#[test]
fn exact_snapshot_membership_cannot_be_replaced_by_a_previous_same_thread_check() {
    tauri::async_runtime::block_on(async {
        let initial = pin(Some("external:original"));
        let source = Arc::new(Source {
            scope: initial.scope.clone(),
            pin: Mutex::new(initial),
            group: PublicationGroup::new(),
        });
        let guarded = ConversationThread {
            inner: source.clone(),
            identity: identity(),
        };
        let first = guarded.snapshot().await.unwrap();
        assert_eq!(first.selection, vec![1, 255]);
        assert!(Arc::ptr_eq(
            &guarded.publication_group().unwrap(),
            &source.group
        ));
        // A prior admission check succeeded, but the sink now sees another target
        // or annotation under the same thread. Validate the returned graph itself.
        for replacement in [pin(Some("external:substituted")), pin(None)] {
            *source.pin.lock().unwrap() = replacement;
            assert!(guarded.snapshot().await.is_err());
        }
        for repository in [None, Some(RepositoryId::new([9; 16]))] {
            let mut replacement = pin(Some("external:original"));
            replacement.scope.repository = repository;
            *source.pin.lock().unwrap() = replacement;
            assert!(guarded.snapshot().await.is_err());
        }
        *source.pin.lock().unwrap() = pin(Some("external:original"));
        assert!(guarded.snapshot().await.is_ok());
        assert!(guarded.status(RequestId::new([5; 16])).await.is_err());
        assert!(
            guarded
                .execute(&StoreRequest::new(
                    RequestId::new([5; 16]),
                    ThreadCommandV1::CreateAnnotation {
                        thread_id: ThreadId::new([5; 16]),
                        title: "No delegated write".into(),
                    }
                ))
                .await
                .is_err()
        );
    });
}
