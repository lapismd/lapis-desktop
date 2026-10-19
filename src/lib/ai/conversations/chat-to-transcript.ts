// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import type { AiChatItem } from "../chat/chat-items.ts";
import type { DurableSanitizationOptions } from "./redaction.ts";
import { sanitizeDurableField } from "./redaction.ts";
import { persistableCommentContexts } from "./comment-context.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type TranscriptEntry,
  type RuntimeEventProvenance,
} from "./types.ts";

export type TranscriptProjectionOptions = DurableSanitizationOptions & {
  agentBindingId?: string;
  now?: () => string;
};

function isRuntimeProvenance(value: unknown): value is RuntimeEventProvenance {
  return Boolean(
    value &&
      typeof value === "object" &&
      "sessionId" in value &&
      "runId" in value,
  );
}

function runtimeProvenance(value: unknown): {
  source?: RuntimeEventProvenance;
} {
  return isRuntimeProvenance(value) ? { source: { ...value } } : {};
}

function createdAt(item: AiChatItem, now: () => string): string {
  return item.createdAt ?? now();
}

export function projectChatItemsToTranscript(
  items: AiChatItem[],
  options: TranscriptProjectionOptions = {},
): TranscriptEntry[] {
  const now = options.now ?? (() => new Date().toISOString());
  return items.flatMap((item): TranscriptEntry[] => {
    const common = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      createdAt: createdAt(item, now),
      ...(options.agentBindingId
        ? { agentBindingId: options.agentBindingId }
        : {}),
      ...runtimeProvenance(item.source),
    } as const;
    switch (item.type) {
      case "message": {
        const contexts =
          item.role === "user"
            ? persistableCommentContexts(item.contextBlocks)
            : [];
        return [
          {
            ...common,
            id: item.id,
            type: "message",
            role: item.role,
            text: item.text,
            ...(contexts.length ? { contextBlocks: contexts } : {}),
            provenance: {
              originClass: item.role === "user" ? "owner" : "agent",
              sourceKind:
                item.role === "user" ? "user-message" : "assistant-message",
            },
          },
        ];
      }
      case "thinking":
        if (
          item.state !== "done" ||
          (item.kind !== "summary" && item.kind !== "plan")
        ) {
          return [];
        }
        return [
          {
            ...common,
            id: item.id,
            type: "thinking.summary",
            text: item.text,
            kind: item.kind,
            provenance: {
              originClass: "agent",
              sourceKind: "runtime-output",
            },
          },
        ];
      case "tool": {
        if (item.state === "running") return [];
        const input = sanitizeDurableField(item.input, options);
        const output = sanitizeDurableField(item.output, options);
        return [
          {
            ...common,
            id: item.id,
            type: "tool",
            toolId: item.toolId,
            name: item.name,
            server: item.server,
            state: item.state,
            input: input.text,
            output: output.text,
            redacted: input.redacted || output.redacted || undefined,
            truncated: input.truncated || output.truncated || undefined,
            provenance: {
              originClass: "untrusted",
              sourceKind: "runtime-output",
            },
          },
        ];
      }
      case "approval": {
        const toolInput = sanitizeDurableField(
          item.request.tool?.input,
          options,
        );
        const entries: TranscriptEntry[] = [
          {
            ...common,
            id: `${item.id}:request`,
            type: "approval.request",
            requestId: item.request.id,
            kind: item.request.kind,
            title: item.request.title,
            tool: item.request.tool
              ? { name: item.request.tool.name, input: toolInput.text }
              : undefined,
            options: item.request.options.map((option) => ({ ...option })),
            redacted: toolInput.redacted || undefined,
            truncated: toolInput.truncated || undefined,
            provenance: {
              originClass: "untrusted",
              sourceKind: "runtime-output",
            },
          },
        ];
        if (item.responseOptionId) {
          const option = item.request.options.find(
            (candidate) => candidate.id === item.responseOptionId,
          );
          entries.push({
            ...common,
            id: `${item.id}:response`,
            type: "approval.response",
            // The owner's decision is distinct from the runtime request frame.
            source: undefined,
            requestId: item.request.id,
            option: {
              id: item.responseOptionId,
              label: option?.label ?? item.responseOptionId,
            },
            provenance: {
              originClass: "owner",
              sourceKind: "owner-response",
            },
          });
        }
        return entries;
      }
      case "question": {
        const entries: TranscriptEntry[] = [
          {
            ...common,
            id: `${item.id}:request`,
            type: "question.request",
            requestId: item.request.id,
            title: item.request.title,
            questions: structuredClone(item.request.questions),
            provenance: {
              originClass: "agent",
              sourceKind: "runtime-output",
            },
          },
        ];
        if (item.status !== "pending") {
          entries.push({
            ...common,
            id: `${item.id}:response`,
            type: "question.response",
            source: undefined,
            requestId: item.request.id,
            status: item.status,
            provenance: {
              originClass: "owner",
              sourceKind: "owner-response",
            },
          });
        }
        return entries;
      }
      case "status":
        return [
          {
            ...common,
            id: item.id,
            type: "system.notice",
            text: sanitizeDurableField(item.text, options).text ?? "",
            ...(item.layout === "report" || item.layout === "inventory"
              ? { layout: item.layout }
              : {}),
            ...(item.layout === "inventory" && item.inventory
              ? { inventory: item.inventory }
              : {}),
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "error":
        return [
          {
            ...common,
            id: item.id,
            type: "error",
            parentId: item.parentId,
            message: sanitizeDurableField(item.text, options).text ?? "",
            retryable: item.retryable !== false,
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "command":
        return [
          {
            ...common,
            id: item.id,
            type: "command",
            command: item.command,
            origin: item.origin,
            arguments: item.arguments,
            status: item.status,
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "skill-activation":
        return [
          {
            ...common,
            id: item.id,
            type: "skill-activation",
            skillId: item.skillId,
            skillName: item.skillName,
            version: item.version,
            origin: item.origin,
            arguments: item.arguments,
            provenance: {
              originClass:
                item.origin === "user"
                  ? "owner"
                  : item.origin === "model"
                    ? "agent"
                    : "system",
              sourceKind:
                item.origin === "user"
                  ? "owner-response"
                  : item.origin === "model"
                    ? "runtime-output"
                    : "app-system",
            },
          },
        ];
    }
  });
}
