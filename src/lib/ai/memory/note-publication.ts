import { validateMemoryRecord } from "./memory-record-codec.ts";
import { noteScope, scopeDirectory, memoryTimezone } from "./note-paths.ts";
import { sameScope } from "./paths.ts";
// SPDX-License-Identifier: Apache-2.0
import { MemoryRecordConflictError } from "./memory-record-store.ts";
import {
  noteBlocks,
  renderMemoryBlock,
  replaceMemoryBlock,
} from "./note-codec.ts";
import type { MemoryLedger, MemoryReceipt } from "./note-ledger.ts";

/** Resume only the exact prepared blocks, preserving edits made after preparation. */
export async function publishMemoryReceipt(
  ledger: MemoryLedger,
  receipt: MemoryReceipt,
  folder: string,
): Promise<void> {
  const { record, timezone, currentDaily } = receipt;
  validateMemoryRecord(record);
  memoryTimezone(timezone);
  const directory = scopeDirectory(folder, record.scope);
  if (
    receipt.curated !== `${directory}/MEMORY.md` ||
    !receipt.daily.includes(currentDaily) ||
    receipt.daily.some((path) => {
      const scope = noteScope(folder, path);
      return (
        !scope ||
        !sameScope(scope, record.scope) ||
        !/^\d{4}-\d{2}-\d{2}\.md$/u.test(path.split("/").at(-1)!)
      );
    })
  )
    throw new MemoryRecordConflictError(
      "Memory publication paths do not match their scope",
    );
  const paths =
    record.status === "retracted"
      ? [...receipt.daily, receipt.curated]
      : [currentDaily, receipt.curated];
  for (const path of paths) {
    if (record.status === "retracted" && (await ledger.io.read(path)) === null)
      continue;
    const dailyName = currentDaily.split("/").at(-1)!;
    const target =
      record.status === "retracted"
        ? ""
        : renderMemoryBlock(
            record,
            timezone,
            path === receipt.curated ? dailyName : undefined,
          );
    await ledger.io.update(path, (text) => {
      const blocks = noteBlocks(text ?? "").filter(
        (block) => block.id === record.id,
      );
      if (blocks.length > 1)
        throw new MemoryRecordConflictError("Memory anchor is ambiguous");
      const current = blocks[0]?.text ?? null;
      if (
        record.status !== "retracted" &&
        current !== (receipt.baselines[path] ?? null) &&
        current !== target
      )
        throw new MemoryRecordConflictError(
          "Memory note changed after publication was prepared",
        );
      return replaceMemoryBlock(
        text ??
          (path === receipt.curated
            ? "# Memory\n"
            : `# ${dailyName.slice(0, -3)}\n`),
        record.id,
        target,
      );
    });
  }
  if (record.status === "retracted")
    await ledger.update((state) => {
      if (!state.suppressed.includes(record.id))
        state.suppressed.push(record.id);
    });
  receipt.committed = true;
  await ledger.save(receipt);
}
