// SPDX-License-Identifier: Apache-2.0
import type { VaultMemoryRecordStore } from "./vault-memory-record-store.ts";
import type { StoredMemoryRecord } from "./memory-record-store.ts";
import type { MemoryScope, DurableMemoryRecord } from "./types.ts";
import { sha256ConversationText as hash } from "../conversations/hashes.ts";
import { noteScope } from "./note-paths.ts";
import { handwrittenText, noteBlocks } from "./note-codec.ts";
import { sameScope } from "./paths.ts";
export async function readMemoryNotes(
  store: VaultMemoryRecordStore,
  scope?: MemoryScope,
): Promise<StoredMemoryRecord[]> {
  const folder = await store.activeFolder();
  const receipts = new Map(
    (await store.ledger.receipts()).map((receipt) => [
      receipt.record.id,
      receipt,
    ]),
  );
  const records: StoredMemoryRecord[] = [];
  for (const file of store.vault.getFilesByGlob(`${folder}/**/*.md`)) {
    const fileScope = noteScope(folder, file.path);
    if (!fileScope || (scope && !sameScope(scope, fileScope))) continue;
    const content = await store.vault.read(file);
    const kind = file.name === "MEMORY.md" ? "curated" : "daily";
    for (const block of noteBlocks(content)) {
      const receipt = receipts.get(block.id);
      if (
        !receipt ||
        !receipt.committed ||
        receipt.curated !== file.path ||
        !sameScope(receipt.record.scope, fileScope) ||
        !block.summary
      )
        continue;
      if (receipt.record.status === "retracted") continue;
      const edited = receipt.record.summary !== block.summary;
      const record: DurableMemoryRecord = edited
        ? {
            ...receipt.record,
            summary: block.summary,
            evidence: [],
            createdBy: "owner-ui",
          }
        : receipt.record;
      records.push({
        record,
        path: file.path,
        anchor: block.id,
        noteKind: kind,
        content: block.text,
        hash: await hash(block.text),
      });
    }
    const manual = handwrittenText(content);
    if (manual) {
      const id = `note-${(await hash(file.path)).slice(0, 32)}`;
      records.push({
        record: {
          schemaVersion: 1,
          id,
          revision: 1,
          kind: "fact",
          scope: fileScope,
          status: "active",
          importance: 3,
          triggers: [],
          summary: manual,
          evidence: [],
          createdBy: "owner-ui",
          createdAt: new Date(file.stat.ctime).toISOString(),
          updatedAt: new Date(file.stat.mtime).toISOString(),
        },
        path: file.path,
        noteKind: kind,
        content: manual,
        hash: await hash(manual),
      });
    }
  }
  return records;
}
