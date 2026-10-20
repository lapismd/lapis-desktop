import { ConversationPermissions } from "./conversation-permissions.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import { normalizeApprovalGrants } from "./approval-grants.ts";
import { ConversationMessageQueue } from "./conversation-message-queue.ts";
import { ConversationDispatches } from "./conversation-dispatches.ts";
import { ConversationTurns } from "./conversation-turns.ts";
import { SessionImports } from "./session-imports.ts";
import { assertConversationWritable } from "./import-types.ts";
import { createMetadata } from "./create-metadata.ts";
import type { DurableSanitizationOptions } from "./redaction.ts";
import { sanitizeTranscriptEntry } from "./sanitize-entry.ts";
import type {
  ConversationListEntry,
  TranscriptStore,
} from "./transcript-store.ts";
import {
  conversationStorageKey,
  ConversationWriteQueue,
} from "./transcript-store.ts";
import {
  type AgentBindingRecord,
  type ConversationApprovalGrant,
  type ConversationLocation,
  type ConversationMetadata,
  type ConversationSnapshot,
  type TranscriptEntry,
} from "./types.ts";

export type CreateConversationInput = {
  scopeDir: string;
  launchNotePath?: string;
  workspacePath?: string;
  now?: string;
  id?: string;
};

export type ConversationRepositoryChange =
  | { type: "upsert"; location: ConversationLocation }
  | { type: "delete"; location: ConversationLocation };

export function deriveConversationTitle(text: string): string | undefined {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (!normalized) return undefined;
  return [...normalized].slice(0, 80).join("");
}

export class ConversationRepository {
  protection?: import("./transcript-protection.ts").ConversationProtection;
  dirtyWrites(key: string) {
    return this.queue.dirty(key);
  }
  protectWrites(key: string) {
    return this.queue.protect(key);
  }
  drainWrites() {
    return this.queue.drain();
  }
  async refreshAfterReplacement(location: ConversationLocation) {
    this.emit({ type: "upsert", location });
  }
  private readonly queue = new ConversationWriteQueue((key) =>
    this.protection?.admit(key),
  );
  private readonly listeners = new Set<
    (change: ConversationRepositoryChange) => void
  >();

  readonly permissions: ConversationPermissions;
  readonly messages: ConversationMessageQueue;
  readonly turns: ConversationTurns;
  readonly dispatches: ConversationDispatches;
  readonly imports: SessionImports;
  constructor(
    private readonly store: TranscriptStore,
    private readonly sanitization: DurableSanitizationOptions = {},
  ) {
    this.permissions = new ConversationPermissions(
      store,
      this.queue,
      (location) => this.emit({ type: "upsert", location }),
    );
    this.imports = new SessionImports(
      store,
      this.queue,
      (location) => this.emit({ type: "upsert", location }),
      sanitization,
    );
    this.messages = new ConversationMessageQueue(
      store,
      this.queue,
      (location) => this.emit({ type: "upsert", location }),
      (l, id) => this.dispatches.isActive(l, id),
    );
    this.turns = new ConversationTurns(
      store,
      this.queue,
      (location) => this.emit({ type: "upsert", location }),
      deriveConversationTitle,
      async (snapshot, recovered) => {
        await this.dispatches.guardSingle(snapshot, recovered);
        this.messages.guard(snapshot);
      },
    );
    this.dispatches = new ConversationDispatches(
      store,
      this.queue,
      (location) => this.emit({ type: "upsert", location }),
      (location, id) => this.turns.isActive(location, id),
      (s, u, id, adoption) => this.messages.guard(s, u, id, adoption),
    );
  }

  async create(input: CreateConversationInput): Promise<ConversationSnapshot> {
    const conversationId = input.id ?? crypto.randomUUID();
    const location = { scopeDir: input.scopeDir, conversationId };
    const metadata = createMetadata(input, conversationId);
    const snapshot = await this.queue.run(
      conversationStorageKey(location),
      () => this.store.create(location, metadata),
    );
    this.emit({ type: "upsert", location: snapshot.location });
    return snapshot;
  }

  read(location: ConversationLocation): Promise<ConversationSnapshot> {
    this.protection?.ensure(conversationStorageKey(location));
    return this.store.read(location);
  }

  async list(scopeDir: string): Promise<ConversationListEntry[]> {
    const entries = await this.store.list(scopeDir);
    for (const e of entries)
      this.protection?.ensure(conversationStorageKey(e.location));
    return entries;
  }

  async listAll(): Promise<ConversationListEntry[]> {
    const entries = await this.store.listAll();
    for (const e of entries)
      this.protection?.ensure(conversationStorageKey(e.location));
    return entries;
  }

  subscribe(
    listener: (change: ConversationRepositoryChange) => void,
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async appendTranscript(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const safeEntries = entries.map((entry) =>
        sanitizeTranscriptEntry(entry, this.sanitization),
      );
      assertConversationWritable((await this.store.read(location)).metadata);
      await this.store.appendTranscriptEntries(location, safeEntries);
      const snapshot = await this.store.read(location);
      const firstUserMessage = snapshot.transcript.find(
        (entry) => entry.type === "message" && entry.role === "user",
      );
      const title =
        snapshot.metadata.title ??
        deriveConversationTitle(
          firstUserMessage?.type === "message" ? firstUserMessage.text : "",
        );
      const updatedAt =
        safeEntries.at(-1)?.createdAt ?? new Date().toISOString();
      const metadata = {
        ...snapshot.metadata,
        ...(title ? { title } : {}),
        updatedAt,
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      assertConversationWritable((await this.store.read(location)).metadata);
      await this.store.appendAgentRecords(location, records);
      const snapshot = await this.store.read(location);
      const updatedAt = records.at(-1)?.createdAt ?? new Date().toISOString();
      const activeBinding = [...records]
        .reverse()
        .find((record) => record.type === "binding.created");
      const metadata = {
        ...snapshot.metadata,
        updatedAt,
        ...(activeBinding ? { activeAgentBindingId: activeBinding.id } : {}),
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async writeApprovalGrants(
    location: ConversationLocation,
    grants: ConversationApprovalGrant[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const approvalGrants = normalizeApprovalGrants(grants);
      assertConversationWritable(snapshot.metadata);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      };
      if (approvalGrants.length > 0) metadata.approvalGrants = approvalGrants;
      else delete metadata.approvalGrants;
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async writePinned(
    location: ConversationLocation,
    pinned: boolean,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      };
      if (pinned) metadata.pinned = true;
      else delete metadata.pinned;
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async archive(
    location: ConversationLocation,
    archived = true,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        status: archived ? "archived" : "active",
        updatedAt: new Date().toISOString(),
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async activateBinding(
    location: ConversationLocation,
    bindingId: string,
    switchEntry?: TranscriptEntry,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const binding = snapshot.agents.find(
        (record) =>
          record.type === "binding.created" && record.id === bindingId,
      );
      assertConversationWritable(snapshot.metadata);
      if (!binding) throw new Error(`Unknown agent binding: ${bindingId}`);
      if (switchEntry) {
        await this.store.appendTranscriptEntries(location, [
          sanitizeTranscriptEntry(switchEntry, this.sanitization),
        ]);
      }
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        activeAgentBindingId: bindingId,
        updatedAt: switchEntry?.createdAt ?? new Date().toISOString(),
      };
      await this.store.writeMetadata(location, metadata);
      const result = await this.store.read(location);
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async delete(location: ConversationLocation): Promise<void> {
    await this.queue.run(conversationStorageKey(location), () =>
      this.store.delete(location),
    );
    this.emit({ type: "delete", location: { ...location } });
  }

  private emit(change: ConversationRepositoryChange): void {
    for (const listener of this.listeners) listener(change);
  }
}
