import type { AgentEvent } from "../../core/events.ts";
import type { AiChatItem } from "../chat-items.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";

/** Coalesces presentation only. Ordered capture remains the event owner's job. */
export class StreamingChatTrace {
  #events: { event: AgentEvent; receivedAt: string }[] = [];
  #characters = 0;
  #timer?: ReturnType<typeof setTimeout>;
  constructor(
    private readonly read: () => AiChatItem[],
    private readonly publish: (items: AiChatItem[]) => void,
    private readonly active: () => boolean,
  ) {}

  receive(event: AgentEvent): void {
    if (!this.active()) return;
    const receivedAt = new Date().toISOString();
    if (event.type !== "text" && event.type !== "thinking") {
      this.flush();
      this.publish(
        applyAgentEventToChatItems(this.read(), event, () => receivedAt),
      );
      return;
    }
    if (this.#characters + event.text.length > 16_384) this.flush();
    if (event.text.length > 16_384) {
      this.publish(
        applyAgentEventToChatItems(this.read(), event, () => receivedAt),
      );
      return;
    }
    this.#events.push({ event, receivedAt });
    this.#characters += event.text.length;
    if (this.#events.length === 32) this.flush();
    else this.#timer ??= setTimeout(() => this.flush(), 32);
  }

  flush(): void {
    const pending = this.#events;
    this.clear();
    if (!pending.length || !this.active()) return;
    let items = this.read();
    for (const { event, receivedAt } of pending)
      items = applyAgentEventToChatItems(items, event, () => receivedAt);
    this.publish(items);
  }

  clear(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#events = [];
    this.#characters = 0;
  }
}
