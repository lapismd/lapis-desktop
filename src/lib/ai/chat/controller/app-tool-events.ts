import type { AppToolBridgeEvent } from "../../tools/app-tool-bridge.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";
import { eventIdentity } from "./event-identity.ts";

export async function _consumeAppToolEvent(
  this: AiChatController,
  { bindingId, event }: AppToolBridgeEvent,
): Promise<void> {
  if (
    bindingId !== this._activeBindingId &&
    !this.bindings.some((binding) => binding.id === bindingId)
  ) {
    return;
  }
  if (this.session) this._flushSessionTrace.get(this.session)?.();
  this.items = applyAgentEventToChatItems(
    this.items,
    event,
    undefined,
    eventIdentity(this.repository ? bindingId : undefined),
  ).map((item) =>
    item.agentBindingId ? item : { ...item, agentBindingId: bindingId },
  );
  const item = this.items.find((candidate) =>
    event.type === "permission.request"
      ? candidate.type === "approval" &&
        candidate.request.id === event.request.id
      : (event.type === "tool.start" || event.type === "tool.end") &&
        candidate.type === "tool" &&
        candidate.toolId === event.id,
  );
  if (this.repository && this.location && item) {
    await this._appendDurableItems(this.location, [item], bindingId);
  } else if (!this.repository) {
    await this._persist(false, bindingId);
  }
}
