//! Transport projection of typed retained objects; sanitized payloads remain exact UTF-8.
use super::invalid;
use jj_agent::{
    AgentContentV1, AgentEventBatchV1, AgentObjectV1, CaptureBatchId, IntegrationId, ObservationId,
    SanitizedMediaType, SanitizedObservationBatchV1, SanitizedPayloadV1, SanitizedRepresentation,
    SourceInstanceId, SourceKind, SourceTrust, ToolInvocationSnapshotV1,
};
use serde::Serialize;
use std::io;

#[derive(Serialize)]
#[serde(tag = "type", content = "value", rename_all = "snake_case")]
pub(super) enum RecordValue {
    EventBatch(AgentEventBatchV1),
    ToolSnapshot(ToolInvocationSnapshotV1),
    ObservationBatch(ObservationBatch),
    Content(Content),
}
#[derive(Serialize)]
pub(super) struct Payload {
    media_type: SanitizedMediaType,
    text: String,
}
impl Payload {
    fn new(value: &SanitizedPayloadV1) -> io::Result<Self> {
        Ok(Self {
            media_type: value.media_type(),
            text: std::str::from_utf8(value.bytes())
                .map_err(|_| invalid())?
                .into(),
        })
    }
}
#[derive(Serialize)]
pub(super) struct Content {
    schema_version: u32,
    payload: Payload,
}
impl Content {
    fn new(value: AgentContentV1) -> io::Result<Self> {
        Ok(Self {
            schema_version: value.schema_version,
            payload: Payload::new(&value.payload)?,
        })
    }
}
#[derive(Serialize)]
pub(super) struct Observation {
    observation_id: ObservationId,
    source_sequence: u64,
    occurred_at_millis: Option<i64>,
    source_kind: SourceKind,
    source_trust: SourceTrust,
    payload: Payload,
}
#[derive(Serialize)]
pub(super) struct ObservationBatch {
    schema_version: u32,
    batch_id: CaptureBatchId,
    integration: IntegrationId,
    source_instance_id: SourceInstanceId,
    sanitizer_version: String,
    representation: SanitizedRepresentation,
    observations: Vec<Observation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    desktop: Option<super::super::capture_facts::HostFacts>,
}
impl ObservationBatch {
    fn new(
        value: SanitizedObservationBatchV1,
        identity: Option<&super::super::identity::Identity>,
        graph: Option<&jj_collab::CollabGraphV1>,
    ) -> io::Result<Self> {
        let desktop = super::capture_evidence::facts(&value, identity, graph)?;
        let observations = value
            .observations
            .into_iter()
            .map(|v| {
                Ok(Observation {
                    observation_id: v.observation_id,
                    source_sequence: v.source_sequence,
                    occurred_at_millis: v.occurred_at_millis,
                    source_kind: v.source_kind,
                    source_trust: v.source_trust,
                    payload: Payload::new(&v.payload)?,
                })
            })
            .collect::<io::Result<Vec<_>>>()?;
        Ok(Self {
            schema_version: value.schema_version,
            batch_id: value.batch_id,
            integration: value.integration,
            source_instance_id: value.source_instance_id,
            sanitizer_version: value.sanitizer_version,
            representation: value.representation,
            observations,
            desktop,
        })
    }
}
impl RecordValue {
    pub(super) fn new(
        value: AgentObjectV1,
        identity: Option<&super::super::identity::Identity>,
        graph: Option<&jj_collab::CollabGraphV1>,
    ) -> io::Result<Self> {
        match value {
            AgentObjectV1::EventBatch(v) => Ok(Self::EventBatch(v)),
            AgentObjectV1::ToolSnapshot(v) => Ok(Self::ToolSnapshot(v)),
            AgentObjectV1::ObservationBatch(v) => Ok(Self::ObservationBatch(
                ObservationBatch::new(v, identity, graph)?,
            )),
            AgentObjectV1::Content(v) => Ok(Self::Content(Content::new(v)?)),
            _ => Err(invalid()),
        }
    }
}
