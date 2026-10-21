// SPDX-License-Identifier: Apache-2.0
import type { DurableMemoryRecord } from "./types.ts";
import { MemoryNoteIO } from "./note-io.ts";

export type MemoryReceipt = {
  record: DurableMemoryRecord;
  history: DurableMemoryRecord[];
  daily: string[];
  curated: string;
  committed: boolean;
  timezone: string;
  currentDaily: string;
  baselines: Record<string, string | null>;
};
export type MemoryState = {
  folder: string;
  activatedAt: string;
  checkpoints: Record<string, string[]>;
  excluded: string[];
  suppressed: string[];
  relocation?: { from: string; to: string };
};
export const MEMORY_STATE_PATH = ".lapis/memory/state.json";
export class MemoryLedger {
  constructor(readonly io: MemoryNoteIO) {}
  async initialize(now: Date, folder = "Memory"): Promise<MemoryState> {
    const current = await this.io.read(MEMORY_STATE_PATH);
    if (current) return JSON.parse(current) as MemoryState;
    const state: MemoryState = {
      folder,
      activatedAt: now.toISOString(),
      checkpoints: {},
      excluded: [],
      suppressed: [],
    };
    await this.io.update(
      MEMORY_STATE_PATH,
      (text) => text ?? JSON.stringify(state, null, 2) + "\n",
    );
    return this.state();
  }
  async state(): Promise<MemoryState> {
    const text = await this.io.read(MEMORY_STATE_PATH);
    if (!text) throw new Error("Memory has not been initialized");
    return JSON.parse(text) as MemoryState;
  }
  async update(apply: (state: MemoryState) => void): Promise<void> {
    await this.io.update(MEMORY_STATE_PATH, (text) => {
      if (!text) throw new Error("Memory has not been initialized");
      const state = JSON.parse(text) as MemoryState;
      apply(state);
      return JSON.stringify(state, null, 2) + "\n";
    });
  }
  path(id: string) {
    return `.lapis/memory/entries/${id}.json`;
  }
  async receipt(id: string): Promise<MemoryReceipt | undefined> {
    const text = await this.io.read(this.path(id));
    return text ? (JSON.parse(text) as MemoryReceipt) : undefined;
  }
  async receipts(): Promise<MemoryReceipt[]> {
    const directory = ".lapis/memory/entries";
    if (!(await this.io.vault.adapter.exists(directory))) return [];
    const listed = await this.io.vault.adapter.list(directory);
    return Promise.all(
      listed.files
        .filter((name) => /^[a-z0-9-]+\.json$/u.test(name))
        .map(
          async (name) =>
            JSON.parse(
              await this.io.vault.adapter.read(`${directory}/${name}`),
            ) as MemoryReceipt,
        ),
    );
  }
  async save(receipt: MemoryReceipt): Promise<void> {
    await this.io.update(
      this.path(receipt.record.id),
      () => JSON.stringify(receipt, null, 2) + "\n",
    );
  }
}
