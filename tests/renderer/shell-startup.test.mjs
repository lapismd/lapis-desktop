import { test } from "node:test";
import assert from "node:assert/strict";
import { startShell } from "../../src/lib/desktop/shell-startup.ts";

function fixture() {
  const events = [];
  const document = {
    documentElement: { dataset: {} },
    getElementById: () => ({ setAttribute: (...args) => events.push(args) }),
  };
  return { events, document };
}
test("ready content is exposed only after the native readiness acknowledgement", async () => {
  const { events, document } = fixture();
  await startShell({
    document,
    mount: () => events.push("mount"),
    call: async (command) => {
      events.push(command);
      if (command === "shell_info")
        return {
          os: "macos",
          runtime: "tauri-desktop",
          version: "0.1.0",
          ready: false,
        };
      assert.equal(document.documentElement.dataset.shellReady, undefined);
    },
  });
  assert.deepEqual(events, [
    "shell_info",
    "mount",
    "shell_ready",
    ["hidden", ""],
  ]);
  assert.equal(document.documentElement.dataset.lapisPlatform, "macos");
  assert.equal(document.documentElement.dataset.shellReady, "true");
  assert.equal(document.documentElement.dataset.appStateDirectory, ".lapis");
  assert.equal(document.documentElement.dataset.lapisRuntime, "tauri-desktop");
  assert.equal(document.documentElement.dataset.runtimeClass, "desktop");
  assert.equal(document.documentElement.dataset.metadataOwner, "renderer");
});
test("native metadata selection reaches session construction before plugins mount", async () => {
  const { document } = fixture();
  await startShell({
    document,
    mount: () =>
      assert.equal(document.documentElement.dataset.metadataOwner, "core"),
    call: async (command) =>
      command === "shell_info"
        ? { runtime: "tauri-desktop", os: "macos", metadataOwner: "core" }
        : undefined,
  });
  const invalid = fixture();
  await assert.rejects(
    startShell({
      document: invalid.document,
      mount: () => invalid.events.push("mount"),
      call: async () => ({
        runtime: "tauri-desktop",
        os: "macos",
        metadataOwner: "auto",
      }),
    }),
    /invalid metadata owner/u,
  );
  assert.deepEqual(invalid.events, []);
});
test("native startup failure preserves loading presentation for the error handler", async () => {
  const { events, document } = fixture();
  await assert.rejects(
    startShell({
      document,
      mount: () => events.push("mount"),
      call: async () => {
        throw new Error("IPC unavailable");
      },
    }),
    /IPC unavailable/u,
  );
  assert.deepEqual(events, []);
  assert.equal(document.documentElement.dataset.shellReady, undefined);
});
test("the native owner selection is available before any application plugins mount", async () => {
  const { document } = fixture();
  await startShell({
    document,
    mount: () => assert.equal(document.documentElement.dataset.aiOwner, "core"),
    call: async (command) =>
      command === "shell_info"
        ? { runtime: "tauri-desktop", os: "macos", aiOwner: "core" }
        : undefined,
  });
});
