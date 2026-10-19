// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import {
  normalizeConversationLocation,
  normalizeConversationScope,
} from "./paths.ts";
import {
  cloneConversationSnapshot,
  conversationStorageKey,
  ConversationWriteQueue,
  type ConversationListEntry,
  type TranscriptStore,
} from "./transcript-store.ts";
import {
  ConversationUnavailableError,
  type AgentBindingRecord,
  type ConversationLocation,
  type ConversationMetadata,
  type ConversationSnapshot,
  type TranscriptEntry,
} from "./types.ts";
import { validateAgentBindingRecord } from "./binding-validation.ts";
import { validateConversationMetadata } from "./metadata-validation.ts";
import { validateTranscriptEntry } from "./transcript-validation.ts";
import { runtimeProvenanceKey } from "./provenance.ts";
import { assertSameImport } from "./session-imports.ts";

export class MemoryTranscriptStore implements TranscriptStore {
  private readonly conversations = new Map<string, ConversationSnapshot>();
  private readonly queue = new ConversationWriteQueue();

  async prepareImport(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot> {
    const normalized = normalizeConversationLocation(location);
    return this.queue.run(conversationStorageKey(normalized), async () => {
      validateConversationMetadata(metadata);
      if (
        !metadata.imported ||
        metadata.imported.state !== "preparing" ||
        metadata.id !== normalized.conversationId
      )
        throw new Error(
          "Import initialization requires its exact preparing marker",
        );
      const key = conversationStorageKey(normalized);
      const existing = this.conversations.get(key);
      if (existing) {
        assertSameImport(existing.metadata, metadata);
        return cloneConversationSnapshot(existing);
      }
      const snapshot = {
        location: normalized,
        metadata: structuredClone(metadata),
        agents: [],
        transcript: [],
        warnings: [],
      };
      this.conversations.set(key, snapshot);
      return cloneConversationSnapshot(snapshot);
    });
  }

  constructor(initial: ConversationSnapshot[] = []) {
    for (const snapshot of initial) {
      const location = normalizeConversationLocation(snapshot.location);
      this.conversations.set(
        conversationStorageKey(location),
        cloneConversationSnapshot({ ...snapshot, location }),
      );
    }
  }

  async create(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot> {
    const normalized = normalizeConversationLocation(location);
    return this.queue.run(conversationStorageKey(normalized), async () => {
      const key = conversationStorageKey(normalized);
      if (this.conversations.has(key)) {
        throw new Error("Conversation already exists");
      }
      if (metadata.id !== normalized.conversationId) {
        throw new Error("Conversation metadata ID must match its directory");
      }
      const snapshot: ConversationSnapshot = {
        location: normalized,
        metadata: structuredClone(validateConversationMetadata(metadata)),
        agents: [],
        transcript: [],
        warnings: [],
      };
      this.conversations.set(key, snapshot);
      return cloneConversationSnapshot(snapshot);
    });
  }

  async read(location: ConversationLocation): Promise<ConversationSnapshot> {
    const normalized = normalizeConversationLocation(location);
    const snapshot = this.conversations.get(conversationStorageKey(normalized));
    if (!snapshot) {
      throw new ConversationUnavailableError(
        normalized,
        "Conversation not found",
      );
    }
    return cloneConversationSnapshot(snapshot);
  }

  async list(scopeDir: string): Promise<ConversationListEntry[]> {
    const normalizedScope = normalizeConversationScope(scopeDir);
    return [...this.conversations.values()]
      .filter((snapshot) => snapshot.location.scopeDir === normalizedScope)
      .map((snapshot) => ({
        location: structuredClone(snapshot.location),
        metadata: structuredClone(snapshot.metadata),
      }))
      .sort((left, right) =>
        (right.metadata?.updatedAt ?? "").localeCompare(
          left.metadata?.updatedAt ?? "",
        ),
      );
  }

  async listAll(): Promise<ConversationListEntry[]> {
    return [...this.conversations.values()]
      .map((snapshot) => ({
        location: structuredClone(snapshot.location),
        metadata: structuredClone(snapshot.metadata),
      }))
      .sort((left, right) =>
        (right.metadata?.updatedAt ?? "").localeCompare(
          left.metadata?.updatedAt ?? "",
        ),
      );
  }

  async writeMetadata(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const snapshot = await this.read(normalized);
      if (metadata.id !== normalized.conversationId) {
        throw new Error("Conversation metadata ID must match its directory");
      }
      snapshot.metadata = structuredClone(
        validateConversationMetadata(metadata),
      );
      this.conversations.set(conversationStorageKey(normalized), snapshot);
    });
  }

  async appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const snapshot = await this.read(normalized);
      const ids = new Set(snapshot.agents.map((record) => record.id));
      for (const record of records) {
        const validated = validateAgentBindingRecord(record);
        if (!ids.has(validated.id)) {
          snapshot.agents.push(structuredClone(validated));
        }
        ids.add(validated.id);
      }
      this.conversations.set(conversationStorageKey(normalized), snapshot);
    });
  }

  async appendTranscriptEntries(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const snapshot = await this.read(normalized);
      const ids = new Set(snapshot.transcript.map((entry) => entry.id));
      const provenance = new Set(
        snapshot.transcript.flatMap((entry) =>
          entry.source ? [runtimeProvenanceKey(entry.source)] : [],
        ),
      );
      for (const entry of entries) {
        const validated = validateTranscriptEntry(entry);
        const sourceKey = validated.source
          ? runtimeProvenanceKey(validated.source)
          : undefined;
        if (
          !ids.has(validated.id) &&
          (!sourceKey || !provenance.has(sourceKey))
        ) {
          snapshot.transcript.push(structuredClone(validated));
        }
        ids.add(validated.id);
        if (sourceKey) provenance.add(sourceKey);
      }
      this.conversations.set(conversationStorageKey(normalized), snapshot);
    });
  }

  async delete(location: ConversationLocation): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      this.conversations.delete(conversationStorageKey(normalized));
    });
  }
}
