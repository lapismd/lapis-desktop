use super::*;
use crate::ai::conversations::capture_facts::AuthoredTurn;
use jj_agent::{
    CaptureBatchId, NativeCaptureBindingV1, NativeCapturePublicationV1, ObservationId,
    SanitizedMediaType, SanitizedObservationV1, SanitizedPayloadV1,
};
use jj_collab::{
    ConversationMetadataTargetV1, HumanMessageId, ThreadCommandV1, ThreadId, ThreadStateV1,
};
use jj_store_model::{PrincipalId, RepositoryId, RequestId};
use serde_json::{Value, json};

fn sample() -> (SanitizedObservationBatchV1, Identity, CollabGraphV1) {
    let identity = Identity {
        target: ConversationMetadataTargetV1::Conversation {
            id: "opaque:native-host-facts".into(),
        },
        thread_id: ThreadId::new([1; 16]),
        repository: Some(RepositoryId::new([2; 16])),
    };
    let actor = PrincipalId::new([3; 16]);
    let mut graph = CollabGraphV1::default();
    let (root, created) = ThreadStateV1::empty()
        .apply(
            &ThreadCommandV1::CreateConversation {
                thread_id: identity.thread_id,
                title: "Native facts".into(),
                target: identity.target.clone(),
            },
            actor,
            RequestId::new([4; 16]),
            1,
            &mut graph,
        )
        .unwrap();
    let (_, message) = ThreadStateV1::read(root, &graph)
        .unwrap()
        .apply(
            &ThreadCommandV1::Message {
                emojis: Vec::new(),
                thread_id: identity.thread_id,
                expected_thread: created.version,
                message_id: HumanMessageId::new([5; 16]),
                expected_revision: None,
                reply_to: None,
                body: Some("Native human authorship".into()),
            },
            actor,
            RequestId::new([6; 16]),
            2,
            &mut graph,
        )
        .unwrap();
    let binding = NativeCaptureBindingV1 {
        scope: format!("notes-canonical-v2:{}", "a".repeat(64)),
        worker: "worker".into(),
        request: "native-open".into(),
        target: "native-target".into(),
        window: "main".into(),
        admission: "admitted".into(),
    };
    let facts = HostFacts {
        schema: 1,
        repository: identity.repository.unwrap(),
        thread_id: identity.thread_id,
        worker: binding.worker.clone(),
        request_id: Some(uuid::Uuid::from_bytes([6; 16]).to_string()),
        client_id: "codex".into(),
        participant: None,
        authored: Some(AuthoredTurn {
            request_id: RequestId::new([6; 16]),
            message_id: HumanMessageId::new([5; 16]),
            revision: message.message.unwrap(),
            thread_version: message.version,
            actor,
        }),
    };
    let context = ContextV1 {
        repository: facts.repository,
        thread: facts.thread_id,
        policy: TRANSCRIPT_POLICY.into(),
        binding: binding.clone(),
    };
    let envelope = NativeCaptureEnvelopeV1 {
        schema: 1,
        policy: TRANSCRIPT_POLICY.into(),
        binding,
        ordinal: 2,
        publication: NativeCapturePublicationV1::Event { sequence: 1 },
        frames: vec![
            json!({"version":3,"type":"record","sessionId":"worker","requestId":facts.request_id.clone(),
            "record":{"status":"completed"}, "lapisDesktop":{"host":facts}}),
        ],
    };
    let batch = SanitizedObservationBatchV1 {
        schema_version: 1,
        batch_id: CaptureBatchId::new([7; 16]),
        integration: IntegrationId::OwnedController,
        source_instance_id: context.source(),
        sanitizer_version: TRANSCRIPT_POLICY.into(),
        representation: SanitizedRepresentation::SanitizedNative,
        observations: vec![SanitizedObservationV1 {
            observation_id: ObservationId::new([8; 16]),
            source_sequence: 2,
            occurred_at_millis: None,
            source_kind: SourceKind::NativeApi,
            source_trust: SourceTrust::LocallyTrustedPlugin,
            payload: SanitizedPayloadV1::new(
                SanitizedMediaType::Json,
                &serde_json::to_vec(&envelope).unwrap(),
            )
            .unwrap(),
        }],
    };
    (batch, identity, graph)
}
fn change(
    batch: &SanitizedObservationBatchV1,
    mutate: impl FnOnce(&mut Value),
) -> SanitizedObservationBatchV1 {
    let mut batch = batch.clone();
    let mut value: Value = serde_json::from_slice(batch.observations[0].payload.bytes()).unwrap();
    mutate(&mut value);
    batch.observations[0].payload = SanitizedPayloadV1::new(
        SanitizedMediaType::Json,
        &serde_json::to_vec(&value).unwrap(),
    )
    .unwrap();
    batch
}
#[test]
fn source_projection_requires_the_exact_retained_human_revision_and_creation_event() {
    let (batch, identity, graph) = sample();
    let original = facts(&batch, Some(&identity), Some(&graph))
        .unwrap()
        .unwrap();
    assert_eq!(
        original.authored.unwrap().request_id,
        RequestId::new([6; 16])
    );
    for field in ["actor", "messageId", "revision", "threadVersion"] {
        let modified = change(&batch, |value| {
            let target = &mut value["frames"][0][FIELD]["host"]["authored"][field];
            if field == "revision" || field == "threadVersion" {
                target["id"] = json!("f".repeat(64));
            } else {
                *target = json!("f".repeat(32));
            }
        });
        assert!(
            facts(&modified, Some(&identity), Some(&graph)).is_err(),
            "{field}"
        );
    }
    let modified = change(&batch, |value| {
        value["frames"][0]["requestId"] = json!(uuid::Uuid::from_bytes([9; 16]).to_string())
    });
    assert!(facts(&modified, Some(&identity), Some(&graph)).is_err());
}
#[test]
fn legacy_or_foreign_evidence_cannot_claim_native_desktop_attribution() {
    let (batch, identity, graph) = sample();
    let legacy = change(&batch, |value| {
        value["binding"]["scope"] = json!(format!("notes-canonical:{}", "a".repeat(64)))
    });
    assert!(
        facts(&legacy, Some(&identity), Some(&graph))
            .unwrap()
            .is_none()
    );
    assert!(facts(&batch, None, Some(&graph)).unwrap().is_none());
    let mut foreign = identity.clone();
    foreign.thread_id = ThreadId::new([9; 16]);
    assert!(facts(&batch, Some(&foreign), Some(&graph)).is_err());
    let mut untrusted = batch.clone();
    untrusted.observations[0].source_trust = SourceTrust::UntrustedAssertion;
    assert!(facts(&untrusted, Some(&identity), Some(&graph)).is_err());
    let provider = change(&batch, |value| {
        let extension = &mut value["frames"][0][FIELD];
        let original = extension["host"].take();
        extension["provider"] = original;
        extension.as_object_mut().unwrap().remove("host");
    });
    assert!(facts(&provider, Some(&identity), Some(&graph)).is_err());
}
