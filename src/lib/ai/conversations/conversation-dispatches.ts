import {
  conversationStorageKey,
  type ConversationWriteQueue,
  type TranscriptStore,
} from "./transcript-store.ts";
import type {
  ConversationLocation,
  ConversationSnapshot,
  TranscriptEntry,
} from "./types.ts";
import {
  deliveryEntry,
  validateDispatchIntent,
  type DispatchIntent,
  type DeliveryState,
} from "./dispatch-intent.ts";
import { unknownTurnEntry } from "./turn-intent.ts";

/** Local explicit-Send ownership; recorded recipients never authorize execution. */
export class ConversationDispatches {
  private owners = new Map<string, string>();
  private current(snapshot: ConversationSnapshot) {
    const intent = snapshot.metadata.pendingDispatch;
    if (intent)
      for (const entry of snapshot.transcript) {
        if (
          entry.type !== "agent.delivery" ||
          entry.dispatchId !== intent.id ||
          ["pending", "started"].includes(entry.delivery.state)
        )
          continue;
        const index = intent.deliveries.findIndex(
          (d) => d.id === entry.delivery.id,
        );
        if (
          index >= 0 &&
          JSON.stringify(intent.deliveries[index]!.recipient) ===
            JSON.stringify(entry.delivery.recipient)
        )
          intent.deliveries[index] = structuredClone(entry.delivery);
      }
    return intent;
  }
  constructor(
    private store: TranscriptStore,
    private queue: ConversationWriteQueue,
    private changed: (l: ConversationLocation) => void,
    private activeTurn: (l: ConversationLocation, id: string) => boolean,
    private beforeBegin?: (
      s: ConversationSnapshot,
      u: Extract<TranscriptEntry, { type: "message" }>,
      id: string,
      adoption?: import("./conversation-message-queue.ts").QueuedAdoption,
    ) => void,
  ) {}
  isActive(location: ConversationLocation, id: string) {
    return this.owners.get(conversationStorageKey(location)) === id;
  }
  recovery(snapshot: ConversationSnapshot) {
    const intent = this.current(snapshot);
    if (!intent) return;
    const user = snapshot.transcript.find((e) => e.id === intent.userEntryId);
    if (
      user?.type !== "message" ||
      user.role !== "user" ||
      JSON.stringify(user.recipients) !==
        JSON.stringify(intent.deliveries.map((d) => d.recipient))
    )
      throw new Error(
        "The addressed message's exact authored recipient set is unavailable",
      );
    return this.isActive(snapshot.location, intent.id)
      ? undefined
      : structuredClone(intent);
  }
  /** Called inside the repository's shared write queue, including ordinary turns. */
  async guardSingle(snapshot: ConversationSnapshot, recoveredId?: string) {
    const intent = this.current(snapshot);
    if (!intent) return;
    if (
      this.isActive(snapshot.location, intent.id) ||
      intent.id !== recoveredId
    )
      throw new Error(
        "An addressed message is active or unconfirmed. Reopen this conversation before continuing.",
      );
    this.recovery(snapshot);
    for (const d of intent.deliveries)
      if (d.state === "pending" || d.state === "started") {
        d.state = d.state === "pending" ? "not_sent" : "unknown";
        await this.store.appendTranscriptEntries(snapshot.location, [
          deliveryEntry(intent, d),
        ]);
      }
    delete snapshot.metadata.pendingDispatch;
  }
  begin(
    location: ConversationLocation,
    user: Extract<TranscriptEntry, { type: "message" }>,
    intent: DispatchIntent,
    recoveredId?: string,
    recoveredTurnId?: string,
    queued?: import("./conversation-message-queue.ts").QueuedAdoption,
  ) {
    return this.queue.run(conversationStorageKey(location), async () => {
      validateDispatchIntent(intent);
      if (
        intent.deliveries.some((d) => d.state !== "pending" || d.agentBindingId)
      )
        throw new Error("A new dispatch requires unstarted deliveries");
      if (
        user.role !== "user" ||
        user.id !== intent.userEntryId ||
        JSON.stringify(user.recipients) !==
          JSON.stringify(intent.deliveries.map((d) => d.recipient))
      )
        throw new Error(
          "Dispatch requires its exact authored message and recipients",
        );
      const snapshot = await this.store.read(location);
      await this.guardSingle(snapshot, recoveredId);
      this.beforeBegin?.(snapshot, user, intent.id, queued);
      const previous = snapshot.metadata.pendingTurn;
      if (previous) {
        if (
          this.activeTurn(location, previous.id) ||
          previous.id !== recoveredTurnId
        )
          throw new Error(
            "An earlier turn is active or unconfirmed. Reopen this conversation before continuing.",
          );
        await this.store.appendTranscriptEntries(location, [
          unknownTurnEntry(previous),
        ]);
        delete snapshot.metadata.pendingTurn;
      }
      if (
        snapshot.transcript.some(
          (e) =>
            e.type === "agent.delivery" &&
            (e.dispatchId === intent.id ||
              intent.deliveries.some((d) => d.id === e.delivery.id)),
        )
      )
        throw new Error(
          "Existing dispatch or delivery identities cannot be reused",
        );
      if (snapshot.transcript.some((e) => e.id === user.id))
        throw new Error("An authored dispatch cannot be prepared twice");
      await this.store.appendTranscriptEntries(location, [
        user,
        ...intent.deliveries.map((d) => deliveryEntry(intent, d)),
      ]);
      await this.store.writeMetadata(location, {
        ...snapshot.metadata,
        pendingDispatch: structuredClone(intent),
        title:
          snapshot.metadata.title ??
          [...user.text.replace(/\s+/gu, " ").trim()].slice(0, 80).join(""),
        updatedAt: intent.startedAt,
      });
      this.owners.set(conversationStorageKey(location), intent.id);
      this.changed(location);
    });
  }
  start(
    location: ConversationLocation,
    id: string,
    deliveryId: string,
    bindingId: string,
  ) {
    return this.transition(location, id, deliveryId, "started", bindingId);
  }
  finish(
    location: ConversationLocation,
    id: string,
    deliveryId: string,
    state: Exclude<DeliveryState, "pending" | "started">,
  ) {
    return this.transition(location, id, deliveryId, state);
  }
  private transition(
    location: ConversationLocation,
    id: string,
    deliveryId: string,
    state: DeliveryState | "abandon_cancel" | "abandon_stop",
    bindingId?: string,
  ) {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location),
        intent = this.current(snapshot);
      if (!intent || intent.id !== id) {
        if (
          snapshot.transcript.some(
            (e) =>
              e.type === "agent.delivery" &&
              e.dispatchId === id &&
              e.delivery.id === deliveryId &&
              e.delivery.state === state,
          )
        )
          return snapshot;
        throw new Error("The addressed delivery no longer owns this message");
      }
      const d = intent.deliveries.find((v) => v.id === deliveryId);
      if (!d) throw new Error("Unknown addressed delivery");
      if (state === "abandon_cancel" || state === "abandon_stop") {
        if (d.state === "pending")
          state = state === "abandon_cancel" ? "cancelled" : "not_sent";
        else if (d.state === "started") state = "unknown";
        else return snapshot;
      }
      if (d.state === state) return snapshot;
      if (!this.isActive(location, id))
        throw new Error("The addressed delivery no longer owns this message");
      if (
        !(
          d.state === "pending" &&
          ["started", "not_sent", "cancelled"].includes(state)
        ) &&
        !(
          d.state === "started" &&
          ["completed", "rejected", "unknown"].includes(state)
        )
      )
        throw new Error(
          "An addressed delivery cannot be replayed or overwritten",
        );
      d.state = state;
      if (bindingId) d.agentBindingId = bindingId;
      validateDispatchIntent(intent);
      if (state !== "started")
        await this.store.appendTranscriptEntries(location, [
          deliveryEntry(intent, d),
        ]);
      await this.store.writeMetadata(location, {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      });
      if (state === "started")
        await this.store.appendTranscriptEntries(location, [
          deliveryEntry(intent, d),
        ]);
      this.changed(location);
      return this.store.read(location);
    });
  }
  async abandon(
    location: ConversationLocation,
    id: string,
    state: "cancelled" | "not_sent",
  ) {
    const snapshot = await this.store.read(location),
      intent = this.current(snapshot);
    if (!intent || intent.id !== id || !this.isActive(location, id)) return;
    try {
      for (const d of intent.deliveries)
        await this.transition(
          location,
          id,
          d.id,
          state === "cancelled" ? "abandon_cancel" : "abandon_stop",
        );
      await this.end(location, id);
    } finally {
      if (this.isActive(location, id))
        this.owners.delete(conversationStorageKey(location));
    }
  }

  end(location: ConversationLocation, id: string) {
    return this.queue.run(conversationStorageKey(location), async () => {
      try {
        const snapshot = await this.store.read(location),
          intent = this.current(snapshot);
        if (!intent || intent.id !== id || !this.isActive(location, id)) return;
        if (
          intent.deliveries.some((d) =>
            ["pending", "started"].includes(d.state),
          )
        )
          throw new Error("Addressed deliveries are not settled");
        if (!intent.deliveries.some((d) => d.state === "unknown")) {
          delete snapshot.metadata.pendingDispatch;
          await this.store.writeMetadata(location, snapshot.metadata);
        }
        this.changed(location);
      } finally {
        if (this.isActive(location, id))
          this.owners.delete(conversationStorageKey(location));
      }
    });
  }
}
