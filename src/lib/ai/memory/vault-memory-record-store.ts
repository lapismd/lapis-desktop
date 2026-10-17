// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import { TFile, TFolder, type Vault } from "@lapis-notes/api/vault";
import { stringify } from "yaml";
import type { ConversationLocation } from "../conversations/types.ts";
import type { DurableMemoryRecord, MemoryScope } from "./types.ts";
import {
  MemoryRecordConflictError,
  type MemoryRecordStore,
  type StoredMemoryRecord,
  type MemoryRecordWriteOptions,
} from "./memory-record-store.ts";
import {
  assertMemoryId,
  serializeMemoryRecord,
  recordPath,
  recordDirectory,
  memoryRoot,
  parseStoredRecord,
  revisionDirectory,
} from "./memory-record-codec.ts";
import { sha256ConversationText as sha256Text } from "../conversations/hashes.ts";
import { sameScope } from "./paths.ts";
export class VaultMemoryRecordStore implements MemoryRecordStore {
  constructor(private readonly vault: Vault) {}

  async list(scope?: MemoryScope): Promise<StoredMemoryRecord[]> {
    const files = scope
      ? this.vault.getFilesByGlob(`${recordDirectory(scope)}/*.md`)
      : [
          ...this.vault.getFilesByGlob(
            ".lapis/agents/memory/user/records/*.md",
          ),
          ...this.vault.getFilesByGlob(
            ".lapis/agents/memory/workspace/records/*.md",
          ),
          ...this.vault.getFilesByGlob(
            "**/.lapis/agents/memory/project/records/*.md",
          ),
        ];
    const unique = new Map(files.map((file) => [file.path, file]));
    const records: StoredMemoryRecord[] = [];
    for (const file of [...unique.values()].sort((left, right) =>
      left.path.localeCompare(right.path),
    )) {
      try {
        const content = await this.vault.read(file);
        const stored = await parseStoredRecord(file.path, content);
        if (!scope || sameScope(scope, stored.record.scope))
          records.push(stored);
      } catch {
        // A malformed owner-edited memory file is omitted from active retrieval.
      }
    }
    return records;
  }

  async find(id: string): Promise<StoredMemoryRecord[]> {
    assertMemoryId(id);
    return (await this.list()).filter((stored) => stored.record.id === id);
  }

  async write(
    record: DurableMemoryRecord,
    options: MemoryRecordWriteOptions = {},
  ): Promise<StoredMemoryRecord> {
    const content = serializeMemoryRecord(record);
    const path = recordPath(record.scope, record.id);
    const currentFile = this.vault.getAbstractFileByPath(path);
    if (currentFile instanceof TFolder) {
      throw new MemoryRecordConflictError(`${path} is a folder`);
    }
    const current =
      currentFile instanceof TFile
        ? await parseStoredRecord(path, await this.vault.read(currentFile))
        : undefined;
    if (!current && (await this.find(record.id)).length > 0) {
      throw new MemoryRecordConflictError(
        `Memory ${record.id} already exists in another scope`,
      );
    }
    if (
      options.expectedCurrentHash !== undefined &&
      current?.hash !== options.expectedCurrentHash
    ) {
      throw new MemoryRecordConflictError(
        `Memory ${record.id} changed after consolidation preview`,
      );
    }
    if (current) {
      if (
        current.record.id !== record.id ||
        !sameScope(current.record.scope, record.scope)
      ) {
        throw new MemoryRecordConflictError(
          "Memory identity or scope changed externally",
        );
      }
      if (record.revision !== current.record.revision + 1) {
        throw new MemoryRecordConflictError(
          `Memory revision must advance from ${current.record.revision} to ${
            current.record.revision + 1
          }`,
        );
      }
      if (record.previousRevisionHash !== current.hash) {
        throw new MemoryRecordConflictError(
          "Memory previousRevisionHash does not match the current preimage",
        );
      }
      await this.writeImmutablePreimage(current);
    } else if (
      record.revision !== 1 ||
      record.previousRevisionHash !== undefined
    ) {
      throw new MemoryRecordConflictError(
        "A new memory must begin at revision 1 without a previous hash",
      );
    }

    await this.vault.mkpath(recordDirectory(record.scope));
    if (currentFile instanceof TFile)
      await this.vault.modify(currentFile, content);
    else await this.vault.create(path, content);
    return {
      record: structuredClone(record),
      path,
      hash: await sha256Text(content),
      content,
    };
  }

  async listHistory(
    id: string,
    scope: MemoryScope,
  ): Promise<DurableMemoryRecord[]> {
    assertMemoryId(id);
    const files = this.vault
      .getFilesByGlob(`${revisionDirectory(scope, id)}/*.md`)
      .sort((left, right) => left.path.localeCompare(right.path));
    const records: DurableMemoryRecord[] = [];
    for (const file of files) {
      try {
        records.push(
          (await parseStoredRecord(file.path, await this.vault.read(file)))
            .record,
        );
      } catch {
        // Corrupt external revision files stay visible in the vault but not active data.
      }
    }
    return records.sort((left, right) => left.revision - right.revision);
  }

  async writeReview(
    scope: MemoryScope,
    jobId: string,
    markdown: string,
  ): Promise<string> {
    assertMemoryId(jobId);
    const directory = `${memoryRoot(scope)}/reviews`;
    const path = `${directory}/${jobId}.md`;
    if (this.vault.getAbstractFileByPath(path)) {
      throw new MemoryRecordConflictError(`Review already exists: ${jobId}`);
    }
    await this.vault.mkpath(directory);
    await this.vault.create(path, markdown);
    return path;
  }

  async listExcludedConversationIds(): Promise<Set<string>> {
    const files = [
      ...this.vault.getFilesByGlob(".lapis/agents/memory/exclusions/*.yaml"),
      ...this.vault.getFilesByGlob("**/.lapis/agents/memory/exclusions/*.yaml"),
    ];
    return new Set(
      files.map((file) => file.name.replace(/\.yaml$/u, "")).filter(Boolean),
    );
  }

  async writeConversationExclusion(
    location: ConversationLocation,
  ): Promise<string> {
    const scope: MemoryScope = location.scopeDir
      ? { kind: "project", projectDir: location.scopeDir }
      : { kind: "workspace" };
    const directory = `${memoryRoot(scope)}/exclusions`;
    const path = `${directory}/${location.conversationId}.yaml`;
    const content = stringify(
      {
        schemaVersion: 1,
        conversationId: location.conversationId,
        scopeDirAtExclusion: location.scopeDir,
        excludedAt: new Date().toISOString(),
      },
      { lineWidth: 0 },
    );
    await this.vault.mkpath(directory);
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder)
      throw new MemoryRecordConflictError(`${path} is a folder`);
    if (existing instanceof TFile) return path;
    await this.vault.create(path, content);
    return path;
  }

  private async writeImmutablePreimage(
    current: StoredMemoryRecord,
  ): Promise<void> {
    const directory = revisionDirectory(
      current.record.scope,
      current.record.id,
    );
    const path = `${directory}/${current.record.revision}.md`;
    const content = current.content;
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder) {
      throw new MemoryRecordConflictError(`${path} is a folder`);
    }
    if (existing instanceof TFile) {
      const existingContent = await this.vault.read(existing);
      if ((await sha256Text(existingContent)) !== current.hash) {
        throw new MemoryRecordConflictError(
          `Immutable memory revision ${current.record.id}/${current.record.revision} conflicts`,
        );
      }
      return;
    }
    await this.vault.mkpath(directory);
    await this.vault.create(path, content);
  }
}
