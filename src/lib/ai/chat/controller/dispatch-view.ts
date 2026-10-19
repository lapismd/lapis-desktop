import type { AiChatController } from "../chat-controller.svelte.ts";
import type {
  ConversationLocation,
  ConversationSnapshot,
} from "../../conversations/types.ts";
import { projectTranscriptToChatItems } from "../../conversations/transcript-to-chat.ts";
export async function refreshDispatchItems(
  controller: AiChatController,
  location: ConversationLocation,
) {
  const snapshot = await controller.repository!.read(location);
  if (
    controller.location?.conversationId !== location.conversationId ||
    controller.location.scopeDir !== location.scopeDir
  )
    return;
  const messages = new Map(
    projectTranscriptToChatItems(snapshot.transcript)
      .filter((e) => e.type === "message")
      .map((e) => [e.id, e]),
  );
  controller.items = controller.items.map((item) =>
    item.type === "message" && item.role === "user"
      ? {
          ...item,
          deliveries:
            messages.get(item.id)?.type === "message"
              ? (
                  messages.get(item.id) as Extract<
                    typeof item,
                    { type: "message" }
                  >
                ).deliveries
              : undefined,
        }
      : item,
  );
}
export function restoreDispatch(
  controller: AiChatController,
  snapshot: ConversationSnapshot,
): boolean {
  controller._recoveredDispatchId = undefined;
  if (!controller.repository) return false;
  if (!snapshot.metadata.pendingDispatch) {
    controller.items = controller.items.map((item) =>
      item.type === "message" && item.deliveries
        ? {
            ...item,
            deliveries: item.deliveries.map((d) => ({
              ...d,
              state:
                d.state === "pending"
                  ? "not_sent"
                  : d.state === "started"
                    ? "unknown"
                    : d.state,
            })),
          }
        : item,
    );
    return snapshot.transcript.some((entry) => entry.type === "agent.delivery");
  }
  const recovered = controller.repository.dispatches.recovery(snapshot);
  if (recovered) {
    controller._recoveredDispatchId = recovered.id;
    controller.items = controller.items.map((item) =>
      item.type === "message" && item.id === recovered.userEntryId
        ? {
            ...item,
            deliveries: recovered.deliveries.map((d) => ({
              ...d,
              state:
                d.state === "pending"
                  ? "not_sent"
                  : d.state === "started"
                    ? "unknown"
                    : d.state,
            })),
          }
        : item,
    );
  }
  return true;
}
