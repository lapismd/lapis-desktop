// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { ConversationIndexCoordinator } from "../../../src/lib/ai/conversations/conversation-index-coordinator.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { NativeMemoryService } from "../../../src/lib/ai/memory/native-memory-service.ts";
import { MemoryIngestionCoordinator } from "../../../src/lib/ai/memory/memory-ingestion-coordinator.ts";
import { MemoryMaintenanceScheduler } from "../../../src/lib/ai/memory/memory-scheduler.ts";
function gate() {
  let release!: () => void;
  let enter!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    enter = resolve;
  });
  return { blocked, entered, release, enter };
}
const path =
  ".lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000/metadata.yaml";
describe("owned AI maintenance shutdown", () => {
  it("awaits an in-flight index write and does not start fallback deletion after disposal", async () => {
    const pending = gate();
    const index = {
      sync: vi.fn(async () => {
        pending.enter();
        await pending.blocked;
        throw new Error("Closed source");
      }),
      delete: vi.fn(async () => {}),
    };
    const coordinator = new ConversationIndexCoordinator(index);
    coordinator.handleVaultChange(path);
    const flush = coordinator.flush();
    try {
      await pending.entered;
      coordinator.dispose();
      let closed = false;
      const close = coordinator.settle().then(() => {
        closed = true;
      });
      await Promise.resolve();
      expect(closed).toBe(false);
      coordinator.handleVaultChange(path);
      pending.release();
      await close;
      await coordinator.flush();
      expect(index.sync).toHaveBeenCalledOnce();
      expect(index.delete).not.toHaveBeenCalled();
    } finally {
      pending.release();
      coordinator.dispose();
      await flush;
    }
  });
  it("awaits memory ingestion before its database owner can close", async () => {
    const database = new MemoryAppDatabase(crypto.randomUUID());
    await database.open();
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memory = new NativeMemoryService(repository, database);
    const pending = gate();
    vi.spyOn(memory, "rebuild").mockImplementation(async () => {
      pending.enter();
      await pending.blocked;
      await database.listMemorySourceStates();
      return { conversations: 0, episodes: 0, skipped: 0, inconsistent: 0 };
    });
    const coordinator = new MemoryIngestionCoordinator(repository, memory);
    coordinator.startCatchUp();
    const flush = coordinator.flush();
    try {
      await pending.entered;
      coordinator.dispose();
      let closed = false;
      const close = coordinator.settle().then(async () => {
        await database.close();
        closed = true;
      });
      await Promise.resolve();
      expect(closed).toBe(false);
      pending.release();
      await close;
      expect(closed).toBe(true);
    } finally {
      pending.release();
      coordinator.dispose();
      await flush;
      await database.close();
    }
  });
  it("fences disposed consolidation after an asynchronous preview without claiming a job", async () => {
    const database = new MemoryAppDatabase(crypto.randomUUID());
    await database.open();
    const memory = new NativeMemoryService(
      new ConversationRepository(new MemoryTranscriptStore()),
      database,
    );
    const pending = gate();
    const scope = { kind: "workspace" } as const;
    vi.spyOn(memory, "previewConsolidation").mockImplementation(async () => {
      pending.enter();
      await pending.blocked;
      return { scope, candidateIds: ["candidate"], proposals: 1 };
    });
    const claim = vi.spyOn(database, "claimMemoryJob");
    const consolidate = vi.spyOn(memory, "consolidate");
    const scheduler = new MemoryMaintenanceScheduler(database, memory);
    const run = scheduler.run(scope);
    try {
      await pending.entered;
      scheduler.dispose();
      let settled = false;
      const close = scheduler.settle().then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);
      pending.release();
      await close;
      expect(await run).toBeNull();
      expect(claim).not.toHaveBeenCalled();
      expect(consolidate).not.toHaveBeenCalled();
    } finally {
      pending.release();
      scheduler.dispose();
      await run;
      await database.close();
    }
  });
});
