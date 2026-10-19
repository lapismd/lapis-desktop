import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { conversationStorageKey } from "../../../src/lib/ai/conversations/transcript-store.ts";
import type { CapturedSession } from "../../../src/lib/ai/conversations/import-types.ts";
import type { ConversationSnapshot } from "../../../src/lib/ai/conversations/types.ts";
import { savedSessionGroups } from "../../../src/lib/ai/session-browser/saved-sessions.ts";
import { createSavedHistory } from "../../../src/lib/ai/session-browser/saved-history.svelte.ts";

function capture(
  index: number,
  profile = "codex-cli-0.156.1",
): CapturedSession {
  return {
    version: 1,
    source: {
      kind: "codex",
      profile,
      sessionKey: "a".repeat(64),
      snapshotKey: String(index).repeat(64),
    },
    createdAt: "2026-10-19T00:00:00.000Z",
    entries: [
      {
        id: "message",
        type: "message",
        role: "user",
        text: `Saved version ${index}`,
        createdAt: `2026-10-19T0${index}:00:00.000Z`,
      },
    ],
  };
}
async function fixture() {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const older = (await repository.imports.save(capture(1), "Notes")).snapshot;
  const current = (await repository.imports.save(capture(2), "Notes")).snapshot;
  const notifications = {
    createProgress: vi.fn(() => ({
      complete: vi.fn(),
      fail: vi.fn(),
      report: vi.fn(),
    })),
    clear: vi.fn(async () => {}),
    notify: vi.fn(),
  };
  const onLocationChange = vi.fn();
  const state = createSavedHistory({
    app: { notifications } as unknown as App,
    repository,
    snapshot: current,
    onLocationChange,
  });
  return { repository, state, older, current, notifications, onLocationChange };
}

it("groups imported versions by exact source/profile/scope and orders by captured update time", async () => {
  const f = await fixture();
  await f.repository.imports.save(capture(1, "codex-desktop-0.159.2"), "Notes");
  await f.repository.imports.save(capture(1), "Research");
  await f.repository.create({ scopeDir: "Notes" });
  const groups = savedSessionGroups(await f.repository.listAll(), f.current);
  expect(groups).toHaveLength(3);
  const selected = groups.find((g) =>
    g.versions.some((v) => v.id === conversationStorageKey(f.current.location)),
  )!;
  expect(selected.versions.map((v) => v.sequence)).toEqual([2, 1]);
  expect(selected.versions[0].entries).toEqual(f.current.transcript);
  expect(selected.versions[1].entries).toBeUndefined();
  expect(
    groups.flatMap((g) => g.versions).filter((v) => v.entries),
  ).toHaveLength(1);
  await f.state.close();
});

it("lists metadata without eagerly reading snapshots and selects through App progress without writing", async () => {
  const f = await fixture();
  const read = vi.spyOn(f.repository, "read");
  const append = vi.spyOn(f.repository, "appendTranscript");
  await f.state.refresh();
  expect(read).not.toHaveBeenCalled();
  await f.state.select(conversationStorageKey(f.older.location));
  expect(read).toHaveBeenCalledExactlyOnceWith(f.older.location);
  expect(append).not.toHaveBeenCalled();
  expect(f.state.selectedVersion).toBe(
    conversationStorageKey(f.older.location),
  );
  expect(f.onLocationChange).toHaveBeenCalledExactlyOnceWith(f.older.location);
  expect(f.notifications.createProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      location: "status",
      title: "Opening captured AI version",
    }),
  );
  await f.state.close();
});

it("rejects stale selected-version responses and fences and drains reads on close", async () => {
  const f = await fixture();
  await f.state.refresh();
  let release!: (value: ConversationSnapshot) => void;
  vi.spyOn(f.repository, "read").mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const oldRead = f.state.select(conversationStorageKey(f.older.location));
  await f.state.select(conversationStorageKey(f.current.location));
  release(f.older);
  await oldRead;
  expect(f.state.selectedVersion).toBe(
    conversationStorageKey(f.current.location),
  );
  expect(f.onLocationChange).toHaveBeenCalledTimes(1);
  vi.spyOn(f.repository, "read").mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const closingRead = f.state.select(conversationStorageKey(f.older.location));
  const closing = f.state.close();
  release(f.older);
  await Promise.all([closingRead, closing]);
  expect(f.state.selectedVersion).toBe(
    conversationStorageKey(f.current.location),
  );
  expect(f.onLocationChange).toHaveBeenCalledTimes(1);
  expect(f.notifications.notify).not.toHaveBeenCalled();
});

it("failed reads retain the selected version and publish one stable toast; successful retry clears it", async () => {
  const f = await fixture();
  await f.state.refresh();
  const read = vi
    .spyOn(f.repository, "read")
    .mockRejectedValueOnce(new Error("Saved snapshot is unavailable"));
  await f.state.select(conversationStorageKey(f.older.location));
  expect(f.state.selectedVersion).toBe(
    conversationStorageKey(f.current.location),
  );
  expect(f.notifications.notify).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      id: "ai-saved-history-failure",
      severity: "error",
      message: "Saved snapshot is unavailable",
    }),
  );
  read.mockRestore();
  await f.state.select(conversationStorageKey(f.older.location));
  expect(f.state.selectedVersion).toBe(
    conversationStorageKey(f.older.location),
  );
  expect(f.notifications.clear).toHaveBeenLastCalledWith(
    "ai-saved-history-failure",
  );
  await f.state.close();
});

it("incomplete and warned saved captures never expose their transcript", async () => {
  const f = await fixture();
  const rows = await f.repository.listAll();
  const incomplete = structuredClone(f.current);
  incomplete.metadata.imported!.state = "preparing";
  const groups = savedSessionGroups(
    [{ location: incomplete.location, metadata: incomplete.metadata }],
    incomplete,
  );
  expect(groups[0].versions[0]).toMatchObject({
    incomplete: true,
    entries: undefined,
  });
  const warned = {
    ...f.current,
    warnings: [
      {
        file: "transcript.jsonl" as const,
        line: 1,
        message: "Incomplete record",
      },
    ],
  };
  const projected = savedSessionGroups(rows, warned);
  expect(projected[0].versions[0]).toMatchObject({
    incomplete: true,
    entries: undefined,
  });
  await f.state.close();
});
