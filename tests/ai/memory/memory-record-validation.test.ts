import { InMemoryMemoryRecordStore } from "../../../src/lib/ai/memory/memory-record-store.ts";
import { describe, expect, it } from "vitest";
import {
  serializeMemoryRecord,
  validateMemoryRecord,
} from "../../../src/lib/ai/memory/memory-record-codec.ts";
import type { DurableMemoryRecord } from "../../../src/lib/ai/memory/types.ts";
const record: DurableMemoryRecord = {
  schemaVersion: 1,
  id: "owner-memory",
  revision: 1,
  kind: "fact",
  scope: { kind: "workspace" },
  status: "active",
  importance: 3,
  triggers: [],
  summary: "Owner-authored memory",
  evidence: [],
  createdBy: "owner-ui",
  createdAt: "2026-08-20T09:00:00.000Z",
  updatedAt: "2026-08-20T09:00:00.000Z",
};
describe("memory record validation", () => {
  it.each([undefined, null, 0, true])(
    "rejects a non-string record identity: %s",
    (id) => {
      expect(() => validateMemoryRecord({ ...record, id })).toThrow(
        "Memory ID is invalid",
      );
    },
  );
  it("does not write a record larger than the reader can admit", () => {
    expect(() =>
      serializeMemoryRecord({ ...record, summary: "x".repeat(512 * 1024) }),
    ).toThrow("maximum supported size");
  });

  it("does not retain a revision preimage when serializing the replacement fails", async () => {
    const store = new InMemoryMemoryRecordStore();
    const first = await store.write(record);
    await expect(
      store.write(
        {
          ...record,
          revision: 2,
          previousRevisionHash: first.hash,
          summary: "x".repeat(512 * 1024),
        },
        { expectedCurrentHash: first.hash },
      ),
    ).rejects.toThrow("maximum supported size");
    await expect(store.listHistory(record.id, record.scope)).resolves.toEqual(
      [],
    );
    await expect(store.find(record.id)).resolves.toEqual([first]);
  });
});
