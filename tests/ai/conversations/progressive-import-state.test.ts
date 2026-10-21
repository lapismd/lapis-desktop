import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import type {
  AiImportSources,
  PreviewPage,
} from "../../../src/lib/ai/imports/source-port.ts";
import { createImportState } from "../../../src/lib/ai/imports/state.svelte.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import type { CapturedSession } from "../../../src/lib/ai/conversations/import-types.ts";
function fixture() {
  const capture: CapturedSession = {
    version: 1,
    source: {
      kind: "codex",
      profile: "codex-cli-0.156.1",
      sessionKey: "a".repeat(64),
      snapshotKey: "b".repeat(64),
    },
    createdAt: "2026-10-21T10:00:00Z",
    entries: [
      {
        type: "message",
        id: "first",
        role: "user",
        text: "Captured request",
        createdAt: "2026-10-21T10:00:00Z",
      },
      {
        type: "message",
        id: "second",
        role: "assistant",
        text: "Captured answer",
        createdAt: "2026-10-21T10:00:01Z",
      },
    ],
  };
  const folder = {
    selector: "folder",
    label: "Project",
    location: "~/Project",
    count: 1,
  };
  const row = {
    selector: "session",
    folder: "folder",
    kind: "codex" as const,
    title: "Session",
    profile: "Codex CLI",
    updatedAt: capture.createdAt,
    bytes: 1024,
  };
  const sources = {
    folders: vi.fn(async () => ({
      folders: [folder],
      indexed: 1,
      complete: true,
      limited: false,
    })),
    sessions: vi.fn(async () => ({ rows: [row], total: 1, next: null })),
    startPreview: vi.fn(
      async () =>
        ({
          reader: "read-one",
          entries: capture.entries.slice(0, 1),
          order: ["first"],
          progress: 50,
        }) as PreviewPage,
    ),
    nextPreview: vi.fn(
      async () =>
        ({
          reader: "read-one",
          entries: capture.entries,
          progress: 100,
          capture,
        }) as PreviewPage,
    ),
    releasePreview: vi.fn(async () => {}),
  } satisfies AiImportSources;
  const notifications = {
    createProgress: vi.fn(() => ({
      report: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
    })),
    notify: vi.fn(),
    clear: vi.fn(async () => {}),
  };
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const state = createImportState({
    app: { notifications } as unknown as App,
    repository,
    sources,
    scopeDir: "Notes",
    onDispose: () => {},
  });
  return { state, sources, repository, capture, notifications };
}
async function browse(f: ReturnType<typeof fixture>) {
  await f.state.browser.loadHarness("codex", true);
  await f.state.browser.openFolder("folder", "codex");
}
it("loads metadata first, then only the chosen folder and retains its cache", async () => {
  const f = fixture();
  await f.state.browser.loadHarness("codex", true);
  expect(f.sources.sessions).not.toHaveBeenCalled();
  expect(f.sources.startPreview).not.toHaveBeenCalled();
  await f.state.browser.openFolder("folder", "codex");
  await f.state.browser.openFolder("folder", "codex");
  expect(f.sources.sessions).toHaveBeenCalledTimes(1);
  expect(f.sources.startPreview).not.toHaveBeenCalled();
  await f.state.close();
});
it("keeps partial previews unsaveable and caches only verified snapshots", async () => {
  const f = fixture();
  await browse(f);
  let finish!: (p: PreviewPage) => void;
  f.sources.nextPreview.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const reading = f.state.select("session");
  await vi.waitFor(() => expect(f.state.entries).toHaveLength(1));
  expect(f.state.plan).toBeUndefined();
  await f.state.save();
  expect(await f.repository.listAll()).toEqual([]);
  await vi.waitFor(() =>
    expect(f.sources.nextPreview).toHaveBeenCalledTimes(1),
  );
  finish({
    reader: "read-one",
    entries: f.capture.entries,
    progress: 100,
    capture: f.capture,
  });
  await reading;
  expect(f.state.phase).toBe("ready");
  await f.state.save();
  expect(f.state.saved?.duplicate).toBe(false);
  await f.state.select("session");
  expect(f.sources.startPreview).toHaveBeenCalledTimes(1);
  expect(f.state.cachedPreview).toBe(true);
  await f.state.close();
});
it("pauses pulling batches and resumes the same native read", async () => {
  const f = fixture();
  await browse(f);
  let first!: (p: PreviewPage) => void;
  f.sources.startPreview.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        first = resolve;
      }),
  );
  const reading = f.state.select("session");
  f.state.togglePause();
  first({
    reader: "read-one",
    entries: f.capture.entries.slice(0, 1),
    order: ["first"],
    progress: 50,
  });
  await vi.waitFor(() => expect(f.state.entries).toHaveLength(1));
  expect(f.sources.nextPreview).not.toHaveBeenCalled();
  f.state.togglePause();
  await reading;
  expect(f.state.phase).toBe("ready");
  await f.state.close();
});
