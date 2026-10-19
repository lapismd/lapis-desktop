// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import type { TranscriptEntry } from "./types.ts";
import { validateDelivery } from "./dispatch-intent.ts";
import { validateRecipients } from "./recipients.ts";
import { validateCommentContexts } from "./comment-context.ts";
import {
  record,
  assertSchemaVersion,
  requiredString,
  assertTimestamp,
  assertOptionalString,
  assertCurrentSchemaVersion,
  assertProjectionMode,
  assertOptionalCount,
  assertModelRef,
  assertThinking,
  assertInventory,
} from "./validation-fields.ts";
export function validateTranscriptEntry(value: unknown): TranscriptEntry {
  const data = record(value, "Transcript entry");
  assertSchemaVersion(data, "Transcript entry");
  requiredString(data, "id", "Transcript entry");
  assertTimestamp(data, "createdAt", "Transcript entry");
  const types = new Set([
    "message",
    "agent.delivery",
    "thinking.summary",
    "tool",
    "approval.request",
    "approval.response",
    "question.request",
    "question.response",
    "agent.switch",
    "agent.config",
    "system.notice",
    "cancelled",
    "error",
    "command",
    "skill-activation",
  ]);
  if (typeof data.type !== "string" || !types.has(data.type)) {
    throw new Error("Transcript entry type is unsupported");
  }
  if (data.source != null) {
    const source = record(data.source, "Transcript entry source");
    requiredString(source, "sessionId", "Transcript entry source");
    requiredString(source, "runId", "Transcript entry source");
    if (!Number.isSafeInteger(source.sequence) || Number(source.sequence) < 0) {
      throw new Error("Transcript entry source.sequence is invalid");
    }
    if (
      "frameIndex" in source &&
      (!Number.isSafeInteger(source.frameIndex) ||
        Number(source.frameIndex) < 0)
    ) {
      throw new Error("Transcript entry source.frameIndex is invalid");
    }
  }
  if (data.provenance != null) {
    const provenance = record(data.provenance, "Transcript entry provenance");
    if (
      !["owner", "agent", "untrusted", "system"].includes(
        String(provenance.originClass),
      )
    ) {
      throw new Error("Transcript entry provenance.originClass is invalid");
    }
    if (
      ![
        "user-message",
        "assistant-message",
        "runtime-output",
        "owner-response",
        "app-system",
      ].includes(String(provenance.sourceKind))
    ) {
      throw new Error("Transcript entry provenance.sourceKind is invalid");
    }
  }
  switch (data.type) {
    case "agent.delivery":
      requiredString(data, "dispatchId", "Agent delivery");
      requiredString(data, "parentId", "Agent delivery");
      validateDelivery(data.delivery);
      break;
    case "message":
      if (data.recipients !== undefined && data.role !== "user")
        throw new Error("Only authored messages may retain recipient tags");
      validateRecipients(data.recipients);
      if (data.role !== "user" && data.role !== "assistant") {
        throw new Error("Transcript message role is invalid");
      }
      if (data.contextBlocks !== undefined && data.role !== "user")
        throw new Error(
          "Only authored messages may retain submitted comment context",
        );
      if (
        typeof data.text !== "string" ||
        (!data.text && !validateCommentContexts(data.contextBlocks).length)
      )
        throw new Error(
          "Transcript message requires authored text or comments",
        );
      validateCommentContexts(data.contextBlocks);
      break;
    case "thinking.summary":
      requiredString(data, "text", "Transcript thinking summary");
      if (
        data.kind != null &&
        data.kind !== "summary" &&
        data.kind !== "plan"
      ) {
        throw new Error("Transcript thinking summary kind is invalid");
      }
      break;
    case "tool":
      requiredString(data, "toolId", "Transcript tool");
      requiredString(data, "name", "Transcript tool");
      if (
        data.state !== "completed" &&
        data.state !== "error" &&
        data.state !== "cancelled"
      ) {
        throw new Error("Transcript tool state is invalid");
      }
      assertOptionalString(data, "input", "Transcript tool");
      assertOptionalString(data, "output", "Transcript tool");
      break;
    case "approval.request":
      requiredString(data, "requestId", "Transcript approval request");
      requiredString(data, "title", "Transcript approval request");
      if (!Array.isArray(data.options)) {
        throw new Error("Transcript approval request options are invalid");
      }
      if ("metadata" in data) {
        throw new Error("Transcript approval request must not retain metadata");
      }
      break;
    case "approval.response":
      requiredString(data, "requestId", "Transcript approval response");
      if (!data.option || typeof data.option !== "object") {
        throw new Error("Transcript approval response option is invalid");
      }
      break;
    case "question.request":
      requiredString(data, "requestId", "Transcript question request");
      requiredString(data, "title", "Transcript question request");
      if (!Array.isArray(data.questions) || "answers" in data) {
        throw new Error("Transcript question request is invalid");
      }
      break;
    case "question.response":
      requiredString(data, "requestId", "Transcript question response");
      if (
        (data.status !== "answered" && data.status !== "cancelled") ||
        "answers" in data
      ) {
        throw new Error("Transcript question response is invalid");
      }
      break;
    case "agent.switch":
      requiredString(data, "toBindingId", "Transcript agent switch");
      assertOptionalString(data, "handoffId", "Transcript agent switch");
      assertOptionalString(
        data,
        "handoffThroughEntryId",
        "Transcript agent switch",
      );
      assertProjectionMode(
        data.handoffMode,
        "Transcript agent switch handoffMode",
      );
      assertOptionalCount(
        data.omittedEntryCount,
        "Transcript agent switch omittedEntryCount",
      );
      break;
    case "agent.config":
      assertCurrentSchemaVersion(data, "Transcript agent config");
      assertModelRef(data.model, "Transcript agent config model");
      assertThinking(data.thinking, "Transcript agent config thinking");
      if (data.model == null && data.thinking == null) {
        throw new Error("Transcript agent config must change a field");
      }
      break;
    case "system.notice":
      requiredString(data, "text", "Transcript system notice");
      if (
        data.layout != null &&
        data.layout !== "report" &&
        data.layout !== "inventory"
      ) {
        throw new Error("Transcript system notice layout is invalid");
      }
      if (data.layout === "inventory") {
        assertInventory(data.inventory, "Transcript system notice");
      }
      break;
    case "cancelled":
      assertOptionalString(data, "text", "Transcript cancellation");
      assertOptionalString(data, "requestId", "Transcript cancellation");
      if (
        data.interactionType != null &&
        data.interactionType !== "approval" &&
        data.interactionType !== "question"
      ) {
        throw new Error("Transcript cancellation interaction type is invalid");
      }
      break;
    case "error":
      requiredString(data, "message", "Transcript error");
      break;
    case "command":
      requiredString(data, "command", "Transcript command");
      if (
        data.origin !== "app" &&
        data.origin !== "extension" &&
        data.origin !== "skill" &&
        data.origin !== "native-agent"
      ) {
        throw new Error("Transcript command origin is invalid");
      }
      if (
        data.status !== "completed" &&
        data.status !== "failed" &&
        data.status !== "cancelled"
      ) {
        throw new Error("Transcript command status is invalid");
      }
      break;
    case "skill-activation":
      requiredString(data, "skillId", "Transcript skill activation");
      requiredString(data, "skillName", "Transcript skill activation");
      requiredString(data, "version", "Transcript skill activation");
      if (
        data.origin !== "user" &&
        data.origin !== "model" &&
        data.origin !== "app"
      ) {
        throw new Error("Transcript skill activation origin is invalid");
      }
      break;
  }
  return data as TranscriptEntry;
}
