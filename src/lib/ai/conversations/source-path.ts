// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import { CONVERSATION_ID_PATTERN, type ConversationLocation } from "./types.ts";
export function conversationLocationFromSourcePath(
  path: string,
): ConversationLocation | null {
  const match = path.match(
    /^(?:(.*)\/)?\.lapis\/agents\/sessions\/([^/]+)(?:\/|$)/u,
  );
  const conversationId = match?.[2];
  if (!conversationId || !CONVERSATION_ID_PATTERN.test(conversationId))
    return null;
  return { scopeDir: match?.[1] ?? "", conversationId };
}
