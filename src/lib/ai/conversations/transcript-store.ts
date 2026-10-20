// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import type {
  AgentBindingRecord,
  ConversationLocation,
  ConversationMetadata,
  ConversationSnapshot,
  TranscriptEntry,
} from "./types.ts";

export type ConversationListEntry = {
  location: ConversationLocation;
  metadata?: ConversationMetadata;
  unavailableReason?: string;
  /** Disposable search-index context. Never written to portable source files. */
  preview?: string;
};

export interface TranscriptStore {
  protect?(key: string): Promise<() => void>;
  dirty?(key: string): boolean;
  drain?(): Promise<void>;
  /** Initialize/recover only the exact marked local import. No fallback backend. */
  prepareImport?(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot>;
  create(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot>;
  read(location: ConversationLocation): Promise<ConversationSnapshot>;
  list(scopeDir: string): Promise<ConversationListEntry[]>;
  listAll(): Promise<ConversationListEntry[]>;
  writeMetadata(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<void>;
  appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<void>;
  appendTranscriptEntries(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<void>;
  delete(location: ConversationLocation): Promise<void>;
}

export function conversationStorageKey(location: ConversationLocation): string {
  return `${location.scopeDir}\u0000${location.conversationId}`;
}

export function cloneConversationSnapshot(
  snapshot: ConversationSnapshot,
): ConversationSnapshot {
  return structuredClone(snapshot);
}

export class ConversationWriteQueue {
  private readonly pending = new Map<string, Promise<void>>();
  private readonly failed = new Map<string, unknown>();

  private readonly protectedKeys = new Map<string, number>();
  constructor(private readonly admit?: (key: string) => void) {}
  dirty(key: string): boolean {
    return this.pending.has(key) || this.failed.has(key);
  }
  async drain(key?: string): Promise<void> {
    if (key !== undefined) await this.pending.get(key);
    else await Promise.all([...this.pending.values()]);
    if (key !== undefined && this.failed.has(key)) throw this.failed.get(key);
    if (key === undefined && this.failed.size)
      throw new AggregateError(
        [...this.failed.values()],
        "Conversation writes need recovery",
      );
  }
  async protect(key: string): Promise<() => void> {
    this.protectedKeys.set(key, (this.protectedKeys.get(key) ?? 0) + 1);
    const release = () => {
      const count = this.protectedKeys.get(key) ?? 0;
      if (count <= 1) this.protectedKeys.delete(key);
      else this.protectedKeys.set(key, count - 1);
    };
    try {
      await this.drain(key);
    } catch (error) {
      release();
      throw error;
    }
    return release;
  }
  async run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.protectedKeys.has(key))
      throw new Error("Conversation files are protected");
    this.admit?.(key);
    const previous = this.pending.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.catch(() => undefined).then(() => gate);
    this.pending.set(key, queued);
    await previous.catch(() => undefined);
    try {
      const result = await operation();
      this.failed.delete(key);
      return result;
    } catch (error) {
      this.failed.set(key, error);
      throw error;
    } finally {
      release();
      if (this.pending.get(key) === queued) this.pending.delete(key);
    }
  }
}
