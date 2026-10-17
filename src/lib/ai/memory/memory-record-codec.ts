// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import type { StoredMemoryRecord } from "./memory-record-store.ts";
import { parse, stringify } from "yaml";
import { sha256ConversationText as sha256Text } from "../conversations/hashes.ts";
import {
  hasHiddenApplicationSegment,
  normalizeConversationScope,
} from "../conversations/paths.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type {
  DurableMemoryRecord,
  MemoryEvidenceRef,
  MemoryScope,
} from "./types.ts";

const MEMORY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/u;
const MAX_MEMORY_FILE_BYTES = 512 * 1024;

export function memoryRoot(scope: MemoryScope): string {
  return [
    scope.kind === "project" ? scope.projectDir : "",
    ".lapis",
    "agents",
    "memory",
  ]
    .filter(Boolean)
    .join("/");
}

export function recordDirectory(scope: MemoryScope): string {
  return `${memoryRoot(scope)}/${scope.kind}/records`;
}

export function recordPath(scope: MemoryScope, id: string): string {
  assertMemoryId(id);
  return `${recordDirectory(scope)}/${id}.md`;
}

export function revisionDirectory(scope: MemoryScope, id: string): string {
  return `${memoryRoot(scope)}/revisions/${id}`;
}

export function serializeMemoryRecord(record: DurableMemoryRecord): string {
  validateMemoryRecord(record);
  const { summary, ...frontmatter } = record;
  const content = `---\n${stringify(frontmatter, { lineWidth: 0 })}---\n\n${summary.trim()}\n`;
  if (new TextEncoder().encode(content).byteLength > MAX_MEMORY_FILE_BYTES) {
    throw new Error("Memory record exceeds the maximum supported size");
  }
  return content;
}

export async function parseStoredRecord(
  path: string,
  content: string,
): Promise<StoredMemoryRecord> {
  if (new TextEncoder().encode(content).byteLength > MAX_MEMORY_FILE_BYTES) {
    throw new Error("Memory record exceeds the maximum supported size");
  }
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?([\s\S]*)$/u.exec(
    content,
  );
  if (!match) throw new Error("Memory record requires YAML frontmatter");
  const metadata = parse(match[1]!, { maxAliasCount: 10 }) as Record<
    string,
    unknown
  >;
  const record = validateMemoryRecord({
    ...metadata,
    summary: match[2]!.trim(),
  });
  const expectedPath = recordPath(record.scope, record.id);
  const isRevision = path.startsWith(
    `${revisionDirectory(record.scope, record.id)}/`,
  );
  if (path !== expectedPath && !isRevision) {
    throw new Error("Memory record path does not match its scope and identity");
  }
  return { record, path, hash: await sha256Text(content), content };
}

export function validateMemoryRecord(value: unknown): DurableMemoryRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Memory record must be an object");
  }
  const record = value as DurableMemoryRecord;
  if (record.schemaVersion !== 1) throw new Error("Unsupported memory schema");
  assertMemoryId(record.id);
  if (!Number.isSafeInteger(record.revision) || record.revision < 1) {
    throw new Error("Memory revision is invalid");
  }
  if (
    !["preference", "fact", "decision", "procedure", "constraint"].includes(
      record.kind,
    )
  ) {
    throw new Error("Memory kind is invalid");
  }
  validateScope(record.scope);
  if (record.status !== "active" && record.status !== "retracted") {
    throw new Error("Memory status is invalid");
  }
  if (![1, 2, 3, 4, 5].includes(record.importance)) {
    throw new Error("Memory importance is invalid");
  }
  if (
    !Array.isArray(record.triggers) ||
    record.triggers.some((item) => typeof item !== "string")
  ) {
    throw new Error("Memory triggers are invalid");
  }
  if (typeof record.summary !== "string" || !record.summary.trim()) {
    throw new Error("Memory summary is required");
  }
  if (!Array.isArray(record.evidence))
    throw new Error("Memory evidence is invalid");
  for (const evidence of record.evidence) validateEvidence(evidence);
  if (record.createdBy !== "owner-ui" && record.evidence.length === 0) {
    throw new Error("Automatically generated memory requires evidence");
  }
  if (
    !["owner-ui", "deterministic-promotion", "consolidator"].includes(
      record.createdBy,
    )
  ) {
    throw new Error("Memory creator is invalid");
  }
  for (const timestamp of [record.createdAt, record.updatedAt]) {
    if (!Number.isFinite(Date.parse(timestamp)))
      throw new Error("Memory timestamp is invalid");
  }
  if (
    record.previousRevisionHash !== undefined &&
    !/^[0-9a-f]{64}$/u.test(record.previousRevisionHash)
  ) {
    throw new Error("Memory previous revision hash is invalid");
  }
  return structuredClone(record);
}

function validateEvidence(evidence: MemoryEvidenceRef): void {
  if (
    !evidence ||
    typeof evidence.conversationId !== "string" ||
    typeof evidence.entryId !== "string" ||
    !/^[0-9a-f]{64}$/u.test(evidence.entryHash) ||
    !Number.isFinite(Date.parse(evidence.observedAt)) ||
    typeof evidence.scopeDirAtObservation !== "string"
  ) {
    throw new Error("Memory evidence reference is invalid");
  }
}

function validateScope(scope: MemoryScope): void {
  if (!scope || !["user", "workspace", "project"].includes(scope.kind)) {
    throw new Error("Memory scope is invalid");
  }
  if (scope.kind === "project") {
    let normalized: string;
    try {
      normalized = normalizeConversationScope(scope.projectDir);
    } catch {
      throw new Error("Project memory scope is invalid");
    }
    if (
      normalized !== scope.projectDir ||
      hasHiddenApplicationSegment(normalized)
    ) {
      throw new Error("Project memory scope is invalid");
    }
  }
}

export function assertMemoryId(id: string): void {
  if (typeof id !== "string" || !MEMORY_ID_PATTERN.test(id))
    throw new Error("Memory ID is invalid");
}
