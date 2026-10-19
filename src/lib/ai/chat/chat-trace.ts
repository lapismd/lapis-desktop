// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import {
  approvalChoiceStatus,
  requireApprovalOption,
} from "../core/approvals.ts";
import type { AgentEvent } from "../core/events.ts";
import { createChatItemId, type AiChatItem } from "./chat-items.ts";
import { isEmptyToolInput, preferToolName } from "./chat-tool-identity.ts";

import { findToolItemIndex } from "./chat-tool-pairing.ts";

export type ChatItemIdentity = (kind: string, provided?: string) => string;

export function applyAgentEventToChatItems(
  items: AiChatItem[],
  event: AgentEvent,
  now = () => new Date().toISOString(),
  identify?: ChatItemIdentity,
): AiChatItem[] {
  const next = [...items];
  const createdAt = now();
  const id = (kind: string, provided?: string) =>
    identify?.(kind, provided) ??
    provided ??
    createChatItemId(kind, next.length + 1);
  const source = event.source ? { source: { ...event.source } } : {};
  switch (event.type) {
    case "text": {
      settleStreamingThinking(next);
      const last = next.at(-1);
      if (last?.type === "message" && last.role === "assistant") {
        next[next.length - 1] = {
          ...last,
          ...source,
          text: `${last.text}${event.text}`,
        };
        return next;
      }
      next.push({
        id: id("message"),
        type: "message",
        role: "assistant",
        text: event.text,
        createdAt,
        ...source,
      });
      return next;
    }
    case "thinking": {
      const last = next.at(-1);
      if (last?.type === "thinking" && last.state === "streaming") {
        next[next.length - 1] = {
          ...last,
          text: `${last.text}${event.text}`,
          kind: event.kind ?? last.kind,
          ...source,
        };
        return next;
      }
      next.push({
        id: id("thinking"),
        type: "thinking",
        text: event.text,
        kind: event.kind,
        state: "streaming",
        createdAt,
        ...source,
      });
      return next;
    }
    case "tool.start": {
      settleStreamingThinking(next);
      const index = findToolItemIndex(next, event);
      const input = preferToolInput(undefined, event.input);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            toolId: pairedToolId(current, event.id),
            name: preferToolName(current.name, event.name),
            server: event.server ?? current.server,
            state: "running",
            input: preferToolInput(current.input, event.input),
            ...source,
          };
        }
      } else {
        next.push({
          id: id("tool", event.id),
          type: "tool",
          toolId: event.id,
          name: preferToolName(undefined, event.name),
          server: event.server,
          state: "running",
          input,
          createdAt,
          ...source,
        });
      }
      return next;
    }
    case "tool.end": {
      settleStreamingThinking(next);
      const index = findToolItemIndex(next, event);
      const output =
        event.error != null
          ? stringifyUnknown(event.error)
          : stringifyUnknown(event.output);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            toolId: pairedToolId(current, event.id),
            name: preferToolName(current.name, event.name),
            server: event.server ?? current.server,
            state: event.error != null ? "error" : "completed",
            input: preferToolInput(current.input, event.input),
            output,
            ...source,
          };
        }
        return next;
      }
      next.push({
        id: id("tool", event.id),
        type: "tool",
        toolId: event.id,
        name: preferToolName(undefined, event.name),
        server: event.server,
        state: event.error != null ? "error" : "completed",
        input: preferToolInput(undefined, event.input),
        output,
        createdAt,
        ...source,
      });
      return next;
    }
    case "permission.request": {
      settleStreamingThinking(next);
      next.push({
        id: id("approval", `approval-${event.request.id}`),
        type: "approval",
        request: event.request,
        status: "pending",
        createdAt,
        ...source,
      });
      return next;
    }
    case "question.request": {
      settleStreamingThinking(next);
      next.push({
        id: id("question", `question-${event.request.id}`),
        type: "question",
        request: event.request,
        status: "pending",
        createdAt,
        ...source,
      });
      return next;
    }
    case "status": {
      if (!isVisibleAgentStatus(event.status)) return next;
      settleStreamingThinking(next);
      next.push({
        id: id("status"),
        type: "status",
        text: event.status,
        createdAt,
        ...source,
      });
      return next;
    }
    case "error": {
      const settled = next.map((item) =>
        item.type === "thinking" && item.state === "streaming"
          ? { ...item, state: "done" as const }
          : item,
      );
      settled.push({
        id: id("error"),
        type: "error",
        text: event.error.message,
        createdAt,
        ...source,
      });
      return settled;
    }
    case "completed": {
      return next.map((item) =>
        item.type === "thinking" && item.state === "streaming"
          ? { ...item, state: "done", ...source }
          : item,
      );
    }
    case "commands.update":
      return next;
    default:
      return next;
  }
}

export function isVisibleAgentStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return !(
    /^usage updated(?:\s*:\s*[\d,]+\s*\/\s*[\d,]+)?$/.test(normalized) ||
    normalized === "session updated" ||
    /^available commands updated(?:\s*\(\d+\))?$/.test(normalized)
  );
}

export function markApprovalResponse(
  items: AiChatItem[],
  requestId: string,
  optionId: string,
): AiChatItem[] {
  return items.map((item) => {
    if (item.type !== "approval" || item.request.id !== requestId) return item;
    const option = requireApprovalOption(item.request, optionId);
    return {
      ...item,
      status: approvalChoiceStatus(option),
      responseOptionId: optionId,
    };
  });
}

export function markQuestionResponse(
  items: AiChatItem[],
  requestId: string,
): AiChatItem[] {
  return items.map((item) =>
    item.type === "question" && item.request.id === requestId
      ? { ...item, status: "answered" }
      : item,
  );
}

function settleStreamingThinking(items: AiChatItem[]): void {
  for (const [index, item] of items.entries()) {
    if (item.type === "thinking" && item.state === "streaming") {
      items[index] = { ...item, state: "done" };
    }
  }
}

function stringifyUnknown(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function preferToolInput(
  current: string | undefined,
  incoming: unknown,
): string | undefined {
  if (isEmptyToolInput(incoming)) return current;
  return stringifyUnknown(incoming) ?? current;
}

function pairedToolId(
  current: Extract<AiChatItem, { type: "tool" }>,
  incomingId: string,
): string {
  if (current.id === incomingId || current.toolId === incomingId) {
    return current.toolId;
  }
  return incomingId;
}
