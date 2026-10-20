import { expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { openConversationRoute } from "../../../src/lib/ai/plugin/conversation-navigation.ts";
import { conversationLocationFromLeaf } from "../../../src/lib/ai/plugin/conversation-host.ts";
import type { ConversationRoute } from "../../../src/lib/ai/conversations/conversation-route.ts";

const native: ConversationRoute = {
  version: 1,
  backend: "jj",
  conversation: {
    target: { type: "conversation", id: "remote:notes/研究" },
    threadId: "a".repeat(32),
    repository: "b".repeat(32),
  },
};
const file: ConversationRoute = {
  version: 1,
  backend: "vault-files",
  location: {
    scopeDir: "Notes",
    conversationId: "123e4567-e89b-42d3-a456-426614174000",
  },
};
function leaf(state: Record<string, unknown> = {}) {
  return {
    view: { getViewType: () => "ai", getState: () => state },
    setViewState: vi.fn(async () => {}),
  } as unknown as WorkspaceLeaf;
}
function fixture(leaves: WorkspaceLeaf[]) {
  const created = leaf(),
    side = leaf(),
    active = vi.fn();
  const workspace = {
    iterateRootLeaves: (visit: (value: WorkspaceLeaf) => void) =>
      leaves.forEach(visit),
    getLeavesOfType: () => leaves,
    getLeaf: vi.fn(() => created),
    ensureSideLeaf: vi.fn(() => side),
    activateLeaf: vi.fn(),
    revealLeaf: vi.fn(async () => {}),
  };
  const commands = { executeCommand: vi.fn(async () => {}) };
  return {
    app: { workspace, commands } as unknown as App,
    workspace,
    commands,
    created,
    side,
    active,
  };
}

it("reuses an exact native pane without interpreting it as a file scope", async () => {
  const selected = leaf({ conversationRoute: native });
  const f = fixture([selected]);
  await openConversationRoute(f.app, f.active, native);
  expect(f.workspace.activateLeaf.mock.calls[0]![0]).toBe(selected);
  expect(selected.setViewState).not.toHaveBeenCalled();
  expect(f.commands.executeCommand).not.toHaveBeenCalled();
  expect(conversationLocationFromLeaf(selected)).toBeNull();
});

it("keeps ordinary ACP/file panes when opening native history and keeps native panes when opening normal chat", async () => {
  const normal = leaf({ ...file.location });
  const first = fixture([normal]);
  await openConversationRoute(first.app, first.active, native);
  expect(normal.setViewState).not.toHaveBeenCalled();
  expect(first.created.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: { conversationRoute: native },
  });
  const recorded = leaf({ conversationRoute: native });
  const second = fixture([recorded]);
  await openConversationRoute(second.app, second.active, file);
  expect(recorded.setViewState).not.toHaveBeenCalled();
  expect(second.created.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: { conversationRoute: file },
  });
  expect(second.commands.executeCommand).toHaveBeenCalledWith(
    "lapis-file-explorer:reveal-path",
    "Notes",
  );
});

it("recognizes legacy file state and versioned file state as the same conversation", async () => {
  for (const state of [{ ...file.location }, { conversationRoute: file }]) {
    const normal = leaf(state),
      f = fixture([normal]);
    await openConversationRoute(f.app, f.active, file);
    expect(f.workspace.getLeaf).not.toHaveBeenCalled();
    expect(f.workspace.activateLeaf.mock.calls[0]![0]).toBe(normal);
    expect(conversationLocationFromLeaf(normal)).toEqual(file.location);
  }
});

it("Open Chat still reaches the normal ACP composer when only native history is open", async () => {
  const recorded = leaf({ conversationRoute: native });
  const f = fixture([recorded]);
  await openConversationRoute(f.app, f.active, null);
  expect(recorded.setViewState).not.toHaveBeenCalled();
  expect(f.created.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: {},
  });
  expect(f.workspace.activateLeaf.mock.calls[0]![0]).toBe(f.created);
  expect(f.workspace.ensureSideLeaf).not.toHaveBeenCalled();
  const normal = leaf({ conversationRoute: file }),
    both = fixture([recorded, normal]);
  await openConversationRoute(both.app, both.active, null);
  expect(both.workspace.activateLeaf.mock.calls[0]![0]).toBe(normal);
  expect(both.workspace.getLeaf).not.toHaveBeenCalled();
});

it("only assigns a genuinely unbound pane and never aliases another native repository", async () => {
  const foreign = leaf({
    conversationRoute: {
      ...native,
      conversation: { ...native.conversation, repository: "c".repeat(32) },
    },
  });
  const empty = leaf(),
    f = fixture([foreign, empty]);
  await openConversationRoute(f.app, f.active, native);
  expect(foreign.setViewState).not.toHaveBeenCalled();
  expect(empty.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: { conversationRoute: native },
  });
  expect(f.workspace.getLeaf).not.toHaveBeenCalled();
});

it("rejects malformed or mixed routes before mutating a pane rather than falling back", async () => {
  const f = fixture([leaf()]);
  await expect(
    openConversationRoute(f.app, f.active, {
      ...native,
      conversation: { ...native.conversation, repository: null },
    } as unknown as ConversationRoute),
  ).rejects.toThrow(/route/);
  const mixed = fixture([
    leaf({ conversationRoute: native, ...file.location }),
  ]);
  await expect(
    openConversationRoute(mixed.app, mixed.active, file),
  ).rejects.toThrow(/route/);
  expect(f.workspace.activateLeaf).not.toHaveBeenCalled();
  expect(mixed.created.setViewState).not.toHaveBeenCalled();
});

it("rechecks plugin lifetime after asynchronous tab assignment", async () => {
  const f = fixture([]);
  f.active
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error("AI disabled");
    });
  await expect(openConversationRoute(f.app, f.active, native)).rejects.toThrow(
    /disabled/,
  );
  expect(f.workspace.activateLeaf).not.toHaveBeenCalled();
  expect(f.workspace.revealLeaf).not.toHaveBeenCalled();
});
