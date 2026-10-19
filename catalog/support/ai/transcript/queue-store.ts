import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import type {
  ConversationMetadata,
  ConversationLocation,
} from "../../../../src/lib/ai/conversations/types.ts";
export class QueueFailureStore extends MemoryTranscriptStore {
  override async writeMetadata(
    l: ConversationLocation,
    m: ConversationMetadata,
  ) {
    if (m.queuedMessages?.length)
      throw new Error("Fixture queue storage unavailable");
    return super.writeMetadata(l, m);
  }
}

import { savedRecipientSnapshot } from "./saved-recipients.ts";
import { captureQueuedMessage } from "../../../../src/lib/ai/chat/controller/queue-capture.ts";
export function recordedReviewStore(scenario: string) {
  if (
    ![
      "addressed",
      "addressed-approval",
      "participant-settings",
      "participant-settings-failure",
      "queue-failure",
      "queue-restored",
      "queue-crashed",
    ].includes(scenario)
  )
    return;
  const snapshot = savedRecipientSnapshot();
  if (scenario === "queue-restored" || scenario === "queue-crashed")
    snapshot.metadata.queuedMessages = [
      captureQueuedMessage("A saved follow-up waits for explicit resume", {
        agent: "codex",
        metadata: { runtime: "acp" },
      }),
    ];
  if (scenario === "queue-crashed") {
    snapshot.transcript = snapshot.transcript.slice(0, 1);
    snapshot.metadata.pendingTurn = {
      version: 1,
      id: "crashed-before-terminal",
      userEntryId: snapshot.transcript[0]!.id,
      agentBindingId: "unconfirmed-binding",
      startedAt: snapshot.metadata.createdAt,
    };
  }
  return new (
    scenario === "queue-failure" ? QueueFailureStore : MemoryTranscriptStore
  )([snapshot]);
}
