import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AgentRuntime } from "../../core/runtime.ts";
import type { EffectiveAgentBinding } from "../../conversations/binding-state.ts";
import type { ActiveDelivery } from "./dispatch-state.ts";
import type { AiChatItem } from "../chat-items.ts";
import { knownTurnError, finishTurn } from "./turn-checkpoint.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";
export async function handleTurnFailure(
  controller: AiChatController,
  error: unknown,
  previous: {
    previousRuntime: AgentRuntime;
    previousBinding?: EffectiveAgentBinding;
    previousBindingId?: string;
    previousSessionRequest: AiChatController["_sessionRequest"];
    userItem: AiChatItem;
    dispatch?: ActiveDelivery;
  },
) {
  const {
    previousRuntime,
    previousBinding,
    previousBindingId,
    previousSessionRequest,
    userItem,
    dispatch,
  } = previous;
  const failedSession = controller.session;
  const failedBindingId = controller._activeBindingId;
  const failedContext = failedSession
    ? controller._sessionContexts.get(failedSession)
    : undefined;
  if (failedContext?.turn) {
    failedContext.turn.known = knownTurnError(error);
    failedContext.turn.outcome = failedContext.turn.known
      ? "rejected"
      : "unknown";
  }
  if (
    failedContext?.pendingBinding ||
    failedContext?.pendingSwitch ||
    failedContext?.pendingConfiguration
  ) {
    controller.runtime = previousRuntime;
    controller._activeBinding = previousBinding;
    controller._activeBindingId = previousBindingId;
    controller._sessionRequest = previousSessionRequest;
    controller.bindings = controller.bindings.filter(
      (binding) => binding.id !== failedContext.pendingBinding?.id,
    );
    if (failedContext.pendingConfiguration) {
      controller.bindings = controller.bindings.map((binding) =>
        binding.id === failedContext.pendingConfiguration?.previous.id
          ? failedContext.pendingConfiguration.previous
          : binding,
      );
    }
  }
  controller.error = error instanceof Error ? error.message : String(error);
  controller.items = applyAgentEventToChatItems(controller.items, {
    type: "error",
    error: error instanceof Error ? error : new Error(String(error)),
  });
  if (
    (failedContext?.turn && !knownTurnError(error)) ||
    (error instanceof Error &&
      "outcome" in error &&
      error.outcome === "unknown")
  )
    controller.items = controller.items.map((item, index) =>
      index === controller.items.length - 1 && item.type === "error"
        ? { ...item, retryable: false }
        : item,
    );
  controller.session = null;
  controller.busy = false;
  await controller._closeAppToolBinding(failedBindingId);
  await failedSession?.close().catch(() => undefined);
  try {
    if (controller.repository) await controller._ensureConversation();
    if (controller.repository && controller.location) {
      await controller._appendDurableItems(
        controller.location,
        [...(dispatch ? [] : [userItem]), controller.items.at(-1)!],
        controller._activeBindingId,
      );
    } else {
      await controller._persist();
    }
    if (failedSession && failedContext?.turn) {
      await finishTurn(controller, failedSession);
    }
  } catch (persistError) {
    const persistMessage =
      persistError instanceof Error
        ? persistError.message
        : String(persistError);
    controller.error = `${controller.error} Could not save this turn: ${persistMessage}`;
  }
}
