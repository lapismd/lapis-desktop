import { afterEach, expect, it, vi } from "vitest";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
import { observeTaskTransport } from "../../desktop/tasks-transport.ts";

const bypass = vi.hoisted(() =>
  vi.fn(async () => {
    throw new Error("Native transport bypassed the injected call");
  }),
);
vi.mock("@tauri-apps/api/core", () => ({ invoke: bypass }));
vi.mock("@lapis-notes/api", () => ({
  NativeDesktopVaultAdapter: class {},
  createVaultSession: async () => ({}),
}));
vi.mock("../../../src/lib/native/database/native-database-provider.ts", () => ({
  createNativeDatabaseProvider: () => ({}),
}));

import { openNotesSession } from "../../../src/lib/notes/notes-session.ts";

const selected = {
  profileId: "profile",
  sessionId: "admitted",
  name: "Isolated fixture",
  path: "/isolated/vault",
  resourceToken: "resource",
};
const saved = {
  path: "Note.md",
  text: "saved native bytes",
  version: "native",
};
afterEach(() => vi.clearAllMocks());

it("session editing and Tasks ports share the injected admitted transport", async () => {
  const calls: unknown[][] = [];
  const call: NativeCall = async <T>(command: string, args?: unknown) => {
    calls.push([command, args]);
    return (
      command === "vault_editing_snapshot"
        ? saved
        : { kind: "states", states: [] }
    ) as T;
  };
  const session = await openNotesSession(
    selected,
    "core",
    "core",
    "core",
    call,
  );
  await session.nativeEditingIntents!.call({ kind: "list" });
  expect(await session.nativeEditingIntents!.read("Note.md")).toBe(saved);
  await session.nativeTasks!.call({ kind: "status" });
  expect(calls).toEqual([
    [
      "vault_editing_intents",
      { sessionId: "admitted", command: { kind: "list" } },
    ],
    ["vault_editing_snapshot", { sessionId: "admitted", path: "Note.md" }],
    ["vault_tasks", { sessionId: "admitted", command: { kind: "status" } }],
  ]);
  expect(bypass).not.toHaveBeenCalled();
});

it("the real session port consumes one protected-observation fault without retry or fabricated success", async () => {
  const invoke = vi.fn(async () => saved);
  const transport = observeTaskTransport({ invoke });
  const session = await openNotesSession(
    selected,
    "core",
    "core",
    "core",
    transport.invoke as NativeCall,
  );
  transport.failNextEditingSnapshot("Note.md");
  await expect(session.nativeEditingIntents!.read("Note.md")).rejects.toThrow(
    "Protected saved-text observation failed: Note.md",
  );
  expect(invoke).not.toHaveBeenCalled();
  expect(transport.snapshot().failedEditingSnapshots).toEqual(["Note.md"]);
  expect(await session.nativeEditingIntents!.read("Note.md")).toBe(saved);
  expect(invoke).toHaveBeenCalledExactlyOnceWith(
    "vault_editing_snapshot",
    { sessionId: "admitted", path: "Note.md" },
    undefined,
  );
  expect(bypass).not.toHaveBeenCalled();
  transport.dispose();
});
