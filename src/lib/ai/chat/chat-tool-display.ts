// SPDX-License-Identifier: Apache-2.0
import type { AiChatItem } from "./chat-items.ts";
export type AiChatToolItem = Extract<AiChatItem, { type: "tool" }>;
/** Owned dispatch identity survives saved transcript projection. Names alone do not identify local commands. */
export function isLocalCommandTool(item: AiChatToolItem): boolean {
  return item.toolId.startsWith("slash-tool-");
}
export function toolCallStatus(
  state: AiChatToolItem["state"],
): "complete" | "error" | "running" | "unknown" {
  if (state === "completed") return "complete";
  if (state === "error") return "error";
  if (state === "unknown") return "unknown";
  return "running";
}
