import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatItem } from "../chat-items.ts";
import { persistableCommentContexts } from "../../conversations/comment-context.ts";
import { commentReceipt } from "../../conversations/comment-receipt.ts";

/** Execution acknowledgement and saved context are independent from prepared intent. */
export async function publishCommentContext(
  controller: AiChatController,
  user: AiChatItem,
  turnId: number,
): Promise<void> {
  if (!persistableCommentContexts(user.contextBlocks).length) return;
  const location = controller.location ? { ...controller.location } : null;
  await controller._backgroundWork.run(async () => {
    if (controller._isAbandoned(turnId)) return;
    if (controller.repository && location) {
      try {
        await controller.repository.appendTranscript(location, [
          commentReceipt(user.id, controller._activeBindingId),
        ]);
      } catch (cause) {
        throw Object.assign(
          new Error(
            "The agent finished, but its comment acknowledgement could not be saved. This turn must not be replayed.",
            { cause },
          ),
          { outcome: "unknown" },
        );
      }
    }
    if (!controller._isAbandoned(turnId))
      controller.items = controller.items.map((item) =>
        item.id === user.id ? { ...item, contextDelivery: "sent" } : item,
      );
  });
}
