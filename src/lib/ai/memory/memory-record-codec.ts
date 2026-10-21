// SPDX-License-Identifier: Apache-2.0
import {
  hasHiddenApplicationSegment,
  normalizeConversationScope,
} from "../conversations/paths.ts";
import type {
  DurableMemoryRecord,
  MemoryEvidenceRef,
  MemoryScope,
} from "./types.ts";
const MEMORY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/u;

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
  if (new TextEncoder().encode(record.summary).byteLength >= 512 * 1024)
    throw new Error("Memory exceeds the maximum supported size");
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
