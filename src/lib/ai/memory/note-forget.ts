// SPDX-License-Identifier: Apache-2.0
import type { VaultMemoryRecordStore } from "./vault-memory-record-store.ts";

/** Durable receipts preserve lineage even when the note was edited or excluded. */
export async function forgetMemoryNotes(
  store: VaultMemoryRecordStore,
  conversationId: string,
): Promise<{ retracted: number; needsReview: number }> {
  let retracted = 0,
    needsReview = 0;
  for (const receipt of await store.ledger.receipts()) {
    if (
      receipt.record.status !== "active" ||
      !receipt.record.evidence.some(
        (ref) => ref.conversationId === conversationId,
      )
    )
      continue;
    try {
      const current = (await store.find(receipt.record.id))[0];
      await store.write(
        {
          ...receipt.record,
          status: "retracted",
          revision: receipt.record.revision + 1,
          previousRevisionHash: current?.hash,
          updatedAt: new Date().toISOString(),
        },
        current ? { expectedCurrentHash: current.hash } : {},
      );
      retracted++;
    } catch {
      needsReview++;
    }
  }
  return { retracted, needsReview };
}
