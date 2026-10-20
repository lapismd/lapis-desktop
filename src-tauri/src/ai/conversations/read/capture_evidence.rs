//! Project Desktop facts from retained native evidence, without parsing ACP text.
use super::super::{
    capture_facts::{FIELD, HostFacts},
    identity::Identity,
    invalid,
};
use jj_agent::{
    IntegrationId, NativeCaptureEnvelopeV1, SanitizedObservationBatchV1, SanitizedRepresentation,
    SourceKind, SourceTrust,
};
use jj_collab::{CollabGraphV1, CollabObjectV1, ThreadEventKindV1};
use jj_store_conversations::{native_privacy::TRANSCRIPT_POLICY, store_capture::ContextV1};
use std::io;
#[cfg(test)]
mod tests;

pub(super) fn facts(
    batch: &SanitizedObservationBatchV1,
    identity: Option<&Identity>,
    graph: Option<&CollabGraphV1>,
) -> io::Result<Option<HostFacts>> {
    let (Some(identity), Some(graph)) = (identity, graph) else {
        return Ok(None);
    };
    if batch.integration != IntegrationId::OwnedController
        || batch.representation != SanitizedRepresentation::SanitizedNative
    {
        return Ok(None);
    }
    let [observation] = batch.observations.as_slice() else {
        return Ok(None);
    };
    let Ok(raw) = serde_json::from_slice::<serde_json::Value>(observation.payload.bytes()) else {
        return Ok(None);
    };
    let Some(value) = raw["frames"]
        .as_array()
        .and_then(|frames| frames.last())
        .and_then(|frame| frame.get(FIELD))
    else {
        return Ok(None);
    };
    // Legacy/non-Desktop evidence remains inert even if a provider used this key.
    if !raw["binding"]["scope"].as_str().is_some_and(|v| {
        v.strip_prefix("notes-canonical-v2:").is_some_and(|suffix| {
            suffix.len() == 64
                && suffix
                    .bytes()
                    .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
        })
    }) {
        return Ok(None);
    }
    let envelope =
        NativeCaptureEnvelopeV1::decode(observation.payload.bytes()).map_err(|_| invalid())?;
    let facts: HostFacts = serde_json::from_value(value.get("host").ok_or_else(invalid)?.clone())
        .map_err(|_| invalid())?;
    facts.validate()?;
    if facts.thread_id != identity.thread_id
        || Some(facts.repository) != identity.repository
        || facts.worker != envelope.binding.worker
        || envelope.policy != TRANSCRIPT_POLICY
        || batch.sanitizer_version != envelope.policy
        || envelope.ordinal != observation.source_sequence
        || observation.source_kind != SourceKind::NativeApi
        || observation.source_trust != SourceTrust::LocallyTrustedPlugin
        || envelope.frames.last().and_then(|f| f["requestId"].as_str())
            != facts.request_id.as_deref()
    {
        return Err(invalid());
    }
    let context = ContextV1 {
        repository: facts.repository,
        thread: facts.thread_id,
        policy: envelope.policy,
        binding: envelope.binding,
    };
    if context.source() != batch.source_instance_id {
        return Err(invalid());
    }
    if let Some(authored) = &facts.authored {
        let CollabObjectV1::HumanMessageRevision(message) =
            graph.get(authored.revision).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        let CollabObjectV1::ThreadVersion(header) =
            graph.get(authored.thread_version).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        let CollabObjectV1::ThreadEvent(event) = graph.get(header.event).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if message.thread_id != facts.thread_id
            || message.message_id != authored.message_id
            || message.actor != authored.actor
            || message.body.is_none()
            || header.thread_id != facts.thread_id
            || event.thread_id != facts.thread_id
            || header.actor != authored.actor
            || event.actor != authored.actor
            || event.event
                != (ThreadEventKindV1::Message {
                    revision: authored.revision,
                })
        {
            return Err(invalid());
        }
    }
    Ok(Some(facts))
}
