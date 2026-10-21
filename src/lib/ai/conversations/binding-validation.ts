// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import { assertExecutionMode } from "../core/agent-profile.ts";
import { validateRecipients } from "./recipients.ts";
import { parseAiTurn } from "../../repository/ai-history.ts";
import type { AgentBindingRecord } from "./types.ts";
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
} from "./validation-fields.ts";
export function validateAgentBindingRecord(value: unknown): AgentBindingRecord {
  const data = record(value, "Agent record");
  assertSchemaVersion(data, "Agent record");
  requiredString(data, "id", "Agent record");
  assertTimestamp(data, "createdAt", "Agent record");
  if (data.type === "history.turn.recorded") {
    assertCurrentSchemaVersion(data, "History turn record");
    parseAiTurn(data.history);
  } else if (data.type === "binding.created") {
    assertExecutionMode(data.executionMode);
    if (data.participant !== undefined) validateRecipients([data.participant]);
    requiredString(data, "runtime", "Agent record");
    for (const key of [
      "agent",
      "nativeSessionId",
      "executionHostId",
      "handoffThroughEntryId",
      "replacesBindingId",
    ]) {
      assertOptionalString(data, key, "Agent record");
    }
  } else if (data.type === "usage.updated") {
    requiredString(data, "agentBindingId", "Agent record");
    const usage = record(data.usage, "Agent record usage");
    if (
      typeof usage.used !== "number" ||
      typeof usage.limit !== "number" ||
      !Number.isFinite(usage.used) ||
      !Number.isFinite(usage.limit) ||
      usage.used < 0 ||
      usage.limit <= 0
    ) {
      throw new Error("Agent record usage is invalid");
    }
  } else if (data.type === "binding.context.updated") {
    assertCurrentSchemaVersion(data, "Agent context record");
    requiredString(data, "agentBindingId", "Agent record");
    requiredString(data, "throughEntryId", "Agent record");
    const hash = requiredString(data, "throughEntryHash", "Agent record");
    if (!/^[0-9a-f]{64}$/u.test(hash)) {
      throw new Error("Agent record.throughEntryHash is invalid");
    }
    if (data.cause !== "native-turn" && data.cause !== "handoff") {
      throw new Error("Agent record.cause is invalid");
    }
    assertOptionalString(data, "handoffId", "Agent record");
    assertProjectionMode(data.projectionMode, "Agent record.projectionMode");
    assertOptionalCount(
      data.omittedEntryCount,
      "Agent record.omittedEntryCount",
    );
  } else if (data.type === "binding.config.updated") {
    assertCurrentSchemaVersion(data, "Agent configuration record");
    requiredString(data, "agentBindingId", "Agent record");
    assertModelRef(data.model, "Agent record.model");
    assertThinking(data.thinking, "Agent record.thinking");
    if (data.executionMode !== null) assertExecutionMode(data.executionMode);
    if (
      data.model == null &&
      data.thinking == null &&
      data.executionMode === undefined
    ) {
      throw new Error("Agent configuration record must change a field");
    }
  } else if (data.type === "handoff.summary.created") {
    assertCurrentSchemaVersion(data, "Handoff summary record");
    requiredString(data, "conversationId", "Agent record");
    requiredString(data, "fromEntryId", "Agent record");
    requiredString(data, "throughEntryId", "Agent record");
    const hash = requiredString(data, "sourceHash", "Agent record");
    if (!/^[0-9a-f]{64}$/u.test(hash)) {
      throw new Error("Agent record.sourceHash is invalid");
    }
    requiredString(data, "summary", "Agent record");
    const processor = record(data.processor, "Agent record processor");
    requiredString(processor, "runtime", "Agent record processor");
    requiredString(processor, "agent", "Agent record processor");
    requiredString(processor, "model", "Agent record processor");
    if (
      !Number.isSafeInteger(data.estimatedTokens) ||
      Number(data.estimatedTokens) <= 0
    ) {
      throw new Error("Agent record.estimatedTokens is invalid");
    }
  } else {
    throw new Error("Agent record type is unsupported");
  }
  return data as AgentBindingRecord;
}
