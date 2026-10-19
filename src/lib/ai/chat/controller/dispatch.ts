import { projectTranscriptToChatItems } from "../../conversations/transcript-to-chat.ts";
import type { QueuedMessage } from "../../conversations/queued-message.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import type { SavedAgentRecipient } from "../../conversations/recipients.ts";
import { validateRecipients } from "../../conversations/recipients.ts";
import type {
  DispatchIntent,
  DeliveryState,
} from "../../conversations/dispatch-intent.ts";
import { projectChatItemsToTranscript } from "../../conversations/chat-to-transcript.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatItem } from "../chat-items.ts";
import { deliverTurn } from "./turn-delivery.ts";
import { publishCommentContext } from "./comment-publication.ts";
import { refreshDispatchItems } from "./dispatch-view.ts";

export async function submitAudience(
  this: AiChatController,
  prompt: string,
  request: Omit<AgentRequest, "prompt">,
  recipients: SavedAgentRecipient[],
  queued?: { message: QueuedMessage; owner: string },
) {
  if (
    this.busy ||
    this._activeDispatch ||
    (!prompt.trim() && !request.contextBlocks?.length)
  )
    return false;
  if (!this.repository)
    throw new Error("Addressed delivery requires local transcript persistence");
  const targets = request.deliveryTargets;
  if (
    !targets ||
    targets.length !== recipients.length ||
    targets.some(
      (t, i) =>
        JSON.stringify(validateRecipients([t.recipient])[0]) !==
          JSON.stringify(recipients[i]) ||
        typeof t.request.agent !== "string" ||
        !t.request.agent,
    )
  )
    throw new Error(
      "Multiple-recipient delivery requires current admitted targets for every recipient before Send",
    );
  const captured = structuredClone({ request, targets, recipients });
  const turnId = ++this._turnId;
  this.busy = true;
  this.error = null;
  let accepted = false;
  let active: NonNullable<AiChatController["_activeDispatch"]> | undefined;
  try {
    await this._syncSlashCatalog();
    if (this._isAbandoned(turnId)) return false;
    const resolution = this._slashRouter?.resolve(
      prompt,
      this._activeBindingId,
    );
    if (resolution?.kind === "command" || resolution?.kind === "unknown")
      throw new Error("Send application commands to one agent at a time");
    const text = (
      resolution?.kind === "literal" ? resolution.text : prompt
    ).trim();
    const user: AiChatItem = queued
      ? projectTranscriptToChatItems([queued.message.user])[0]!
      : {
          id: `user-${crypto.randomUUID()}`,
          type: "message",
          role: "user",
          text,
          recipients: captured.recipients,
          createdAt: new Date().toISOString(),
          ...(captured.request.contextBlocks?.length
            ? { contextBlocks: captured.request.contextBlocks }
            : {}),
        };
    await this._ensureConversation();
    if (this._isAbandoned(turnId) || !this.location) return false;
    const entry =
      queued?.message.user ?? projectChatItemsToTranscript([user])[0];
    if (!entry || entry.type !== "message")
      throw new Error("An addressed turn requires its authored message");
    const intent: DispatchIntent = {
      version: 1,
      id: crypto.randomUUID(),
      userEntryId: user.id,
      startedAt: user.createdAt!,
      deliveries: captured.recipients.map((recipient) => ({
        id: crypto.randomUUID(),
        recipient,
        state: "pending",
      })),
    };
    const location = { ...this.location };
    await this.repository.dispatches.begin(
      location,
      entry,
      intent,
      this._recoveredDispatchId,
      this._recoveredTurn?.id,
      queued ? { id: queued.message.id, owner: queued.owner } : undefined,
    );
    if (
      this._isAbandoned(turnId) ||
      this.location?.conversationId !== location.conversationId ||
      this.location.scopeDir !== location.scopeDir
    ) {
      await this.repository.dispatches.abandon(
        location,
        intent.id,
        "cancelled",
      );
      return false;
    }
    this.publication.prepared();
    this._recoveredDispatchId = undefined;
    this._recoveredTurn = undefined;
    active = { intent, location, cancelled: false };
    this._activeDispatch = active;
    this.items = [...this.items, user];
    if (queued) await this.queuedMessages.refresh(location);
    await refreshDispatchItems(this, active.location);
    for (let i = 0; i < captured.targets.length; i++) {
      if (active.cancelled || this._isAbandoned(turnId)) break;
      const target = captured.targets[i]!,
        delivery = intent.deliveries[i]!;
      let resolve!: (state: DeliveryState) => void;
      const settled = new Promise<DeliveryState>((r) => {
        resolve = r;
      });
      active.done = resolve;
      const sent = await deliverTurn.call(
        this,
        user,
        text,
        {
          ...captured.request,
          ...target.request,
          recipients: [target.recipient],
          deliveryTargets: undefined,
        },
        turnId,
        {
          dispatchId: intent.id,
          deliveryId: delivery.id,
          user: entry,
          done: resolve,
        },
      );
      if (active.cancelled || this._isAbandoned(turnId)) break;
      const current = (await this.repository.read(active.location)).metadata
        .pendingDispatch?.deliveries[i];
      if (sent !== true || current?.state === "pending") {
        if (current?.state === "pending" || current?.state === "started")
          await this.repository.dispatches.finish(
            active.location,
            intent.id,
            delivery.id,
            current.state === "pending" ? "not_sent" : "unknown",
          );
        break;
      }
      const state = await settled;
      if (state !== "completed") break;
    }
    if (!active.cancelled)
      await this.repository.dispatches.abandon(
        active.location,
        intent.id,
        "not_sent",
      );
    await refreshDispatchItems(this, active.location);
    const completed = this.items.find((e) => e.id === user.id);
    accepted =
      completed?.type === "message" &&
      completed.deliveries?.every((d) => d.state === "completed") === true;
    if (accepted && !this._isAbandoned(turnId))
      await publishCommentContext(this, user, turnId);
    if (!accepted && !active.cancelled)
      this.error ??=
        "Some addressed deliveries did not complete. Review their saved outcomes before sending a new message.";
    return accepted;
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error);
    if (active)
      await this.repository.dispatches
        .abandon(active.location, active.intent.id, "not_sent")
        .catch(() => undefined);
    return false;
  } finally {
    if (this._activeDispatch === active) this._activeDispatch = undefined;
    if (this._turnId === turnId) this.busy = false;
    this.queuedMessages.afterTerminal(accepted);
  }
}
export async function cancelDispatch(controller: AiChatController) {
  const active = controller._activeDispatch;
  if (!active) return;
  active.cancelled = true;
  try {
    await controller.repository?.dispatches.abandon(
      active.location,
      active.intent.id,
      "cancelled",
    );
    await refreshDispatchItems(controller, active.location);
  } finally {
    active.done?.("unknown");
  }
}
