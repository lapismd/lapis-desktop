import type { CanonicalConversationIdentity } from "./backend-port.ts";

/** Read projections preserve native identity; they are never storage/write DTOs. */
export type NativeRecordKind =
  | "event_batch"
  | "tool_snapshot"
  | "observation_batch"
  | "content";
export type NativeRecordRef = { kind: NativeRecordKind; id: string };
export type NativePayload = { media_type: "json" | "text"; text: string };
export type NativeSessionState =
  | "discovered"
  | "active"
  | "idle"
  | "ended"
  | "unknown";
export type NativeToolState =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "interrupted"
  | "skipped"
  | "unknown";
export type NativePermissionState =
  | "not_observed"
  | "requested"
  | "granted"
  | "denied";
type EventIdentity = { event_id: string; session_id: string };
export type NativeAgentEvent = EventIdentity &
  (
    | { type: "session_state_changed"; state: NativeSessionState }
    | {
        type: "message_completed";
        turn_id: string | null;
        message_id: string;
        role: "user" | "assistant" | "system" | "tool";
        content: NativeRecordRef;
      }
    | {
        type: "tool_state_changed";
        turn_id: string | null;
        tool_call_id: string;
        state: NativeToolState;
      }
    | {
        type: "permission_observed";
        tool_call_id: string | null;
        state: NativePermissionState;
      }
    | { type: "file_observed"; path: string }
    | { type: "capture_gap"; missing_from: bigint; missing_to: bigint }
  );
export type NativeEventBatch = {
  schema_version: 1;
  normalizer_version: string;
  evidence: NativeRecordRef;
  events: NativeAgentEvent[];
};
export type NativeToolSnapshot = {
  schema_version: 1;
  tool_call_id: string;
  session_id: string;
  turn_id: string | null;
  native_name: string;
  kind:
    | "read"
    | "edit"
    | "delete"
    | "move"
    | "search"
    | "execute"
    | "fetch"
    | "plan"
    | "delegate"
    | "other";
  state: NativeToolState;
  attempts: string[];
  input: NativeRecordRef | null;
  output: NativeRecordRef | null;
  evidence: NativeRecordRef[];
};
export type NativeObservation = {
  observation_id: string;
  source_sequence: bigint;
  occurred_at_millis: bigint | null;
  source_kind:
    | "hook"
    | "plugin"
    | "native_api"
    | "session_export"
    | "transcript"
    | "controller"
    | "manual"
    | "workspace_observation";
  source_trust:
    | "authenticated_controller"
    | "local_user_hook"
    | "locally_trusted_plugin"
    | "approved_harness_api"
    | "local_transcript"
    | "imported_archive"
    | "untrusted_assertion";
  payload: NativePayload;
};
export type NativeObservationBatch = {
  schema_version: 1;
  batch_id: string;
  integration: "codex" | "cursor" | "open_code" | "owned_controller";
  source_instance_id: string;
  sanitizer_version: string;
  representation: "sanitized_native" | "canonical_producer";
  observations: NativeObservation[];
  desktop?: import("./native-capture-facts.ts").NativeCaptureFacts;
};
export type NativeRecordValue =
  | { type: "event_batch"; value: NativeEventBatch }
  | { type: "tool_snapshot"; value: NativeToolSnapshot }
  | { type: "observation_batch"; value: NativeObservationBatch }
  | { type: "content"; value: { schema_version: 1; payload: NativePayload } };
export type NativeRecord = {
  reference: NativeRecordRef;
  projection: NativeRecordValue;
};
export type NativeRecordPage = {
  /** Exact source envelope remains available independently of typed projection. */
  source: string;
  origin:
    | { version: 1; requestId: string }
    | { version: 2; conversation: CanonicalConversationIdentity };
  selection: number[];
  cursor: string;
  sessionId: string;
  afterIndex: number;
  nextAfterIndex: number | null;
  records: NativeRecord[];
};
export type NativeSourceCoverage = {
  completeness: "complete" | "partial" | "unknown";
  gaps: number;
  redacted_fields: number;
  truncated: boolean;
};
export type NativeSessionRecordSource = {
  cursor: string;
  sessionId: string;
  parentSessionId: string | null;
  snapshotRef: { kind: "session_snapshot"; id: string };
  linkId: string;
  linkedAtMillis: bigint;
  primary: boolean;
  integration: NativeObservationBatch["integration"];
  state: NativeSessionState;
  eventBatches: NativeRecordRef[];
  evidence: NativeRecordRef[];
  tools: Record<string, NativeRecordRef>;
  coverage: NativeSourceCoverage;
};
