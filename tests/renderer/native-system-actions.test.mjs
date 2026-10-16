import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";

function fixture(os = "macos") {
  const owner = { sessionId: "live" },
    calls = [];
  const client = {
    admitted(root) {
      assert.equal(root, "/vault");
      return owner;
    },
    async file(selected, request) {
      assert.equal(selected, owner);
      calls.push(request);
      return true;
    },
  };
  return { bridge: createNativeBridge(client, os), calls, client };
}
test("macOS native actions advertise only implemented ports and preserve admitted relative paths", async () => {
  const { bridge, calls } = fixture();
  assert.equal(bridge.capabilities["file-system-actions"].status, "available");
  assert.equal(bridge.capabilities["system-trash"].status, "available");
  for (const [command, operation] of [
    ["resolve_path", "resolve-path"],
    ["open_path", "open-path"],
    ["reveal_path", "reveal-path"],
    ["trash_system", "trash-system"],
  ]) {
    await bridge.invoke(`desktop_fs_${command}`, {
      rootPath: "/vault",
      normalizedPath: "Notes/café.md",
    });
    assert.deepEqual(calls.at(-1), { operation, path: "Notes/café.md" });
  }
});
test("unimplemented platforms reject OS actions before native invocation", async () => {
  for (const os of ["windows", "linux", "unknown"]) {
    const { bridge, calls } = fixture(os);
    assert.equal(
      bridge.capabilities["file-system-actions"].status,
      "unavailable",
    );
    assert.equal(bridge.capabilities["system-trash"].status, "unavailable");
    await assert.rejects(
      bridge.invoke("desktop_fs_reveal_path", {
        rootPath: "/vault",
        normalizedPath: "file.md",
      }),
    );
    assert.equal(calls.length, 0);
  }
});
test("invalid paths, root trash and closed admissions reject OS actions", async () => {
  const { bridge, calls, client } = fixture();
  for (const path of ["../outside", "/absolute", "a\\outside", "a/../outside"])
    await assert.rejects(
      bridge.invoke("desktop_fs_reveal_path", {
        rootPath: "/vault",
        normalizedPath: path,
      }),
    );
  await assert.rejects(
    bridge.invoke("desktop_fs_trash_system", {
      rootPath: "/vault",
      normalizedPath: "/",
    }),
  );
  client.admitted = () => {
    throw new Error("admission closed");
  };
  await assert.rejects(
    bridge.invoke("desktop_fs_open_path", {
      rootPath: "/vault",
      normalizedPath: "file.md",
    }),
    /closed/,
  );
  assert.equal(calls.length, 0);
});

test("absolute path conversion remains scoped to the admitted native owner", async () => {
  const { bridge, calls } = fixture();
  await bridge.invoke("desktop_fs_to_vault_path", {
    rootPath: "/vault",
    absolutePath: "/vault/café.md",
  });
  assert.deepEqual(calls.at(-1), {
    operation: "to-vault-path",
    absolutePath: "/vault/café.md",
  });
});
