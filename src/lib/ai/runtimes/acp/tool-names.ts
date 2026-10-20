// SPDX-License-Identifier: Apache-2.0
import type { AgentEvent } from "../../core/events.ts";
import {
  isGenericToolName,
  toolNameFromInput,
} from "../../chat/chat-tool-identity.ts";
/** Retain the original bounded permission-card title projection. */
export function rememberToolName(
  names: Map<string, string>,
  event: AgentEvent,
) {
  if (event.type !== "tool.start" && event.type !== "tool.end") return;
  const title = event.title ?? toolNameFromInput(event.input);
  if (!title || isGenericToolName(title)) return;
  if (!names.has(event.id) && names.size >= 256)
    names.delete(names.keys().next().value!);
  names.set(event.id, title.slice(0, 1024));
}
