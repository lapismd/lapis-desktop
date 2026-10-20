// SPDX-License-Identifier: Apache-2.0
import type { TranscriptCommentThread } from "@lapismd/design-core/chat";
import type { ConversationLocation } from "../../conversations/types.ts";
/** Composition state shared by the two transcript presentations. */
export class ComposerDraftState {
  draft = $state("");
  draftKey = $state("");
  draftReady = $state(true);
  draftOriginKey = "";
  draftThreads = $state<TranscriptCommentThread[]>([]);
  adoptDraft = (_location: ConversationLocation) => {};
  matchesDraft(key: string) {
    return this.draftKey === key || this.draftOriginKey === key;
  }
}
