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
  validateTurnIntent,
  unknownTurnEntry,
  hasUnknownTurnEntry,
  type ConversationTurnIntent,
} from "./turn-intent.ts";

/** One App's file-turn authority. A retained intent never authorizes execution. */
export class ConversationTurns {
  readonly #owners = new Map<string, string>();
  constructor(
    private readonly store: TranscriptStore,
    private readonly queue: ConversationWriteQueue,
    private readonly changed: (location: ConversationLocation) => void,
    private readonly title: (text: string) => string | undefined,
    private readonly beforeSingle?: (
      snapshot: ConversationSnapshot,
      recovered?: string,
    ) => Promise<void>,
  ) {}

  isActive(location: ConversationLocation, id: string): boolean {
    return this.#owners.get(conversationStorageKey(location)) === id;
  }

  prepare(
    location: ConversationLocation,
    intent: ConversationTurnIntent,
    user: Extract<TranscriptEntry, { type: "message" }>,
    recoveredId?: string,
    recoveredDispatchId?: string,
  ): Promise<void> {
    return this.queue.run(conversationStorageKey(location), async () => {
      validateTurnIntent(intent);
      if (user.id !== intent.userEntryId || user.role !== "user")
        throw new Error("Turn intent must retain its exact authored message");
      const snapshot = await this.store.read(location);
      await this.beforeSingle?.(snapshot, recoveredDispatchId);
      const previous = snapshot.metadata.pendingTurn;
      if (previous) {
        if (previous.id === intent.id || previous.userEntryId === user.id)
          throw new Error("An existing turn cannot be prepared twice");
        if (
          !snapshot.transcript.some(
            (entry) =>
              entry.id === previous.userEntryId &&
              entry.type === "message" &&
              entry.role === "user",
          )
        )
          throw new Error(
            "The previous turn's authored message is unavailable",
          );
        if (this.isActive(location, previous.id) || previous.id !== recoveredId)
          throw new Error(
            "An earlier turn is still active or unconfirmed. Reopen this conversation before continuing.",
          );
        if (!hasUnknownTurnEntry(snapshot, previous))
          await this.store.appendTranscriptEntries(location, [
            unknownTurnEntry(previous),
          ]);
      }
      await this.store.appendTranscriptEntries(location, [user]);
      await this.store.writeMetadata(location, {
        ...snapshot.metadata,
        pendingTurn: { ...intent },
        title: snapshot.metadata.title ?? this.title(user.text),
        updatedAt: intent.startedAt,
      });
      this.#owners.set(conversationStorageKey(location), intent.id);
      this.changed(location);
    });
  }

  finish(
    location: ConversationLocation,
    id: string,
    known: boolean,
  ): Promise<ConversationTurnIntent | undefined> {
    return this.queue.run(conversationStorageKey(location), async () => {
      try {
        const snapshot = await this.store.read(location);
        const intent = snapshot.metadata.pendingTurn;
        if (!intent) return undefined;
        if (intent.id !== id)
          throw new Error("A stale turn cannot settle another turn");
        if (!known) return intent;
        const metadata = {
          ...snapshot.metadata,
          updatedAt: new Date().toISOString(),
        };
        delete metadata.pendingTurn;
        await this.store.writeMetadata(location, metadata);
        this.changed(location);
        return undefined;
      } finally {
        if (this.isActive(location, id))
          this.#owners.delete(conversationStorageKey(location));
      }
    });
  }

  recovery(snapshot: ConversationSnapshot): ConversationTurnIntent | undefined {
    const pending = snapshot.metadata.pendingTurn;
    if (
      pending &&
      !snapshot.transcript.some(
        (entry) =>
          entry.id === pending.userEntryId &&
          entry.type === "message" &&
          entry.role === "user",
      )
    )
      throw new Error("The pending turn's authored message is unavailable");
    return pending && !this.isActive(snapshot.location, pending.id)
      ? pending
      : undefined;
  }
}
