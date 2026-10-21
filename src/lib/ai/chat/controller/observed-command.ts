import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AgentRequest } from "../../core/runtime.ts";
/** Explicit file tools and provider commands share the ordinary capture owner. */
export async function observedCommand(
  controller: AiChatController,
  request: Omit<AgentRequest, "prompt">,
  message: string,
  turnId: number,
  work: () => Promise<void>,
) {
  const observation = await controller.fileHistory.begin(
    controller.location,
    message,
    request,
  );
  let complete = false;
  try {
    if (controller._isAbandoned(turnId)) return;
    await work();
    complete = !controller._isAbandoned(turnId) && !controller.error;
  } finally {
    if (observation) {
      const session = controller.session;
      if (session) {
        try {
          await controller.fileHistory.attach(
            session,
            observation,
            controller.activeBindingId,
          );
        } catch (error) {
          complete = false;
          controller.fileHistory.report(error);
        }
        if (!complete) {
          await controller._closeAppToolBinding(controller.activeBindingId);
          await session.close().catch(() => {});
          if (controller.session === session) controller.session = null;
        }
      }
      await controller.fileHistory.finishObservation(
        observation,
        complete ? "completed" : "unknown",
      );
    }
  }
}
