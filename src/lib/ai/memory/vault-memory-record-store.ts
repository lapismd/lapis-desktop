import { readMemoryNotes } from "./note-reader.ts";
import { forgetMemoryNotes } from "./note-forget.ts";
import { publishMemoryReceipt } from "./note-publication.ts";
// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { Vault } from "@lapis-notes/api/vault";
import type { ConversationLocation } from "../conversations/types.ts";
import { sha256ConversationText as hash } from "../conversations/hashes.ts";
import {
  MemoryRecordConflictError,
  type MemoryRecordStore,
  type StoredMemoryRecord,
  type MemoryRecordWriteOptions,
} from "./memory-record-store.ts";
import { assertMemoryId, validateMemoryRecord } from "./memory-record-codec.ts";
import { memoryDate, memoryFolder, scopeDirectory } from "./note-paths.ts";
import { noteBlocks, renderMemoryBlock } from "./note-codec.ts";
import { MemoryNoteIO, memoryLock } from "./note-io.ts";
import { MemoryLedger, type MemoryReceipt } from "./note-ledger.ts";
import { sameScope } from "./paths.ts";
import type { DurableMemoryRecord, MemoryScope } from "./types.ts";

export type MemoryNoteOptions = {
  folder?: () => string;
  timezone?: () => string;
  app?: App;
};
export class VaultMemoryRecordStore implements MemoryRecordStore {
  readonly io: MemoryNoteIO;
  readonly ledger: MemoryLedger;
  constructor(
    readonly vault: Vault,
    readonly options: MemoryNoteOptions = {},
  ) {
    this.io = new MemoryNoteIO(vault, options.app);
    this.ledger = new MemoryLedger(this.io);
  }
  folder() {
    return memoryFolder(this.options.folder?.() ?? "Memory");
  }
  timezone() {
    return this.options.timezone?.() ?? "UTC";
  }
  async resumePending(): Promise<void> {
    await memoryLock(this.vault, async () => {
      for (const receipt of await this.ledger.receipts())
        if (!receipt.committed)
          await publishMemoryReceipt(
            this.ledger,
            receipt,
            await this.activeFolder(),
          );
    });
  }
  async eligibleEntries(
    location: ConversationLocation,
    entries: { id: string; createdAt: string }[],
  ): Promise<string[]> {
    return memoryLock(this.vault, async () => {
      await this.ledger.initialize(new Date(), this.folder());
      const state = await this.ledger.state();
      if (state.excluded.includes(location.conversationId)) return [];
      const captured = new Set(
        state.checkpoints[location.conversationId] ?? [],
      );
      return entries
        .filter(
          (entry) =>
            !captured.has(entry.id) &&
            Date.parse(entry.createdAt) >= Date.parse(state.activatedAt),
        )
        .map((entry) => entry.id);
    });
  }
  async checkpointEntries(
    location: ConversationLocation,
    ids: string[],
  ): Promise<void> {
    await memoryLock(this.vault, () =>
      this.ledger.update((state) => {
        state.checkpoints[location.conversationId] = [
          ...new Set([
            ...(state.checkpoints[location.conversationId] ?? []),
            ...ids,
          ]),
        ];
      }),
    );
  }
  async activeFolder(): Promise<string> {
    return memoryFolder(
      (await this.io.read(".lapis/memory/state.json"))
        ? (await this.ledger.state()).folder
        : this.folder(),
    );
  }
  list(scope?: MemoryScope): Promise<StoredMemoryRecord[]> {
    return readMemoryNotes(this, scope);
  }
  async find(id: string) {
    assertMemoryId(id);
    return (await this.list()).filter((entry) => entry.record.id === id);
  }
  write(
    record: DurableMemoryRecord,
    options: MemoryRecordWriteOptions = {},
  ): Promise<StoredMemoryRecord> {
    return memoryLock(this.vault, () =>
      this.writeLocked(validateMemoryRecord(record), options),
    );
  }
  private async writeLocked(
    record: DurableMemoryRecord,
    options: MemoryRecordWriteOptions,
  ): Promise<StoredMemoryRecord> {
    await this.ledger.initialize(new Date(), this.folder());
    const state = await this.ledger.state();
    if (state.relocation)
      throw new MemoryRecordConflictError(
        "Memory folder move must finish before writing",
      );
    if (
      (record.status !== "retracted" && state.suppressed.includes(record.id)) ||
      (record.status !== "retracted" &&
        record.evidence.some((ref) =>
          state.excluded.includes(ref.conversationId),
        ))
    )
      throw new MemoryRecordConflictError("This memory was forgotten");
    let previous = await this.ledger.receipt(record.id);
    if (previous && !previous.committed) {
      await publishMemoryReceipt(this.ledger, previous, state.folder);
      previous = await this.ledger.receipt(record.id);
    }
    const found = (await this.find(record.id))[0];
    if (previous?.committed && !found && record.status !== "retracted")
      throw new MemoryRecordConflictError(
        "This memory was removed from its note",
      );
    if (
      options.expectedCurrentHash !== undefined &&
      found?.hash !== options.expectedCurrentHash
    )
      throw new MemoryRecordConflictError(
        "Memory changed after consolidation preview",
      );
    if (
      found &&
      found.record.status === record.status &&
      found.record.summary === record.summary &&
      found.record.createdBy === record.createdBy &&
      JSON.stringify(found.record.evidence) === JSON.stringify(record.evidence)
    )
      return found;
    if (previous && !sameScope(previous.record.scope, record.scope))
      throw new MemoryRecordConflictError("Memory scope cannot change");
    if (
      found &&
      (record.revision !== found.record.revision + 1 ||
        record.previousRevisionHash !== found.hash)
    )
      throw new MemoryRecordConflictError("Invalid memory revision preimage");
    const directory = scopeDirectory(state.folder, record.scope);
    const date = memoryDate(record.updatedAt, this.timezone());
    const daily = `${directory}/${date}.md`;
    const receipt: MemoryReceipt = {
      record,
      history: previous?.history ?? [],
      daily: [...new Set([...(previous?.daily ?? []), daily])],
      curated: `${directory}/MEMORY.md`,
      committed: false,
      timezone: this.timezone(),
      currentDaily: daily,
      baselines: {},
    };
    if (previous?.committed)
      receipt.history = [...receipt.history, previous.record];
    for (const path of [daily, receipt.curated]) {
      const text = await this.io.read(path);
      receipt.baselines[path] =
        noteBlocks(text ?? "").find((block) => block.id === record.id)?.text ??
        null;
    }
    await this.ledger.save(receipt);
    await publishMemoryReceipt(this.ledger, receipt, await this.activeFolder());
    const content = renderMemoryBlock(record, this.timezone(), `${date}.md`);
    return {
      record,
      path: receipt.curated,
      anchor: record.id,
      noteKind: "curated",
      content,
      hash: await hash(content),
    };
  }
  async associatedMemoryIds(conversationId: string): Promise<string[]> {
    return (await this.ledger.receipts())
      .filter((entry) =>
        entry.record.evidence.some(
          (ref) => ref.conversationId === conversationId,
        ),
      )
      .map((entry) => entry.record.id);
  }
  forgetConversationEntries(conversationId: string) {
    return forgetMemoryNotes(this, conversationId);
  }
  async listHistory(id: string, _scope: MemoryScope) {
    assertMemoryId(id);
    return (await this.ledger.receipt(id))?.history ?? [];
  }
  async writeReview(_scope: MemoryScope, jobId: string, markdown: string) {
    assertMemoryId(jobId);
    const path = `.lapis/memory/reviews/${jobId}.md`;
    await this.io.update(path, (current) => current ?? markdown);
    return path;
  }
  async listExcludedConversationIds() {
    const text = await this.io.read(".lapis/memory/state.json");
    return new Set(text ? (await this.ledger.state()).excluded : []);
  }
  async writeConversationExclusion(location: ConversationLocation) {
    await memoryLock(this.vault, async () => {
      await this.ledger.initialize(new Date(), this.folder());
      await this.ledger.update((state) => {
        if (!state.excluded.includes(location.conversationId))
          state.excluded.push(location.conversationId);
      });
    });
    return ".lapis/memory/state.json";
  }
}
