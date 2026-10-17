// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import { sha256ConversationText } from "../conversations/hashes.ts";

export async function deterministicMemoryId(
  namespace: string,
  ...parts: string[]
): Promise<string> {
  return `${namespace}-${(await sha256ConversationText(parts.join("\u0000"))).slice(0, 32)}`;
}
