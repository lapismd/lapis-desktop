import type {
  NativeAgentEvent,
  NativeEventBatch,
  NativeObservationBatch,
  NativeRecord,
  NativeToolSnapshot,
} from "../../../ai/conversations/native-records.ts";
import * as wire from "./wire.ts";
import { captureFacts } from "./capture-facts.ts";
import {
  choice,
  fields,
  integer,
  integrations,
  label,
  list,
  nullable,
  payload,
  reference,
  schema,
  sessionStates,
  toolStates,
  unique,
} from "./record-fields.ts";

function event(value: unknown): NativeAgentEvent {
  const v = wire.record(value);
  const common = ["type", "event_id", "session_id"];
  const owner = {
    event_id: wire.id(v.event_id),
    session_id: wire.id(v.session_id),
  };
  switch (v.type) {
    case "session_state_changed":
      fields(v, [...common, "state"]);
      return { ...owner, type: v.type, state: choice(v.state, sessionStates) };
    case "message_completed":
      fields(v, [...common, "turn_id", "message_id", "role", "content"]);
      return {
        ...owner,
        type: v.type,
        turn_id: nullable(v.turn_id, wire.id),
        message_id: wire.id(v.message_id),
        role: choice(v.role, ["user", "assistant", "system", "tool"]),
        content: reference(v.content, "content"),
      };
    case "tool_state_changed":
      fields(v, [...common, "turn_id", "tool_call_id", "state"]);
      return {
        ...owner,
        type: v.type,
        turn_id: nullable(v.turn_id, wire.id),
        tool_call_id: wire.id(v.tool_call_id),
        state: choice(v.state, toolStates),
      };
    case "permission_observed":
      fields(v, [...common, "tool_call_id", "state"]);
      return {
        ...owner,
        type: v.type,
        tool_call_id: nullable(v.tool_call_id, wire.id),
        state: choice(v.state, [
          "not_observed",
          "requested",
          "granted",
          "denied",
        ]),
      };
    case "file_observed":
      fields(v, [...common, "path"]);
      return { ...owner, type: v.type, path: label(v.path, 4096) };
    case "capture_gap": {
      fields(v, [...common, "missing_from", "missing_to"]);
      const from = integer(v.missing_from),
        to = integer(v.missing_to);
      if (from >= to) return wire.invalid();
      return { ...owner, type: v.type, missing_from: from, missing_to: to };
    }
    default:
      return wire.invalid();
  }
}
function events(value: unknown): NativeEventBatch {
  const v = fields(value, [
    "schema_version",
    "normalizer_version",
    "evidence",
    "events",
  ]);
  return {
    schema_version: schema(v.schema_version),
    normalizer_version: label(v.normalizer_version, 128),
    evidence: reference(v.evidence, "observation_batch"),
    events: unique(list(v.events, 4096, event), (v) => v.event_id),
  };
}
function tool(value: unknown): NativeToolSnapshot {
  const v = fields(value, [
    "schema_version",
    "tool_call_id",
    "session_id",
    "turn_id",
    "native_name",
    "kind",
    "state",
    "attempts",
    "input",
    "output",
    "evidence",
  ]);
  return {
    schema_version: schema(v.schema_version),
    tool_call_id: wire.id(v.tool_call_id),
    session_id: wire.id(v.session_id),
    turn_id: nullable(v.turn_id, wire.id),
    native_name: label(v.native_name, 256),
    kind: choice(v.kind, [
      "read",
      "edit",
      "delete",
      "move",
      "search",
      "execute",
      "fetch",
      "plan",
      "delegate",
      "other",
    ]),
    state: choice(v.state, toolStates),
    attempts: unique(list(v.attempts, 64, wire.id), (v) => v),
    input: nullable(v.input, (v) => reference(v, "content")),
    output: nullable(v.output, (v) => reference(v, "content")),
    evidence: list(v.evidence, 1024, (v) => reference(v, "observation_batch")),
  };
}
function observations(value: unknown): NativeObservationBatch {
  const raw = wire.record(value);
  const v = fields(value, [
    "schema_version",
    "batch_id",
    "integration",
    "source_instance_id",
    "sanitizer_version",
    "representation",
    "observations",
    ...(Object.hasOwn(raw, "desktop") ? ["desktop"] : []),
  ]);
  const observations = unique(
    list(v.observations, 256, (raw) => {
      const o = fields(raw, [
        "observation_id",
        "source_sequence",
        "occurred_at_millis",
        "source_kind",
        "source_trust",
        "payload",
      ]);
      return {
        observation_id: wire.id(o.observation_id),
        source_sequence: integer(o.source_sequence),
        occurred_at_millis: nullable(o.occurred_at_millis, (v) =>
          integer(v, true),
        ),
        source_kind: choice(o.source_kind, [
          "hook",
          "plugin",
          "native_api",
          "session_export",
          "transcript",
          "controller",
          "manual",
          "workspace_observation",
        ]),
        source_trust: choice(o.source_trust, [
          "authenticated_controller",
          "local_user_hook",
          "locally_trusted_plugin",
          "approved_harness_api",
          "local_transcript",
          "imported_archive",
          "untrusted_assertion",
        ]),
        payload: payload(o.payload),
      };
    }),
    (v) => v.observation_id,
  );
  if (
    !observations.length ||
    observations.some(
      (v, i) =>
        i > 0 && v.source_sequence <= observations[i - 1]!.source_sequence,
    )
  )
    return wire.invalid();
  return {
    schema_version: schema(v.schema_version),
    batch_id: wire.id(v.batch_id),
    integration: choice(v.integration, integrations),
    source_instance_id: wire.id(v.source_instance_id),
    sanitizer_version: label(v.sanitizer_version, 128),
    representation: choice(v.representation, [
      "sanitized_native",
      "canonical_producer",
    ]),
    observations,
    ...(Object.hasOwn(v, "desktop")
      ? { desktop: captureFacts(v.desktop) }
      : {}),
  };
}
export function recordValue(value: unknown): NativeRecord {
  const r = fields(value, ["reference", "projection"]),
    p = fields(r.projection, ["type", "value"]),
    ref = reference(r.reference);
  if (ref.kind !== p.type) return wire.invalid();
  switch (p.type) {
    case "event_batch":
      return {
        reference: ref,
        projection: { type: p.type, value: events(p.value) },
      };
    case "tool_snapshot":
      return {
        reference: ref,
        projection: { type: p.type, value: tool(p.value) },
      };
    case "observation_batch":
      return {
        reference: ref,
        projection: { type: p.type, value: observations(p.value) },
      };
    case "content": {
      const v = fields(p.value, ["schema_version", "payload"]);
      return {
        reference: ref,
        projection: {
          type: p.type,
          value: {
            schema_version: schema(v.schema_version),
            payload: payload(v.payload),
          },
        },
      };
    }
    default:
      return wire.invalid();
  }
}
