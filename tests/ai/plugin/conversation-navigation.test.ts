import { expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { openConversationRoute } from "../../../src/lib/ai/plugin/conversation-navigation.ts";
import { conversationLocationFromLeaf } from "../../../src/lib/ai/plugin/conversation-host.ts";
import type { ConversationRoute } from "../../../src/lib/ai/conversations/conversation-route.ts";

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

it("reuses the exact file-backed pane and reveals its scope", async () => {
  const pane = leaf({ conversationRoute: file }),
    f = fixture([pane]);
  await openConversationRoute(f.app, f.active, file);
  expect(f.workspace.activateLeaf.mock.calls[0]![0]).toBe(pane);
  expect(pane.setViewState).not.toHaveBeenCalled();
  expect(conversationLocationFromLeaf(pane)).toEqual(file.location);
});
it("does not overwrite a different local conversation", async () => {
  const pane = leaf({
      conversationRoute: {
        ...file,
        location: { ...file.location, scopeDir: "Other" },
      },
    }),
    f = fixture([pane]);
  await openConversationRoute(f.app, f.active, file);
  expect(pane.setViewState).not.toHaveBeenCalled();
  expect(f.created.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: { conversationRoute: file },
  });
});
it("Open Chat reaches the local ACP composer", async () => {
  const f = fixture([]);
  await openConversationRoute(f.app, f.active, null);
  expect(f.side.setViewState).toHaveBeenCalledExactlyOnceWith({
    type: "ai",
    state: {},
  });
});
it("rejects retired backend requests without interpreting their opaque IDs", async () => {
  const f = fixture([leaf()]);
  await expect(
    openConversationRoute(f.app, f.active, {
      version: 1,
      backend: "jj",
      conversation: { id: "native" },
    } as unknown as ConversationRoute),
  ).rejects.toThrow(/route/);
  expect(f.created.setViewState).not.toHaveBeenCalled();
});
it("rechecks plugin lifetime after asynchronous assignment", async () => {
  const f = fixture([]);
  f.active
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error("AI disabled");
    });
  await expect(openConversationRoute(f.app, f.active, file)).rejects.toThrow(
    /disabled/,
  );
  expect(f.workspace.activateLeaf).not.toHaveBeenCalled();
});
