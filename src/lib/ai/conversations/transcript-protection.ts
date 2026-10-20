// SPDX-License-Identifier: Apache-2.0
import type { FileEditingSessionRegistry } from "@lapis-notes/api";
import type { ConversationRepository } from "./conversation-repository.ts";
import type { ConversationLocation } from "./types.ts";
import type { TranscriptStore } from "./transcript-store.ts";
import { conversationStorageKey } from "./transcript-store.ts";
import { conversationDirectory } from "./paths.ts";
export interface TranscriptParticipant {
  /** Fence sends synchronously, then flush existing persistence. */
  protect(): Promise<() => void>;
  /** Read restored files without restarting a runtime or replaying a prompt. */
  reload(): Promise<void>;
}
type Entry = {
  location: ConversationLocation;
  participants: Set<TranscriptParticipant>;
  unregister: (() => void)[];
  hold?: Promise<void>;
  references: number;
  release: (() => void)[];
  fences: (() => void)[];
  reload?: Promise<void>;
};
/** One admission boundary per conversation, shared by all three file writers. */
export class ConversationProtection {
  private entries = new Map<string, Entry>();
  private closed = false;
  private guarding = 0;
  private tail: Promise<void> = Promise.resolve();
  onError?: (error: unknown) => void;
  constructor(
    private registry: FileEditingSessionRegistry,
    private repository: ConversationRepository,
    private store: TranscriptStore,
    private refresh: () => Promise<void> = async () => {},
  ) {}
  ensure(key: string): Entry {
    if (this.closed) throw new Error("Conversation persistence is closed");
    const existing = this.entries.get(key);
    if (existing) {
      return existing;
    }
    const [scopeDir, conversationId] = key.split("\u0000");
    const entry: Entry = {
      location: { scopeDir: scopeDir!, conversationId: conversationId! },
      participants: new Set(),
      unregister: [],
      references: 0,
      release: [],
      fences: [],
    };
    if (this.guarding) this.register(key, entry);
    this.entries.set(key, entry);
    return entry;
  }
  private register(key: string, entry: Entry): void {
    const dirty = () =>
      this.repository.dirtyWrites(key) || this.store.dirty?.(key) === true;
    try {
      for (const file of [
        "metadata.yaml",
        "agents.jsonl",
        "transcript.jsonl",
      ]) {
        entry.unregister.push(
          this.registry.register(
            `${conversationDirectory(entry.location)}/${file}`,
            {
              get dirty() {
                return dirty();
              },
              flush: async () => {},
              protect: () => this.protect(key, entry),
            },
          ),
        );
      }
    } catch (error) {
      for (const unregister of entry.unregister) unregister();
      throw error;
    }
  }
  /** Register writer barriers only for actual transcript replacement operations. */
  guard<T>(path: string | undefined, apply: () => Promise<T>): Promise<T> {
    const operation = this.tail.then(async () => {
      if (this.closed) throw new Error("Conversation persistence is closed");
      this.guarding++;
      try {
        for (const [key, entry] of this.entries) this.register(key, entry);
        return await this.registry.guard(path, apply);
      } finally {
        this.guarding--;
        for (const entry of this.entries.values())
          for (const unregister of entry.unregister.splice(0)) unregister();
      }
    });
    this.tail = operation.then(
      () => {},
      () => {},
    );
    return operation;
  }
  admit(key: string): void {
    const entry = this.ensure(key);
    if (entry.hold || entry.reload)
      throw new Error("Conversation files are protected");
  }
  attach(
    location: ConversationLocation,
    participant: TranscriptParticipant,
  ): () => void {
    const entry = this.ensure(conversationStorageKey(location));
    entry.participants.add(participant);
    return () => entry.participants.delete(participant);
  }
  private async protect(
    key: string,
    entry: Entry,
  ): Promise<() => Promise<void>> {
    entry.references++;
    if (!entry.hold) {
      // All participants fence before the first await. Existing repository saves
      // must drain before the underlying store is fenced.
      entry.hold = this.acquire(key, entry);
    }
    try {
      await entry.hold;
    } catch (error) {
      await this.release(entry, false);
      throw error;
    }
    let released = false;
    return async () => {
      if (released) return;
      released = true;
      await this.release(entry, true);
    };
  }
  private async acquire(key: string, entry: Entry): Promise<void> {
    const results = await Promise.allSettled(
      [...entry.participants].map(async (p) => {
        entry.release.push(await p.protect());
      }),
    );
    const errors = results.flatMap((r) =>
      r.status === "rejected" ? [r.reason] : [],
    );
    if (errors.length) throw errors[0];
    entry.fences.push(await this.repository.protectWrites(key));
    if (this.store.protect) entry.fences.push(await this.store.protect(key));
    const snapshot = await this.store.read(entry.location).catch((error) => {
      // A deleted/unavailable conversation has no durable turn to overwrite.
      // The native replacement validator still governs admitted paths/bytes.
      if (
        error instanceof Error &&
        error.name === "ConversationUnavailableError"
      )
        return null;
      throw error;
    });
    if (
      snapshot &&
      (snapshot.metadata.pendingTurn ||
        snapshot.metadata.pendingDispatch ||
        snapshot.metadata.queuedMessages?.some(
          (q) => q.state === "dispatching",
        ))
    )
      throw new Error(
        "Conversation has an unsettled turn; resolve it before replacing its files",
      );
  }
  private async release(entry: Entry, reload: boolean): Promise<void> {
    if (--entry.references) return;
    // Queue/store fences may release now; participant send fences remain held
    // until projection is complete, outside the registry mutation callback.
    const releases = entry.release.splice(0);
    for (const release of entry.fences.splice(0).reverse()) release();
    const run = async () => {
      try {
        if (reload && !this.closed) {
          await this.refresh();
          for (const participant of entry.participants)
            await participant.reload();
          await this.repository.refreshAfterReplacement(entry.location);
        }
      } finally {
        for (const release of releases.reverse()) release();
        entry.hold = undefined;
        entry.reload = undefined;
      }
    };
    if (reload) {
      entry.reload = this.registry.afterMutations(run);
      void entry.reload.catch((error) => {
        for (const release of entry.fences.splice(0).reverse()) release();
        for (const release of releases.splice(0).reverse()) release();
        entry.hold = undefined;
        entry.reload = undefined;
        if (!this.closed) this.onError?.(error);
      });
    } else await run();
  }
  async dispose(): Promise<void> {
    this.closed = true;
    await this.repository.drainWrites();
    await this.store.drain?.();
    for (const entry of this.entries.values()) {
      for (const unregister of entry.unregister) unregister();
    }
    this.entries.clear();
  }
}
