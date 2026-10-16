import { test } from "node:test";
import assert from "node:assert/strict";
import { VaultClient } from "../../src/lib/native/vault-client.ts";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";

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

test("native destination creation registers only the returned admission", async () => {
  const { client, calls, selected } = fixture();
  assert.equal(await client.create(), selected);
  assert.deepEqual(calls, [
    { command: "vault_select", payload: { create: true } },
  ]);
  assert.equal(client.admitted(selected.path), selected);
  await client.closeAll();
  assert.throws(() => client.admitted(selected.path), /closed or unknown/u);
  const cancelled = new VaultClient(async () => null);
  assert.equal(await cancelled.create(), null);
  assert.throws(() => cancelled.admitted(selected.path), /closed or unknown/u);
});

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
  assert.equal(
    await bridge.invoke("desktop_fs_remove", {
      rootPath: selected.path,
      normalizedPath: "note.md",
    }),
    "native result",
  );
  assert.deepEqual(calls.at(-1), {
    command: "vault_fs",
    payload: {
      sessionId: selected.sessionId,
      request: { operation: "remove", path: "note.md" },
    },
  });
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
  assert.equal(calls.length, 3);
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

test("structured native failures preserve Error identity, message and portable code", async () => {
  const selected = {
    profileId: "profile",
    sessionId: "session",
    path: "/vault",
    name: "Notes",
    resourceToken: "token",
  };
  const client = new VaultClient(async (command) => {
    if (command === "vault_select") return selected;
    throw { code: "EEXIST", message: "The folder already exists" };
  });
  await client.select();
  const bridge = createNativeBridge(client, "macos");
  await assert.rejects(
    bridge.invoke("desktop_fs_mkdir", {
      rootPath: selected.path,
      normalizedPath: ".lapis",
    }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error.code, "EEXIST");
      assert.equal(error.message, "The folder already exists");
      return true;
    },
  );
});

test("restoration admits the host-selected vault and remembers Notes by admission only", async () => {
  const selected = {
    profileId: "p",
    sessionId: "s",
    path: "/vault",
    name: "Vault",
    resourceToken: "r",
  };
  const calls = [];
  const client = new VaultClient(async (command, payload) => {
    calls.push({ command, payload });
    if (command === "vault_restore") return selected;
  });
  assert.deepEqual(await client.restore(), selected);
  assert.deepEqual(client.admitted("/vault"), selected);
  await client.rememberNotes(selected);
  await client.closeAll();
  await client.rememberNotes(null);
  assert.throws(() => client.admitted("/vault"), /closed/u);
  assert.deepEqual(calls, [
    { command: "vault_restore", payload: undefined },
    { command: "vault_remember_notes", payload: { sessionId: "s" } },
    { command: "vault_close", payload: { sessionId: "s" } },
    { command: "vault_remember_notes", payload: { sessionId: null } },
  ]);
});

test("failed admission cleanup remains retryable and prevents successful drain", async () => {
  let fail = true;
  const selected = { sessionId: "s", path: "/vault" };
  const client = new VaultClient(async (command) => {
    if (command === "vault_restore") return selected;
    if (fail) throw new Error("database still open");
  });
  await client.restore();
  await assert.rejects(client.closeAll(), /database still open/u);
  assert.deepEqual(client.admitted("/vault"), selected);
  fail = false;
  await client.closeAll();
  assert.throws(() => client.admitted("/vault"), /closed/u);
});

test("conditional writes preserve explicit contents or absence in the admitted native frame", async () => {
  const { client, bridge, calls, selected } = fixture();
  await client.select();
  assert.equal(
    bridge.capabilities["conditional-text-write"].status,
    "available",
  );
  for (const expected of ["baseline", null]) {
    await bridge.invoke("desktop_fs_write_text_if_unchanged", {
      rootPath: selected.path,
      normalizedPath: "笔记/café.md",
      data: "new",
      expected,
      options: { ctime: 1, mtime: 2 },
    });
    assert.deepEqual(calls.at(-1), {
      command: "vault_fs",
      payload: {
        sessionId: selected.sessionId,
        request: {
          operation: "write-text-if-unchanged",
          path: "笔记/café.md",
          data: "new",
          expected,
          options: { mtime: 2 },
        },
      },
    });
  }
});

test("invalid conditional snapshots and closed admissions reject before file IPC", async () => {
  const { client, bridge, calls, selected } = fixture();
  await client.select();
  for (const expected of [undefined, 123, false])
    await assert.rejects(
      bridge.invoke("desktop_fs_write_text_if_unchanged", {
        rootPath: selected.path,
        normalizedPath: "note.md",
        data: "new",
        expected,
      }),
      /expected/u,
    );
  assert.equal(calls.length, 1);
  await client.close(selected);
  await assert.rejects(
    bridge.invoke("desktop_fs_write_text_if_unchanged", {
      rootPath: selected.path,
      normalizedPath: "note.md",
      data: "new",
      expected: "old",
    }),
    /admission/u,
  );
  assert.equal(calls.length, 2);
});
