import { QueueRefusedError } from "../../conversations/queued-message.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type {
  ConversationLocation,
  ConversationSnapshot,
} from "../../conversations/types.ts";
import type {
  QueuedMessage,
  QueueOutcome,
} from "../../conversations/queued-message.ts";
import { captureQueuedMessage } from "./queue-capture.ts";
import { submitAudience } from "./dispatch.ts";
import { restoreDispatch } from "./dispatch-view.ts";
import { restoreTurn } from "./turn-checkpoint.ts";
export type QueuedMessageView = {
  queued: QueuedMessage;
  state: QueueOutcome | "queued" | "working";
  pending: boolean;
};
export class QueuedMessages {
  entries = $state.raw<QueuedMessageView[]>([]);
  paused = $state(true);
  running = $state(false);
  saving = $state(false);
  resuming = $state(false);
  readonly owner = crypto.randomUUID();
  private generation = 0;
  private location?: ConversationLocation;
  private resolve?: (q: QueuedMessage) => Omit<AgentRequest, "prompt">;
  private failed: (error: unknown) => void = () => {};
  constructor(private controller: AiChatController) {}
  configure(
    resolve: (q: QueuedMessage) => Omit<AgentRequest, "prompt">,
    failed: (e: unknown) => void,
  ) {
    this.resolve = resolve;
    this.failed = failed;
  }
  get pending() {
    return this.entries.filter((e) => e.pending);
  }
  private matches(l: ConversationLocation) {
    return (
      this.controller.location?.conversationId === l.conversationId &&
      this.controller.location.scopeDir === l.scopeDir
    );
  }
  pause(uncertain = false) {
    this.paused = true;
    if (uncertain)
      this.entries = this.entries.map((e) =>
        e.pending && e.state === "working" ? { ...e, state: "unknown" } : e,
      );
    this.generation++;
    if (this.location)
      this.controller.repository?.messages.release(this.location, this.owner);
  }
  restore(s: ConversationSnapshot) {
    this.pause();
    this.location = { ...s.location };
    this.project(s);
  }
  private project(s: ConversationSnapshot) {
    const receipts = s.transcript
      .filter((e) => e.type === "queue.outcome")
      .map((e) => ({ queued: e.queued, state: e.outcome, pending: false }));
    const pending = (s.metadata.queuedMessages ?? [])
      .filter((q) => !receipts.some((e) => e.queued.id === q.id))
      .map((q) => ({
        queued: q,
        pending: true,
        state:
          this.controller.repository!.messages.outcome(s, q) ??
          ("queued" as const),
      }));
    this.entries = [...receipts.slice(-16), ...pending];
  }
  async refresh(l = this.location) {
    if (!l || !this.controller.repository || !this.matches(l)) return;
    this.project(await this.controller.repository.read(l));
  }
  async enqueue(prompt: string, request: Omit<AgentRequest, "prompt">) {
    if (this.saving || this.controller._disposed)
      throw new Error("A queued message is already being saved");
    if (!this.controller.repository)
      throw new Error("Queueing requires local conversation files");
    let queued: QueuedMessage;
    try {
      queued = captureQueuedMessage(prompt, structuredClone(request));
    } catch (e) {
      throw new QueueRefusedError(e instanceof Error ? e.message : String(e));
    }
    if (
      this.controller.busy &&
      !this.controller._activeDispatch &&
      !this.controller._sessionContexts.get(this.controller.session!)?.turn
    )
      throw new Error(
        "Wait for the active message to finish preparation before queueing",
      );
    this.saving = true;
    const turn = this.controller._turnId,
      generation = this.generation;
    try {
      if (!this.controller.location)
        await this.controller._ensureConversation();
      const l = this.controller.location;
      if (!l || this.controller._isAbandoned(turn)) return false;
      const previous = this.pending.length;
      this.location = { ...l };
      await this.controller.repository.messages.enqueue(l, queued, this.owner);
      if (!this.matches(l) || this.controller._disposed) {
        this.controller.repository.messages.release(l, this.owner);
        return false;
      }
      if (
        !previous &&
        (this.controller.busy || this.controller.publication.inFlight) &&
        generation === this.generation
      )
        this.paused = false;
      if (this.paused)
        this.controller.repository.messages.release(l, this.owner);
      await this.refresh(l);
      this.kick();
      return true;
    } finally {
      this.saving = false;
    }
  }
  afterTerminal(success: boolean) {
    if (!success) {
      if (!this.paused) this.pause(true);
    } else this.kick();
  }
  async cancel(id: string) {
    const l = this.controller.location;
    if (!l || !this.controller.repository) return;
    await this.controller.repository.messages.cancel(l, id);
    await this.refresh(l);
  }
  async resume() {
    if (
      this.controller.busy ||
      this.running ||
      this.resuming ||
      this.controller._disposed
    )
      return;
    const c = this.controller,
      l = c.location;
    if (!l || !c.repository || !this.resolve) return;
    const generation = this.generation;
    this.resuming = true;
    try {
      await c.publication.whenSettled();
      await c._terminalCheckpoint;
      if (c.session && c._cancelledSessions.has(c.session)) {
        const session = c.session;
        c.session = null;
        await c._closeAppToolBinding(c._activeBindingId);
        await c._detachSession(session);
        await c._sessionConsumers.get(session);
      }
    } finally {
      this.resuming = false;
    }
    if (generation !== this.generation || c._disposed || !this.matches(l))
      return;
    await c.repository.messages.acquire(l, this.owner);
    if (generation !== this.generation || c._disposed || !this.matches(l)) {
      c.repository.messages.release(l, this.owner);
      return;
    }
    this.location = { ...l };
    try {
      let s = await c.repository.read(l);
      for (const q of s.metadata.queuedMessages ?? [])
        if (q.state === "dispatching")
          await c.repository.messages.settle(l, q.id);
      s = await c.repository.read(l);
      restoreDispatch(c, s);
      await restoreTurn(c);
      if (!this.matches(l) || c._disposed || generation !== this.generation) {
        c.repository.messages.release(l, this.owner);
        return;
      }
      this.paused = false;
      this.generation++;
      await this.refresh(l);
      this.kick();
    } catch (e) {
      this.pause();
      throw e;
    }
  }
  kick() {
    if (
      this.paused ||
      this.running ||
      this.controller.busy ||
      this.controller._disposed ||
      !this.location ||
      !this.resolve
    )
      return;
    this.running = true;
    const generation = this.generation,
      l = { ...this.location };
    const operation = this.controller._backgroundWork.run(async () => {
      await this.controller._terminalCheckpoint;
      await this.controller.publication.whenSettled();
      while (
        !this.paused &&
        !this.controller._disposed &&
        generation === this.generation &&
        this.matches(l)
      ) {
        const s = await this.controller.repository!.read(l),
          q = s.metadata.queuedMessages?.[0];
        if (
          !q ||
          this.paused ||
          this.controller._disposed ||
          generation !== this.generation ||
          !this.matches(l)
        )
          break;
        if (q.state !== "queued") {
          this.pause();
          break;
        }
        const request = this.resolve!(structuredClone(q));
        const accepted = await submitAudience.call(
          this.controller,
          q.user.text,
          request,
          q.user.recipients!,
          { message: q, owner: this.owner },
        );
        const saved = await this.controller.repository!.read(l),
          current = saved.metadata.queuedMessages?.find((x) => x.id === q.id);
        if (current?.state === "dispatching")
          await this.controller.repository!.messages.settle(l, q.id);
        await this.refresh(l);
        if (!accepted) {
          this.pause();
          if (this.controller.error) {
            const error = new Error(this.controller.error);
            this.controller.error = null;
            throw error;
          }
          break;
        }
      }
    });
    void operation
      .catch(async (e) => {
        this.pause(true);
        await this.refresh(l).catch(() => undefined);
        this.failed(e);
      })
      .finally(() => {
        this.running = false;
      });
  }
}
