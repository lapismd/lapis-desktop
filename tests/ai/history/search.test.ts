// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { loadHistoryEntries } from "../../../src/lib/ai/history/search.ts";

async function seed() {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const conversation = await repository.create({
    id: "123e4567-e89b-42d3-a456-426614174000",
    scopeDir: "Notes",
    now: "2026-08-16T10:00:00.000Z",
  });
  await repository.appendTranscript(conversation.location, [
    {
      schemaVersion: 1,
      id: "m1",
      type: "message",
      role: "user",
      text: "Fix parser errors",
      createdAt: "2026-08-16T10:00:00.000Z",
    },
  ]);
  const [entry] = await repository.listAll();
  const ghost = {
    ...entry,
    location: {
      ...entry.location,
      conversationId: "223e4567-e89b-42d3-a456-426614174001",
    },
  };
  return { repository, entry, ghost };
}

describe("local-first History search", () => {
  it("retains local metadata and indexed preview without resurrecting deleted records", async () => {
    const { repository, entry, ghost } = await seed();
    const entries = await loadHistoryEntries(repository, "", async () => [
      {
        ...entry,
        metadata: { ...entry.metadata!, title: "Stale title" },
        preview: "Indexed preview",
        unavailableReason: "Stale index error",
      },
      ghost,
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].metadata?.title).toBe("Fix parser errors");
    expect(entries[0].preview).toBe("Indexed preview");
    expect(entries[0].unavailableReason).toBeUndefined();
  });
  it("searches local titles, folders and transcripts when the index fails", async () => {
    const { repository } = await seed();
    const unavailable = async () => {
      throw new Error("Index unavailable");
    };
    for (const query of ["parser", "Notes"])
      expect(
        await loadHistoryEntries(repository, query, unavailable),
      ).toHaveLength(1);
    expect(await loadHistoryEntries(repository, "", unavailable)).toHaveLength(
      1,
    );
  });
  it("keeps authoritative indexed hits even when local text does not match", async () => {
    const { repository, entry, ghost } = await seed();
    const entries = await loadHistoryEntries(
      repository,
      "output-only",
      async () => [
        { ...entry, preview: "output-only match in indexed tool output" },
        ghost,
      ],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].location).toEqual(entry.location);
    expect(entries[0].preview).toContain("output-only");
  });
  it("uses local matching transcripts and drops unrelated indexed ghosts", async () => {
    const { repository, ghost } = await seed();
    const entries = await loadHistoryEntries(repository, "errors", async () => [
      ghost,
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].metadata?.title).toBe("Fix parser errors");
  });
});
