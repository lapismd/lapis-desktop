// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import { approvalChoiceStatus } from "../core/approvals.ts";
import type { AiChatItem } from "../chat/chat-items.ts";
import type { TranscriptEntry } from "./types.ts";
import { isCommentReceipt } from "./comment-receipt.ts";

export function projectTranscriptToChatItems(
  entries: TranscriptEntry[],
): AiChatItem[] {
  const items: AiChatItem[] = [];
  const approvals = new Map<string, number>();
  const questions = new Map<string, number>();
  const delivered = new Set(
    entries.filter(isCommentReceipt).map((entry) => entry.parentId),
  );
  for (const entry of entries) {
    if (isCommentReceipt(entry)) continue;
    switch (entry.type) {
      case "message":
        items.push({
          id: entry.id,
          type: "message",
          role: entry.role,
          text: entry.text,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
          ...(entry.contextBlocks?.length
            ? {
                contextBlocks: structuredClone(entry.contextBlocks),
                contextDelivery: delivered.has(entry.id)
                  ? ("sent" as const)
                  : ("prepared" as const),
              }
            : {}),
        });
        break;
      case "thinking.summary":
        items.push({
          id: entry.id,
          type: "thinking",
          text: entry.text,
          kind: entry.kind,
          state: "done",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "tool":
        items.push({
          id: entry.id,
          type: "tool",
          toolId: entry.toolId,
          name: entry.name,
          server: entry.server,
          state: entry.state === "cancelled" ? "error" : entry.state,
          input: entry.input,
          output: entry.output,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "approval.request":
        approvals.set(entry.requestId, items.length);
        items.push({
          id: entry.id.replace(/:request$/u, ""),
          type: "approval",
          request: {
            id: entry.requestId,
            kind: entry.kind,
            title: entry.title,
            tool: entry.tool,
            options: structuredClone(entry.options),
          },
          status: "pending",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "approval.response": {
        const index = approvals.get(entry.requestId);
        if (index !== undefined) {
          const current = items[index];
          if (current?.type === "approval") {
            items[index] = {
              ...current,
              status: approvalChoiceStatus(
                current.request.options.find(
                  (option) => option.id === entry.option.id,
                ),
              ),
              responseOptionId: entry.option.id,
            };
          }
        }
        break;
      }
      case "question.request":
        questions.set(entry.requestId, items.length);
        items.push({
          id: entry.id.replace(/:request$/u, ""),
          type: "question",
          request: {
            id: entry.requestId,
            title: entry.title,
            questions: structuredClone(entry.questions),
          },
          status: "pending",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "question.response": {
        const index = questions.get(entry.requestId);
        if (index !== undefined) {
          const current = items[index];
          if (current?.type === "question") {
            items[index] = { ...current, status: entry.status };
          }
        }
        break;
      }
      case "system.notice":
        items.push({
          id: entry.id,
          type: "status",
          text: entry.text,
          ...(entry.layout === "report" || entry.layout === "inventory"
            ? { layout: entry.layout }
            : {}),
          ...(entry.layout === "inventory" && entry.inventory
            ? { inventory: entry.inventory }
            : {}),
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "error":
        items.push({
          id: entry.id,
          type: "error",
          text: entry.message,
          retryable: entry.retryable,
          parentId: entry.parentId,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "command":
        items.push({
          id: entry.id,
          type: "command",
          command: entry.command,
          origin: entry.origin,
          arguments: entry.arguments,
          status: entry.status,
          text: `/${entry.command}${entry.arguments ? ` ${entry.arguments}` : ""}`,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "skill-activation":
        items.push({
          id: entry.id,
          type: "skill-activation",
          skillId: entry.skillId,
          skillName: entry.skillName,
          version: entry.version,
          origin: entry.origin,
          arguments: entry.arguments,
          text: `Skill ${entry.skillName} (${entry.version})`,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "agent.switch":
      case "agent.config":
        break;
      case "cancelled": {
        if (entry.interactionType === "approval" && entry.requestId) {
          const index = approvals.get(entry.requestId);
          if (index !== undefined) {
            const current = items[index];
            if (current?.type === "approval") {
              items[index] = { ...current, status: "cancelled" };
            }
          }
        }
        if (entry.interactionType === "question" && entry.requestId) {
          const index = questions.get(entry.requestId);
          if (index !== undefined) {
            const current = items[index];
            if (current?.type === "question") {
              items[index] = { ...current, status: "cancelled" };
            }
          }
        }
        break;
      }
    }
  }
  return items;
}
