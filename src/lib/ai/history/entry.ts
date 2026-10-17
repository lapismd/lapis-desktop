// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI History; see ../NOTICE.md.
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import type { ConversationLocation } from "../conversations/types.ts";
export function entryKey(entry: ConversationListEntry): string {
  return `${entry.location.scopeDir}\u0000${entry.location.conversationId}`;
}

export function sameLocation(
  left: ConversationLocation | null,
  right: ConversationLocation,
): boolean {
  return (
    left?.scopeDir === right.scopeDir &&
    left.conversationId === right.conversationId
  );
}
