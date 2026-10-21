// SPDX-License-Identifier: Apache-2.0
import type { TranscriptEntry, ConversationMetadata } from "./types.ts";
import { record } from "./validation-fields.ts";

export type ImportSource = {
  kind: "codex" | "cursor" | "opencode";
  profile: string;
  sessionKey: string;
  snapshotKey: string;
};
export type ImportMarker = {
  version: 1;
  source: ImportSource;
  contentDigest: string;
  entryCount: number;
  state: "preparing" | "complete";
};
export type CapturedEntry =
  | {
      id: string;
      createdAt: string;
      type: "message";
      role: "user" | "assistant";
      text: string;
    }
  | {
      id: string;
      createdAt: string;
      type: "tool";
      name: string;
      state: "completed" | "error" | "cancelled" | "unknown";
      input?: string;
      output?: string;
    }
  | { id: string; createdAt: string; type: "notice"; text: string };
/** Sanitized native output only. Never a raw provider transcript or launch specification. */
export type CapturedSession = {
  version: 1;
  source: ImportSource;
  createdAt: string;
  entries: CapturedEntry[];
};
export type SessionImportPlan = {
  metadata: ConversationMetadata & { imported: ImportMarker };
  entries: TranscriptEntry[];
};
export const MAX_IMPORT_ENTRIES = 4096;
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
const digest = /^[0-9a-f]{64}$/u;
export function validateImportSource(value: unknown): ImportSource {
  const s = record(value, "Import source");
  if (
    Object.keys(s).sort().join() !== "kind,profile,sessionKey,snapshotKey" ||
    !["codex", "cursor", "opencode"].includes(String(s.kind)) ||
    typeof s.profile !== "string" ||
    !(s.kind === "codex"
      ? /^codex-(?:cli|desktop)-[0-9]+\.[0-9]+\.[0-9]+$/u.test(s.profile)
      : s.kind === "cursor"
        ? s.profile === "cursor-jsonl-v1"
        : s.profile === "opencode-sqlite-v1") ||
    s.profile.length > 80 ||
    typeof s.sessionKey !== "string" ||
    !digest.test(s.sessionKey) ||
    typeof s.snapshotKey !== "string" ||
    !digest.test(s.snapshotKey)
  )
    throw new Error("Invalid sanitized import source");
  return s as ImportSource;
}
export function validateImportMarker(value: unknown): ImportMarker {
  const m = record(value, "Import marker");
  validateImportSource(m.source);
  if (
    Object.keys(m).sort().join() !==
      "contentDigest,entryCount,source,state,version" ||
    m.version !== 1 ||
    typeof m.contentDigest !== "string" ||
    !digest.test(m.contentDigest) ||
    !Number.isSafeInteger(m.entryCount) ||
    Number(m.entryCount) < 1 ||
    Number(m.entryCount) > MAX_IMPORT_ENTRIES ||
    (m.state !== "preparing" && m.state !== "complete")
  )
    throw new Error("Invalid import marker");
  return m as ImportMarker;
}
export function assertConversationWritable(
  metadata: ConversationMetadata,
): void {
  if (metadata.imported)
    throw new Error(
      "Imported snapshots are read-only. Start a new conversation to chat.",
    );
}
