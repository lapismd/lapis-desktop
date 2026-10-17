// SPDX-License-Identifier: Apache-2.0
import type { AiChatItem } from "./chat-items.ts";
export type AiChatToolItem = Extract<AiChatItem, { type: "tool" }>;
export function toolCallStatus(
  state: AiChatToolItem["state"],
): "complete" | "error" | "running" {
  if (state === "completed") return "complete";
  if (state === "error") return "error";
  return "running";
}
