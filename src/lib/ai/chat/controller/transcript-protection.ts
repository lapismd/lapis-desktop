// SPDX-License-Identifier: Apache-2.0
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { TranscriptParticipant } from "../../conversations/transcript-protection.ts";
export function protectChatTranscript(
  controller: AiChatController,
): TranscriptParticipant {
  return {
    async protect() {
      controller._filesProtected++;
      const release = () => {
        controller._filesProtected--;
      };
      try {
        if (
          controller.busy ||
          controller.commandWorking ||
          controller.publication.inFlight ||
          controller._activeDispatch ||
          controller._recoveredTurn ||
          controller._recoveredDispatchId ||
          controller.queuedMessages.running ||
          controller.queuedMessages.saving ||
          controller.queuedMessages.resuming ||
          [...controller._sessionContexts.values()].some(
            (c) => c.turn || c.pendingBinding || c.pendingConfiguration,
          )
        )
          throw new Error("Conversation has an active or unsettled turn");
        controller.queuedMessages.pause();
        await controller._persistQueue;
        await controller._terminalCheckpoint;
        return release;
      } catch (error) {
        release();
        throw error;
      }
    },
    async reload() {
      if (controller._disposed) return;
      controller.queuedMessages.pause();
      await controller._closeAppToolBinding();
      const session = controller.session;
      controller.session = null;
      await session?.close();
      controller._turnId++;
      try {
        await controller._restoreConversation(false);
      } catch (error) {
        controller._releaseUnreadableLocation(error);
        throw error;
      }
    },
  };
}
