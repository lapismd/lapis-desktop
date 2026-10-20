import type {
  NativeSessionRecordSource,
  NativeSourceCoverage,
} from "../../../ai/conversations/native-records.ts";
import {
  choice,
  fields,
  integer,
  integrations,
  list,
  nullable,
  reference,
  schema,
  sessionStates,
  unique,
} from "./record-fields.ts";
import * as wire from "./wire.ts";

function coverage(value: unknown): NativeSourceCoverage {
  const v = fields(value, [
    "completeness",
    "gaps",
    "redacted_fields",
    "truncated",
  ]);
  const completeness = choice(v.completeness, [
      "complete",
      "partial",
      "unknown",
    ]),
    gaps = wire.revision(v.gaps);
  if (
    typeof v.truncated !== "boolean" ||
    (completeness === "complete" && (gaps !== 0 || v.truncated))
  )
    return wire.invalid();
  return {
    completeness,
    gaps,
    redacted_fields: wire.revision(v.redacted_fields),
    truncated: v.truncated,
  };
}
/** A minimal typed index into the retained view; the complete native view stays exact text. */
export function recordSources(
  value: unknown,
  threadId: string,
): NativeSessionRecordSource[] {
  const sources = list(value, 16, (raw): NativeSessionRecordSource => {
    const v = fields(raw, [
        "link",
        "snapshot",
        "transcripts",
        "records_cursor",
      ]),
      s = fields(v.snapshot, [
        "schema_version",
        "session_id",
        "integration",
        "state",
        "parent_session_id",
        "evidence",
        "event_batches",
        "transcripts",
        "tools",
        "coverage",
      ]);
    schema(s.schema_version);
    const link = wire.record(v.link),
      target = fields(link.target, [
        "type",
        "session_id",
        "snapshot",
        "primary",
      ]),
      snapshotRef = fields(target.snapshot, ["kind", "id"]);
    const sessionId = wire.id(s.session_id),
      linkedAtMillis = integer(link.accepted_at_millis, true);
    if (
      schema(link.schema_version) !== 1 ||
      wire.id(link.thread_id) !== threadId ||
      link.active !== true ||
      target.type !== "session" ||
      wire.id(target.session_id) !== sessionId ||
      snapshotRef.kind !== "session_snapshot" ||
      typeof snapshotRef.id !== "string" ||
      !/^[0-9a-f]{64}$/u.test(snapshotRef.id) ||
      typeof target.primary !== "boolean" ||
      linkedAtMillis < 0n
    )
      return wire.invalid();
    const rawTools = wire.record(s.tools),
      tools: Record<string, ReturnType<typeof reference>> = {};
    if (Object.keys(rawTools).length > 16_384) return wire.invalid();
    for (const [key, value] of Object.entries(rawTools))
      tools[wire.id(key)] = reference(value, "tool_snapshot");
    return {
      cursor: wire.handle(v.records_cursor),
      sessionId,
      parentSessionId: nullable(s.parent_session_id, wire.id),
      snapshotRef: { kind: "session_snapshot", id: snapshotRef.id },
      linkId: wire.id(link.id),
      linkedAtMillis,
      primary: target.primary,
      integration: choice(s.integration, integrations),
      state: choice(s.state, sessionStates),
      eventBatches: list(s.event_batches, 4096, (v) =>
        reference(v, "event_batch"),
      ),
      evidence: list(s.evidence, 4096, (v) =>
        reference(v, "observation_batch"),
      ),
      tools,
      coverage: coverage(s.coverage),
    };
  });
  unique(sources, (v) => v.cursor);
  unique(sources, (v) => v.linkId);
  return sources;
}
