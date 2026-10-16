import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";

test("the native bridge forwards only admitted mutation paths and operation arguments", async () => {
  const selected = { sessionId: "owned" },
    calls = [];
  const client = {
    admitted(root) {
      assert.equal(root, "/vault");
      return selected;
    },
    async file(owner, request) {
      assert.equal(owner, selected);
      calls.push(request);
    },
  };
  const bridge = createNativeBridge(client, "macos");
  for (const [command, operation] of [
    ["rename", "rename"],
    ["copy", "copy"],
    ["remove", "remove"],
    ["rmdir", "rmdir"],
  ]) {
    await bridge.invoke(`desktop_fs_${command}`, {
      rootPath: "/vault",
      normalizedPath: "Notes/café.md",
      normalizedNewPath: "Archive/café.md",
      recursive: true,
    });
    assert.deepEqual(calls.at(-1), {
      operation,
      path: "Notes/café.md",
      ...(["rename", "copy"].includes(operation)
        ? { newPath: "Archive/café.md" }
        : {}),
      ...(operation === "rmdir" ? { recursive: true } : {}),
    });
  }
  const before = calls.length;
  await assert.rejects(
    bridge.invoke("desktop_fs_rename", {
      rootPath: "/vault",
      normalizedPath: "safe.md",
      normalizedNewPath: "../escape.md",
    }),
    /Invalid relative vault path/,
  );
  assert.equal(calls.length, before);
});
