import type {
  ConversationLocation,
  ConversationSnapshot,
  TranscriptEntry,
} from "./types.ts";
import {
  conversationStorageKey,
  type ConversationWriteQueue,
  type TranscriptStore,
} from "./transcript-store.ts";
import {
  QueueRefusedError,
  validateQueuedMessages,
  queueReceipt,
  type QueuedMessage,
  type QueueOutcome,
} from "./queued-message.ts";
export type QueuedAdoption = { id: string; owner: string };
/** Same-App queue ownership; saved preferences never authorize a native prompt. */
export class ConversationMessageQueue {
  private owners = new Map<string, string>();
  constructor(
    private store: TranscriptStore,
    private writes: ConversationWriteQueue,
    private changed: (l: ConversationLocation) => void,
    private active: (l: ConversationLocation, id: string) => boolean,
  ) {}
  release(l: ConversationLocation, owner: string) {
    if (this.owners.get(conversationStorageKey(l)) === owner)
      this.owners.delete(conversationStorageKey(l));
  }
  acquire(l: ConversationLocation, owner: string) {
    return this.writes.run(conversationStorageKey(l), async () => {
      const key = conversationStorageKey(l),
        old = this.owners.get(key);
      if (old && old !== owner)
        throw new Error("Another live owner controls this message queue");
      this.owners.set(key, owner);
    });
  }
  enqueue(l: ConversationLocation, q: QueuedMessage, owner: string) {
    return this.writes.run(conversationStorageKey(l), async () => {
      const s = await this.store.read(l),
        key = conversationStorageKey(l),
        old = this.owners.get(key);
      if (old && old !== owner)
        throw new QueueRefusedError(
          "Another live owner controls this message queue",
        );
      if (s.metadata.status !== "active")
        throw new QueueRefusedError(
          "Archived conversations cannot queue messages",
        );
      if (q.state !== "queued" || q.dispatchId)
        throw new QueueRefusedError(
          "Only new unstarted messages can be queued",
        );
      if (
        s.transcript.some(
          (e) =>
            e.id === q.user.id ||
            (e.type === "queue.outcome" &&
              (e.queued.id === q.id || e.queued.user.id === q.user.id)),
        )
      )
        throw new QueueRefusedError("Queued identities cannot be reused");
      let queuedMessages: QueuedMessage[];
      try {
        queuedMessages = validateQueuedMessages([
          ...(s.metadata.queuedMessages ?? []),
          structuredClone(q),
        ]);
      } catch (e) {
        throw new QueueRefusedError(e instanceof Error ? e.message : String(e));
      }
      await this.store.writeMetadata(l, {
        ...s.metadata,
        queuedMessages,
        updatedAt: new Date().toISOString(),
      });
      this.owners.set(key, owner);
      this.changed(l);
    });
  }
  /** Runs inside the caller's shared write transaction before its dispatch intent. */
  guard(
    s: ConversationSnapshot,
    user?: Extract<TranscriptEntry, { type: "message" }>,
    dispatchId?: string,
    adoption?: QueuedAdoption,
  ) {
    if (!s.metadata.queuedMessages) {
      if (adoption) throw new Error("Queued message no longer exists");
      return;
    }
    s.metadata.queuedMessages = s.metadata.queuedMessages.filter(
      (q) =>
        !s.transcript.some(
          (e) => e.type === "queue.outcome" && e.queued.id === q.id,
        ),
    );
    const first = s.metadata.queuedMessages[0];
    if (!first) {
      if (adoption) throw new Error("Queued message no longer exists");
      return;
    }
    if (!adoption)
      throw new Error(
        "Queued messages are waiting. Resume the queue before sending another message",
      );
    if (
      first.id !== adoption.id ||
      first.state !== "queued" ||
      !dispatchId ||
      JSON.stringify(first.user) !== JSON.stringify(user)
    )
      throw new Error(
        "Only the exact unstarted FIFO message can be dispatched",
      );
    if (this.owners.get(conversationStorageKey(s.location)) !== adoption.owner)
      throw new Error("Another live owner controls this message queue");
    first.state = "dispatching";
    first.dispatchId = dispatchId;
  }
  outcome(
    s: ConversationSnapshot,
    q: QueuedMessage,
  ): QueueOutcome | "working" | undefined {
    const receipt = [...s.transcript]
      .reverse()
      .find((e) => e.type === "queue.outcome" && e.queued.id === q.id);
    if (receipt?.type === "queue.outcome") return receipt.outcome;
    if (q.state === "queued") return;
    const ds = new Map<string, import("./dispatch-intent.ts").Delivery>();
    for (const e of s.transcript)
      if (e.type === "agent.delivery" && e.dispatchId === q.dispatchId)
        ds.set(e.delivery.id, e.delivery);
    const values = [...ds.values()];
    if (
      values.length === q.user.recipients?.length &&
      values.every((d) => d.state === "completed") &&
      values.every((d) =>
        q.user.recipients?.some(
          (r) => JSON.stringify(r) === JSON.stringify(d.recipient),
        ),
      )
    )
      return "completed";
    if (q.dispatchId && this.active(s.location, q.dispatchId)) return "working";
    if (values.some((d) => d.state === "unknown" || d.state === "started"))
      return "unknown";
    if (values.some((d) => d.state === "rejected")) return "rejected";
    if (values.length && values.every((d) => d.state === "cancelled"))
      return "cancelled";
    return values.length &&
      values.every((d) => ["not_sent", "cancelled"].includes(d.state))
      ? "not_sent"
      : "unknown";
  }
  cancel(l: ConversationLocation, id: string) {
    return this.settle(l, id, true);
  }
  settle(l: ConversationLocation, id: string, cancel = false) {
    return this.writes.run(conversationStorageKey(l), async () => {
      const s = await this.store.read(l),
        q = s.metadata.queuedMessages?.find((q) => q.id === id);
      if (!q) {
        if (
          s.transcript.some(
            (e) => e.type === "queue.outcome" && e.queued.id === id,
          )
        )
          return;
        throw new Error("Unknown queued message");
      }
      let outcome = this.outcome(s, q);
      if (!outcome) {
        if (!cancel) throw new Error("Queued message has not started");
        outcome = "cancelled";
      }
      if (
        outcome === "working" ||
        (cancel &&
          q.state !== "queued" &&
          !s.transcript.some(
            (e) => e.type === "queue.outcome" && e.queued.id === id,
          ))
      )
        throw new Error("A started message cannot be cancelled as queued");
      if (
        !s.transcript.some(
          (e) => e.type === "queue.outcome" && e.queued.id === id,
        )
      )
        await this.store.appendTranscriptEntries(l, [queueReceipt(q, outcome)]);
      await this.store.writeMetadata(l, {
        ...s.metadata,
        queuedMessages: s.metadata.queuedMessages!.filter((v) => v.id !== id),
        updatedAt: new Date().toISOString(),
      });
      this.changed(l);
    });
  }
}
