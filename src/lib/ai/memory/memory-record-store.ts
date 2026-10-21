// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import type { ConversationLocation } from "../conversations/types.ts";
import type { DurableMemoryRecord, MemoryScope } from "./types.ts";
import { sha256ConversationText as sha256Text } from "../conversations/hashes.ts";
import { validateMemoryRecord } from "./memory-record-codec.ts";
import { sameScope, memoryScopeKey as scopeKey } from "./paths.ts";
export type StoredMemoryRecord = {
  record: DurableMemoryRecord;
  path: string;
  hash: string;
  content: string;
  anchor?: string;
  noteKind?: "daily" | "curated";
};

export type MemoryRecordWriteOptions = {
  expectedCurrentHash?: string;
};

export interface MemoryRecordStore {
  associatedMemoryIds?(conversationId: string): Promise<string[]>;
  forgetConversationEntries?(
    conversationId: string,
  ): Promise<{ retracted: number; needsReview: number }>;
  eligibleEntries?(
    location: ConversationLocation,
    entries: { id: string; createdAt: string }[],
  ): Promise<string[]>;
  checkpointEntries?(
    location: ConversationLocation,
    ids: string[],
  ): Promise<void>;
  list(scope?: MemoryScope): Promise<StoredMemoryRecord[]>;
  find(id: string): Promise<StoredMemoryRecord[]>;
  write(
    record: DurableMemoryRecord,
    options?: MemoryRecordWriteOptions,
  ): Promise<StoredMemoryRecord>;
  listHistory(id: string, scope: MemoryScope): Promise<DurableMemoryRecord[]>;
  writeReview(
    scope: MemoryScope,
    jobId: string,
    markdown: string,
  ): Promise<string>;
  listExcludedConversationIds(): Promise<Set<string>>;
  writeConversationExclusion(location: ConversationLocation): Promise<string>;
}

export class MemoryRecordConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemoryRecordConflictError";
  }
}

export class InMemoryMemoryRecordStore implements MemoryRecordStore {
  readonly #records = new Map<string, StoredMemoryRecord>();
  readonly #history = new Map<string, DurableMemoryRecord[]>();
  readonly #reviews = new Map<string, string>();
  readonly #exclusions = new Map<string, string>();

  async list(scope?: MemoryScope): Promise<StoredMemoryRecord[]> {
    return [...this.#records.values()]
      .filter((stored) => !scope || sameScope(scope, stored.record.scope))
      .map((stored) => structuredClone(stored));
  }

  async find(id: string): Promise<StoredMemoryRecord[]> {
    return (await this.list()).filter((stored) => stored.record.id === id);
  }

  async write(
    record: DurableMemoryRecord,
    options: MemoryRecordWriteOptions = {},
  ): Promise<StoredMemoryRecord> {
    validateMemoryRecord(record);
    const content = JSON.stringify(record);
    const key = `${scopeKey(record.scope)}\u0000${record.id}`;
    const current = this.#records.get(key);
    if (
      !current &&
      [...this.#records.values()].some(
        (stored) => stored.record.id === record.id,
      )
    ) {
      throw new MemoryRecordConflictError(
        `Memory ${record.id} already exists in another scope`,
      );
    }
    if (
      options.expectedCurrentHash !== undefined &&
      current?.hash !== options.expectedCurrentHash
    ) {
      throw new MemoryRecordConflictError("Memory changed after preview");
    }
    if (current) {
      if (
        record.revision !== current.record.revision + 1 ||
        record.previousRevisionHash !== current.hash
      ) {
        throw new MemoryRecordConflictError("Invalid memory revision preimage");
      }
      const history = this.#history.get(key) ?? [];
      history.push(structuredClone(current.record));
      this.#history.set(key, history);
    } else if (record.revision !== 1 || record.previousRevisionHash) {
      throw new MemoryRecordConflictError("Invalid first memory revision");
    }
    const stored: StoredMemoryRecord = {
      record: structuredClone(record),
      path: `Memory/${record.scope.kind}/MEMORY.md`,
      anchor: record.id,
      noteKind: "curated",
      hash: await sha256Text(content),
      content,
    };
    this.#records.set(key, stored);
    return structuredClone(stored);
  }

  async listHistory(
    id: string,
    scope: MemoryScope,
  ): Promise<DurableMemoryRecord[]> {
    return structuredClone(
      this.#history.get(`${scopeKey(scope)}\u0000${id}`) ?? [],
    );
  }

  async writeReview(
    scope: MemoryScope,
    jobId: string,
    markdown: string,
  ): Promise<string> {
    const path = `.lapis/memory/reviews/${jobId}.md`;
    if (this.#reviews.has(path))
      throw new MemoryRecordConflictError("Review exists");
    this.#reviews.set(path, markdown);
    return path;
  }

  async listExcludedConversationIds(): Promise<Set<string>> {
    return new Set(this.#exclusions.keys());
  }

  async writeConversationExclusion(
    location: ConversationLocation,
  ): Promise<string> {
    const scope: MemoryScope = location.scopeDir
      ? { kind: "project", projectDir: location.scopeDir }
      : { kind: "workspace" };
    const path = `.lapis/memory/exclusions/${location.conversationId}.json`;
    this.#exclusions.set(location.conversationId, path);
    return path;
  }
}
