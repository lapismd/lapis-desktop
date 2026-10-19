import type { AgentRequest } from "../../core/runtime.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatItem } from "../chat-items.ts";
import { validateRecipients } from "../../conversations/recipients.ts";
import { deliverTurn } from "./turn-delivery.ts";
import { submitAudience } from "./dispatch.ts";
export async function submit(
  this: AiChatController,
  prompt: string,
  request: Omit<AgentRequest, "prompt"> = {},
): Promise<boolean | undefined> {
  if (this._activeDispatch) return false;
  const recipients = validateRecipients(request.recipients);
  if (request.recipients) request = { ...request, recipients };
  if (recipients.length > 1)
    return submitAudience.call(this, prompt, request, recipients);
  try {
    await this._syncSlashCatalog();
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error);
    this.items = [
      ...this.items,
      {
        id: `error-${crypto.randomUUID()}`,
        type: "error",
        text: this.error,
        createdAt: new Date().toISOString(),
      },
    ];
    return;
  }
  const resolution = this._slashRouter?.resolve(prompt, this._activeBindingId);
  if (resolution?.kind === "unknown" || resolution?.kind === "command") {
    await this._executeSlash(resolution, {
      ...this.request,
      ...request,
      metadata: { ...this.request.metadata, ...request.metadata },
    });
    return;
  }
  const text =
    resolution?.kind === "literal" ? resolution.text.trim() : prompt.trim();
  if ((!text && !request.contextBlocks?.length) || this.busy) return;
  this.error = null;
  const userItem: AiChatItem = {
    id: this.repository
      ? `user-${crypto.randomUUID()}`
      : `user-${this.items.length + 1}`,
    type: "message",
    role: "user",
    text,
    ...(recipients.length ? { recipients } : {}),
    ...(request.contextBlocks?.length
      ? { contextBlocks: structuredClone(request.contextBlocks) }
      : {}),
    createdAt: new Date().toISOString(),
  };
  this.items = [...this.items, userItem];
  this.busy = true;
  const turnId = ++this._turnId;
  return deliverTurn.call(this, userItem, text, request, turnId);
}

export function waitForNextTask(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}
