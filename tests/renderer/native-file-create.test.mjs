import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";

test("exclusive creation forwards admitted bytes and metadata without an overwrite command", async () => {
  const calls = [];
  const selected = { sessionId: "owned" };
  const bridge = createNativeBridge(
    {
      admitted(root) {
        assert.equal(root, "/vault");
        return selected;
      },
      async file(owner, request) {
        assert.equal(owner, selected);
        calls.push(request);
      },
    },
    "macos",
  );
  assert.equal(bridge.capabilities["exclusive-create"].status, "available");
  await bridge.invoke("desktop_fs_create_exclusive", {
    rootPath: "/vault",
    normalizedPath: "Notes/café.bin",
    data: [0, 255, 128],
    options: { ctime: 1, mtime: 2 },
  });
  assert.deepEqual(calls, [
    {
      operation: "create-file",
      path: "Notes/café.bin",
      data: [0, 255, 128],
      options: { mtime: 2 },
    },
  ]);
  await assert.rejects(
    bridge.invoke("desktop_fs_create_exclusive", {
      rootPath: "/vault",
      normalizedPath: "../escape",
      data: [],
    }),
    /path/,
  );
  assert.equal(calls.length, 1);
});
test("exclusive creation is not advertised on unsupported native platforms", () => {
  assert.equal(
    createNativeBridge({}, "windows").capabilities["exclusive-create"].status,
    "unavailable",
  );
});
