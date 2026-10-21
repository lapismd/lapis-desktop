import { refreshDispatchItems } from "./dispatch-view.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatItem } from "../chat-items.ts";
import type { AgentSession } from "../../core/runtime.ts";
import { projectChatItemsToTranscript } from "../../conversations/chat-to-transcript.ts";
import { projectTranscriptToChatItems } from "../../conversations/transcript-to-chat.ts";
import {
  unknownTurnEntry,
  hasUnknownTurnEntry,
} from "../../conversations/turn-intent.ts";

export async function prepareTurn(
  controller: AiChatController,
  session: AgentSession,
  user: AiChatItem,
): Promise<void> {
  const turnId = controller._turnId;
  await controller._backgroundWork.run(async () => {
    if (controller._isAbandoned(turnId))
      throw new DOMException("Turn preparation was cancelled", "AbortError");
    const context = controller._sessionContexts.get(session);
    if (!controller.repository) return;
    if (!context?.location || !controller._activeBindingId)
      throw new Error("The agent no longer owns this conversation turn");
    const entry =
      context.delivery?.user ??
      projectChatItemsToTranscript([user], {
        agentBindingId: controller._activeBindingId,
      })[0];
    if (!entry || entry.type !== "message" || entry.role !== "user")
      throw new Error("A turn requires its authored message");
    const intent = {
      version: 1 as const,
      id: context.delivery?.deliveryId ?? crypto.randomUUID(),
      userEntryId: entry.id,
      agentBindingId: controller._activeBindingId,
      startedAt: new Date().toISOString(),
    };
    if (context.delivery) {
      await controller.repository.dispatches.start(
        context.location,
        context.delivery.dispatchId,
        context.delivery.deliveryId,
        controller._activeBindingId,
      );
      await refreshDispatchItems(controller, context.location);
    } else
      await controller.repository.turns.prepare(
        context.location,
        intent,
        entry,
        controller._recoveredTurn?.id,
        controller._recoveredDispatchId,
      );
    if (
      controller._isAbandoned(turnId) ||
      controller.session !== session ||
      controller._sessionContexts.get(session) !== context
    ) {
      if (context.delivery)
        await controller.repository.dispatches.finish(
          context.location,
          context.delivery.dispatchId,
          context.delivery.deliveryId,
          "unknown",
        );
      else
        await controller.repository.turns.finish(
          context.location,
          intent.id,
          true,
        );
      throw new DOMException("Turn preparation was cancelled", "AbortError");
    }
    context.turn = { intent, known: false };
    controller.publication.prepared();
    controller._recoveredTurn = undefined;
    controller._recoveredDispatchId = undefined;
  });
}

export async function finishTurn(
  controller: AiChatController,
  session: AgentSession,
): Promise<void> {
  const context = controller._sessionContexts.get(session);
  if (!controller.repository || !context?.location || !context.turn) return;
  const { intent, known } = context.turn;
  await controller.fileHistory.finish(
    session,
    controller._cancelledSessions.has(session) && known
      ? "cancelled"
      : context.turn.outcome === "completed"
        ? "completed"
        : known
          ? "failed"
          : "unknown",
  );
  if (context.delivery) {
    const delivery = context.delivery;
    const outcome = context.turn.outcome ?? (known ? "completed" : "unknown");
    try {
      await controller.repository.dispatches.finish(
        context.location,
        delivery.dispatchId,
        delivery.deliveryId,
        outcome,
      );
      await refreshDispatchItems(controller, context.location);
      delivery.done(outcome);
    } catch (error) {
      delivery.done("unknown");
      throw error;
    } finally {
      context.turn = undefined;
      context.delivery = undefined;
    }
    return;
  }
  const pending = await controller.repository.turns.finish(
    context.location,
    intent.id,
    known,
  );
  if (
    controller.location?.conversationId === context.location.conversationId &&
    controller.location.scopeDir === context.location.scopeDir
  )
    controller._recoveredTurn = pending;
  context.turn = undefined;
}

export function knownTurnError(error: unknown): boolean {
  return (
    error instanceof Error && "outcome" in error && error.outcome === "rejected"
  );
}

/** One immutable recovery notice; a lost outcome never enables Retry. */
export function retainUnknownTurn(
  controller: AiChatController,
  session: AgentSession,
  items: AiChatItem[],
): AiChatItem[] {
  const turn = controller._sessionContexts.get(session)?.turn;
  if (!turn || turn.known) return items;
  const notice = projectTranscriptToChatItems([
    unknownTurnEntry(turn.intent),
  ])[0]!;
  const retain = (current: AiChatItem[]) => {
    if (current.some((item) => item.id === notice.id)) return current;
    let lastError = current.length - 1;
    while (lastError >= 0 && current[lastError]?.type !== "error") lastError--;
    return [
      ...current.map((item, index) =>
        index === lastError && item.type === "error"
          ? { ...item, retryable: false }
          : item,
      ),
      notice,
    ];
  };
  if (controller.session === session && !controller._disposed)
    controller.items = retain(controller.items);
  return retain(items);
}

export async function restoreTurn(
  controller: AiChatController,
): Promise<boolean> {
  controller._recoveredTurn = undefined;
  if (!controller.repository || !controller.location) return false;
  const turnId = controller._turnId;
  const location = { ...controller.location };
  const snapshot = await controller.repository.read(location);
  if (
    controller._isAbandoned(turnId) ||
    controller.location?.conversationId !== location.conversationId ||
    controller.location.scopeDir !== location.scopeDir
  )
    return true;
  const intent = snapshot.metadata.pendingTurn;
  if (!intent) return false;
  const recovered = controller.repository.turns.recovery(snapshot);
  if (recovered) {
    controller._recoveredTurn = recovered;
    const notice = unknownTurnEntry(intent);
    if (
      !hasUnknownTurnEntry(snapshot, intent) &&
      !controller.items.some((item) => item.id === notice.id)
    )
      controller.items = [
        ...controller.items,
        ...projectTranscriptToChatItems([notice]),
      ];
  }
  return true; // Never resume while another view owns the turn or its outcome is unknown.
}
