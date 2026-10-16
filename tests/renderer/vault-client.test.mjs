import { test } from "node:test";
import assert from "node:assert/strict";
import { VaultClient } from "../../src/vault-client.ts";
import { createNativeBridge } from "../../src/native-bridge.ts";

function fixture() {
  const calls = [];
  const selected = {
    profileId: "profile-1",
    sessionId: "session-1",
    name: "Notes",
    path: "/Users/test/Notes",
    resourceToken: "resource-1",
  };
  const client = new VaultClient(
    async (command, payload) => {
      calls.push({ command, payload });
      if (command === "vault_select" || command === "vault_open_recent")
        return selected;
      if (command === "vault_fs") return "native result";
    },
    (path, protocol) => `${protocol}://localhost/${encodeURIComponent(path)}`,
  );
  return {
    calls,
    selected,
    client,
    bridge: createNativeBridge(client, "macos"),
  };
}

test("the public native adapter translates only admitted allowlisted file operations", async () => {
  const { client, calls, bridge, selected } = fixture();
  await client.select();
  assert.equal(
    await bridge.invoke("desktop_fs_write_text", {
      rootPath: selected.path,
      normalizedPath: "笔记/café.md",
      data: "hello",
      options: { ctime: 1, mtime: 2 },
    }),
    "native result",
  );
  assert.deepEqual(calls.at(-1), {
    command: "vault_fs",
    payload: {
      sessionId: selected.sessionId,
      request: {
        operation: "write-text",
        path: "笔记/café.md",
        data: "hello",
        options: { mtime: 2 },
      },
    },
  });
  await assert.rejects(
    bridge.invoke("desktop_fs_remove", {
      rootPath: selected.path,
      normalizedPath: "note.md",
    }),
    /unavailable/u,
  );
  await assert.rejects(
    bridge.invoke("shell_execute", { command: "bad" }),
    /unavailable/u,
  );
  await assert.rejects(
    bridge.invoke("desktop_fs_read_text", {
      rootPath: "/etc",
      normalizedPath: "passwd",
    }),
    /admission/u,
  );
  assert.equal(calls.length, 2);
});

test("renderer traversal rejects before invoking Rust and root access is explicit", async () => {
  const { client, calls, bridge, selected } = fixture();
  await client.select();
  for (const path of [
    "../outside",
    "/etc/passwd",
    "a/../../outside",
    "a\\b",
    "C:/outside",
    "a\0b",
  ]) {
    await assert.rejects(
      bridge.invoke("desktop_fs_read_text", {
        rootPath: selected.path,
        normalizedPath: path,
      }),
      /path/u,
    );
  }
  assert.equal(calls.length, 1);
  await bridge.invoke("desktop_fs_stat", {
    rootPath: selected.path,
    normalizedPath: "/",
  });
  assert.equal(calls.at(-1).payload.request.path, "");
});

test("closed admissions stop file calls and resource creation", async () => {
  const { client, calls, bridge, selected } = fixture();
  await client.select();
  const url = await bridge.getResourceUrl(selected.path, "images/café.png");
  assert.equal(
    url,
    "lapis-vault://localhost/resource-1%2Fimages%2Fcaf%C3%A9.png",
  );
  assert.equal(bridge.toFileUrl(`${selected.path}/images/café.png`), url);
  assert.throws(
    () => bridge.toFileUrl(`${selected.path}-other/private.png`),
    /outside/u,
  );
  await client.close(selected);
  await assert.rejects(
    bridge.invoke("desktop_fs_read_text", {
      rootPath: selected.path,
      normalizedPath: "note.md",
    }),
    /admission/u,
  );
  await assert.rejects(
    bridge.getResourceUrl(selected.path, "images/café.png"),
    /admission/u,
  );
  assert.equal(calls.length, 2);
});

test("cancelling folder selection has no file or recent-profile side effects", async () => {
  const calls = [];
  const client = new VaultClient(async (command) => {
    calls.push(command);
    return null;
  });
  assert.equal(await client.select(), null);
  assert.deepEqual(calls, ["vault_select"]);
  assert.throws(() => client.admitted("/anything"), /admission/u);
});
