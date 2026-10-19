import type { TranscriptEntry } from "./types.ts";
import {
  record,
  requiredString,
  assertTimestamp,
  assertThinking,
} from "./validation-fields.ts";
import { validateRecipients } from "./recipients.ts";
import { validateCommentContexts } from "./comment-context.ts";
import { normalizePortableVaultPath } from "./paths.ts";
import { ACP_AGENT_IDS, type AcpAgentId } from "../settings/acp-agents.ts";
import type { ModelRef, AiThinkingLevel } from "../core/models.ts";
export type QueueSelection = {
  targets: { id: string; agent: AcpAgentId; model?: ModelRef }[];
  runtime: "acp" | "codex-native" | "opencode-native" | "fake";
  thinking?: AiThinkingLevel;
  attachments: string[];
};
export type QueuedMessage = {
  version: 1;
  id: string;
  state: "queued" | "dispatching";
  dispatchId?: string;
  user: Extract<TranscriptEntry, { type: "message" }>;
  selection: QueueSelection;
};
export type QueueOutcome =
  | "completed"
  | "cancelled"
  | "rejected"
  | "not_sent"
  | "unknown";
export const MAX_QUEUED_MESSAGES = 16,
  MAX_QUEUE_BYTES = 128 * 1024;
const fields = (v: Record<string, unknown>, keys: string[]) => {
  if (Object.keys(v).some((k) => !keys.includes(k)))
    throw new Error("Queued message contains unsupported fields");
};
export function validateQueuedMessage(value: unknown): QueuedMessage {
  const q = record(value, "Queued message");
  fields(q, ["version", "id", "state", "dispatchId", "user", "selection"]);
  if (
    q.version !== 1 ||
    !["queued", "dispatching"].includes(String(q.state)) ||
    requiredString(q, "id", "Queued message").length > 512
  )
    throw new Error("Invalid queued message identity or state");
  if (q.state === "dispatching")
    requiredString(q, "dispatchId", "Queued message");
  else if (q.dispatchId !== undefined)
    throw new Error("Unstarted queue item cannot retain a dispatch");
  const u = record(q.user, "Queued authored message");
  fields(u, [
    "schemaVersion",
    "id",
    "type",
    "role",
    "text",
    "recipients",
    "createdAt",
    "contextBlocks",
    "provenance",
  ]);
  if (
    u.schemaVersion !== 3 ||
    u.type !== "message" ||
    u.role !== "user" ||
    typeof u.text !== "string" ||
    new TextEncoder().encode(u.text).length > 32768
  )
    throw new Error("Invalid queued authored message");
  requiredString(u, "id", "Queued authored message");
  assertTimestamp(u, "createdAt", "Queued authored message");
  if (u.provenance !== undefined) {
    const p = record(u.provenance, "Queued provenance");
    fields(p, ["originClass", "sourceKind"]);
    if (p.originClass !== "owner" || p.sourceKind !== "user-message")
      throw new Error("Invalid queued message provenance");
  }
  const recipients = validateRecipients(u.recipients),
    comments = validateCommentContexts(u.contextBlocks);
  if (!recipients.length || (!u.text.trim() && !comments.length))
    throw new Error("Queued message requires recipients and authored content");
  const s = record(q.selection, "Queue selection");
  fields(s, ["targets", "runtime", "thinking", "attachments"]);
  if (
    !["acp", "codex-native", "opencode-native", "fake"].includes(
      String(s.runtime),
    )
  )
    throw new Error("Invalid queued runtime preference");
  assertThinking(s.thinking, "Queue thinking");
  if (!Array.isArray(s.targets) || s.targets.length !== recipients.length)
    throw new Error("Queue targets do not match recipients");
  for (const [i, value] of s.targets.entries()) {
    const t = record(value, "Queue target");
    fields(t, ["id", "agent", "model"]);
    if (
      t.id !== recipients[i]!.id ||
      !ACP_AGENT_IDS.includes(t.agent as AcpAgentId)
    )
      throw new Error("Invalid queued target");
    if (t.model !== undefined) {
      const m = record(t.model, "Queue model");
      fields(m, ["provider", "model"]);
      for (const k of ["provider", "model"])
        if (requiredString(m, k, "Queue model").length > 512)
          throw new Error("Queue model is too long");
    }
  }
  if (!Array.isArray(s.attachments) || s.attachments.length > 8)
    throw new Error("Queue attachment limit exceeded");
  for (const p of s.attachments) {
    if (typeof p !== "string" || p.length > 2048)
      throw new Error("Invalid queued file path");
    normalizePortableVaultPath(p, { label: "Queued attachment" });
  }
  return q as QueuedMessage;
}
export function validateQueuedMessages(value: unknown): QueuedMessage[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > MAX_QUEUED_MESSAGES ||
    new TextEncoder().encode(JSON.stringify(value)).length > MAX_QUEUE_BYTES
  )
    throw new Error("Pending message queue limit exceeded");
  const qs = value.map(validateQueuedMessage);
  if (
    new Set(qs.map((q) => q.id)).size !== qs.length ||
    new Set(qs.map((q) => q.user.id)).size !== qs.length
  )
    throw new Error("Queued message identities must be distinct");
  return qs;
}
export function queueReceipt(
  q: QueuedMessage,
  outcome: QueueOutcome,
): Extract<TranscriptEntry, { type: "queue.outcome" }> {
  return {
    schemaVersion: 3,
    type: "queue.outcome",
    id: `queue:${q.id}:${outcome}`,
    parentId: q.user.id,
    createdAt: new Date().toISOString(),
    queued: structuredClone(q),
    outcome,
  };
}

export class QueueRefusedError extends Error {
  readonly outcome = "rejected";
}
