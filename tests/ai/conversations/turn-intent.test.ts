import { expect, it, vi } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { validateTurnIntent } from "../../../src/lib/ai/conversations/turn-intent.ts";
import type { TranscriptEntry } from "../../../src/lib/ai/conversations/types.ts";

const intent = (id: string) => ({
  version: 1 as const,
  id,
  userEntryId: `user-${id}`,
  agentBindingId: "binding-local",
  startedAt: "2026-10-19T00:00:00.000Z",
});
const user = (id: string): Extract<TranscriptEntry, { type: "message" }> => ({
  schemaVersion: 1,
  id: `user-${id}`,
  type: "message",
  role: "user",
  text: `Exact authored ${id}`,
  createdAt: intent(id).startedAt,
});
async function fixture() {
  const store = new MemoryTranscriptStore();
  const repo = new ConversationRepository(store);
  const { location } = await repo.create({ scopeDir: "Notes" });
  return { store, repo, location };
}

it("retains unknown intent, refuses repeats/active displacement and fences stale settlement", async () => {
  const { repo, location } = await fixture();
  await repo.turns.prepare(location, intent("one"), user("one"));
  await expect(
    repo.turns.prepare(location, intent("one"), user("one")),
  ).rejects.toThrow("twice");
  await expect(
    repo.turns.prepare(location, intent("two"), user("two"), "one"),
  ).rejects.toThrow("active");
  expect(await repo.turns.finish(location, "one", false)).toEqual(
    intent("one"),
  );
  expect(repo.turns.isActive(location, "one")).toBe(false);
  await expect(
    repo.turns.prepare(location, intent("two"), user("two")),
  ).rejects.toThrow("unconfirmed");
  await repo.turns.prepare(location, intent("two"), user("two"), "one");
  await expect(repo.turns.finish(location, "one", true)).rejects.toThrow(
    "stale",
  );
  expect(repo.turns.isActive(location, "two")).toBe(true);
  const snapshot = await repo.read(location);
  expect(snapshot.transcript.map((entry) => entry.id)).toEqual([
    "user-one",
    "turn-unknown:one",
    "user-two",
  ]);
  expect(snapshot.transcript[1]).toMatchObject({
    type: "error",
    retryable: false,
    parentId: "user-one",
  });
  await repo.turns.finish(location, "two", true);
  expect((await repo.read(location)).metadata.pendingTurn).toBeUndefined();
});

it("releases the active owner even when settlement cannot read the file", async () => {
  const { repo, store, location } = await fixture();
  await repo.turns.prepare(location, intent("one"), user("one"));
  vi.spyOn(store, "read").mockRejectedValueOnce(new Error("File unavailable"));
  await expect(repo.turns.finish(location, "one", true)).rejects.toThrow(
    "unavailable",
  );
  expect(repo.turns.isActive(location, "one")).toBe(false);
  expect(repo.turns.recovery(await repo.read(location))).toEqual(intent("one"));
});

it("does not claim recovery when the original authored record is absent", async () => {
  const { repo, location } = await fixture();
  const snapshot = await repo.read(location);
  snapshot.metadata.pendingTurn = intent("missing");
  expect(() => repo.turns.recovery(snapshot)).toThrow("authored message");
});

it("preserves a recoverable intent when clearing metadata fails", async () => {
  const { repo, store, location } = await fixture();
  await repo.turns.prepare(location, intent("one"), user("one"));
  vi.spyOn(store, "writeMetadata").mockRejectedValueOnce(
    new Error("Disk full"),
  );
  await expect(repo.turns.finish(location, "one", true)).rejects.toThrow(
    "Disk full",
  );
  expect(repo.turns.recovery(await repo.read(location))).toEqual(intent("one"));
});

it("serializes metadata edits with turn preparation and preserves the intent", async () => {
  const { repo, location } = await fixture();
  await Promise.all([
    repo.turns.prepare(location, intent("one"), user("one")),
    repo.writePinned(location, true),
  ]);
  expect((await repo.read(location)).metadata).toMatchObject({
    pinned: true,
    pendingTurn: intent("one"),
  });
});

it("accepts only the bounded versioned turn-intent fields", () => {
  expect(validateTurnIntent(intent("one"))).toEqual(intent("one"));
  for (const invalid of [
    { ...intent("one"), version: 2 },
    { ...intent("one"), prompt: "private prompt" },
    { ...intent("one"), id: "x".repeat(513) },
    { ...intent("one"), startedAt: "unknown" },
  ])
    expect(() => validateTurnIntent(invalid)).toThrow();
});
