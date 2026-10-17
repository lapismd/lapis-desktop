// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI History; see ../NOTICE.md.
import type { App } from "@lapis-notes/api";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
export type AiHistoryProps = {
  app: App;
  repository: ConversationRepository;
  getScope: () => string;
  getActiveConversation: () => ConversationLocation | null;
  onOpenConversation: (location: ConversationLocation) => void | Promise<void>;
  onNewConversation: (scopeDir: string) => void | Promise<void>;
  listConversationFolders: () => string[];
  searchAllConversations: (query: string) => Promise<ConversationListEntry[]>;
};
