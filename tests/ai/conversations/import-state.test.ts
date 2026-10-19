import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { createImportState } from "../../../src/lib/ai/imports/state.svelte.ts";
import { validateImportRows } from "../../../src/lib/ai/imports/source-port.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import type { CapturedSession } from "../../../src/lib/ai/conversations/import-types.ts";
const c: CapturedSession = {
  version: 1,
  source: {
    kind: "codex",
    profile: "codex-cli-0.156.1",
    sessionKey: "a".repeat(64),
    snapshotKey: "b".repeat(64),
  },
  createdAt: "2026-10-19T00:00:00.000Z",
  entries: [
    {
      id: "1",
      createdAt: "2026-10-19T00:00:00.000Z",
      type: "message",
      role: "user",
      text: "Captured message",
    },
  ],
};
it("rejects raw paths, duplicate selectors and unbounded source labels", () => {
  const row = {
    selector: "opaque",
    title: "Captured title",
    profile: "Codex CLI",
    updatedAt: c.createdAt,
  };
  expect(validateImportRows([row])).toEqual([row]);
  expect(() => validateImportRows([row, row])).toThrow();
  expect(() =>
    validateImportRows([{ ...row, selector: "/private/source.jsonl" }]),
  ).toThrow();
  expect(() =>
    validateImportRows([{ ...row, title: "a".repeat(161) }]),
  ).toThrow();
});
function fixture() {
  const progress = { complete: vi.fn(), fail: vi.fn(), report: vi.fn() };
  const notifications = {
    createProgress: vi.fn(() => progress),
    notify: vi.fn(),
    clear: vi.fn(async () => {}),
  };
  const app = { notifications } as unknown as App,
    store = new MemoryTranscriptStore(),
    repository = new ConversationRepository(store);
  const source = {
    list: vi.fn(async () => [
      {
        selector: "opaque",
        title: "Safe title",
        profile: "Codex CLI",
        updatedAt: c.createdAt,
      },
    ]),
    preview: vi.fn(async () => structuredClone(c)),
  };
  const state = createImportState({
    app,
    repository,
    sources: source,
    scopeDir: "Notes",
    onDispose: () => {},
  });
  return { state, source, store, repository, notifications, progress };
}
it("preview is non-writing and explicit save reports App progress", async () => {
  const f = fixture();
  await f.state.refresh();
  await f.state.select("opaque");
  expect(await f.repository.listAll()).toEqual([]);
  expect(f.state.plan?.entries).toHaveLength(1);
  await f.state.save();
  expect(f.state.saved?.duplicate).toBe(false);
  await f.state.save();
  expect(f.state.saved?.duplicate).toBe(true);
  expect(f.notifications.createProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      location: "status",
      title: "Saving imported transcript",
    }),
  );
  expect(f.progress.complete).toHaveBeenCalledTimes(4);
  await f.state.close();
});
it("unknown source selectors cannot read, save or publish a preview", async () => {
  const f = fixture();
  await f.state.select("foreign");
  await f.state.save();
  expect(f.source.preview).not.toHaveBeenCalled();
  expect(f.state.plan).toBeUndefined();
  expect(await f.repository.listAll()).toEqual([]);
  await f.state.close();
});
it("failure retains the selected preview and uses one stable notification", async () => {
  const f = fixture();
  await f.state.refresh();
  await f.state.select("opaque");
  const before = f.state.plan;
  f.source.preview.mockRejectedValueOnce(new Error("Source unavailable"));
  await f.state.select("opaque");
  expect(f.state.plan).toEqual(before);
  expect(f.state.selected).toBe("opaque");
  expect(f.notifications.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "ai-import-failure",
      message: "Source unavailable",
      severity: "error",
    }),
  );
  await f.state.select("opaque");
  expect(f.notifications.clear).toHaveBeenLastCalledWith("ai-import-failure");
  await f.state.close();
});
it("closing aborts and drains an outstanding native read without late updates or toasts", async () => {
  const f = fixture();
  await f.state.refresh();
  let aborted = false;
  f.source.preview.mockImplementationOnce(
    async (_selector?: string, signal?: AbortSignal) =>
      new Promise((resolve) =>
        signal?.addEventListener(
          "abort",
          () => {
            aborted = true;
            resolve(c);
          },
          { once: true },
        ),
      ),
  );
  const read = f.state.select("opaque");
  await Promise.resolve();
  const close = f.state.close();
  await Promise.all([read, close]);
  expect(aborted).toBe(true);
  expect(f.state.plan).toBeUndefined();
  expect(f.notifications.notify).not.toHaveBeenCalled();
});
