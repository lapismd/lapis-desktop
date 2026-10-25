import { test } from "node:test";
import assert from "node:assert/strict";
import { REMOTE_APP_DATABASE_METHODS } from "@lapis-notes/api/app-database";
import { NativeDatabaseTransport } from "../../src/lib/native/database/database-transport.ts";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";

const selected = {
  profileId: "profile",
  sessionId: "session",
  name: "Notes",
  path: "/vault",
  resourceToken: "resource",
};
const context = {
  vaultId: selected.profileId,
  runtime: "tauri-desktop",
  role: "direct",
};
const channel = (listener) => ({ onmessage: listener });

test("the native provider forwards the complete high-level catalogue without SQL or storage authority", async () => {
  const calls = [];
  const database = await createNativeDatabaseProvider(
    selected,
    async (command, payload) => {
      calls.push({ command, payload });
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") return;
      return { kind: "value", value: 42 };
    },
    channel,
  ).open(context);
  for (const method of REMOTE_APP_DATABASE_METHODS)
    assert.equal(await database[method](), 42);
  assert.equal(database.descriptor.storageMode, "local");
  assert.equal(database.descriptor.transport, "native");
  assert.equal(database.exec, undefined);
  assert.equal(database.run, undefined);
  assert.deepEqual(
    calls
      .filter(({ command }) => command === "vault_db_call")
      .map(({ payload }) => payload.request.method),
    [...REMOTE_APP_DATABASE_METHODS],
  );
  assert.ok(
    calls.every(
      ({ payload }) => !JSON.stringify(payload).includes(selected.path),
    ),
  );
  await database.close();
});

test("high-level calls retain undefined slots, explicit null and tagged replies", async () => {
  const calls = [];
  const transport = await NativeDatabaseTransport.open(
    selected,
    async (command, payload) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") return;
      calls.push(payload.request);
      return calls.length === 1
        ? { kind: "undefined" }
        : { kind: "value", value: null };
    },
    channel,
  );
  assert.equal(
    await transport.call("getFileHistory", ["note.md", undefined, null]),
    undefined,
  );
  assert.equal(await transport.call("getMeta", ["key"]), null);
  assert.deepEqual(calls[0].args, [
    { kind: "value", value: "note.md" },
    { kind: "undefined" },
    { kind: "value", value: null },
  ]);
  await assert.rejects(transport.call("getMeta", Array(5)), /arguments/u);
  await transport.close();
});

test("view close drains earlier renderer calls and rejects later ones immediately", async () => {
  const operations = [];
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  const transport = await NativeDatabaseTransport.open(
    selected,
    async (command, payload) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") {
        operations.push("close");
        return;
      }
      operations.push(payload.request.method);
      if (payload.request.method === "setMeta") await blocked;
      return { kind: "undefined" };
    },
    channel,
  );
  const first = transport.call("setMeta", ["key", true]);
  const second = transport.call("getMeta", ["key"]);
  const closing = transport.close();
  assert.equal(transport.close(), closing);
  await assert.rejects(transport.call("getChangeRevision", []), /closed/u);
  assert.deepEqual(operations, ["setMeta"]);
  release();
  await Promise.all([first, second, closing]);
  assert.deepEqual(operations, ["setMeta", "getMeta", "close"]);
});

test("native errors keep their codes and failed view closure remains retryable", async () => {
  let closes = 0;
  let emit;
  const received = [];
  const transport = await NativeDatabaseTransport.open(
    selected,
    async (command) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") {
        if (++closes === 1) {
          emit({ revision: 1, domains: ["meta"], paths: [], committedAt: 1 });
          throw { code: "EBUSY", message: "Still closing" };
        }
        return;
      }
      throw { code: "EIO", message: "Native write failed" };
    },
    (listener) => {
      emit = listener;
      return {};
    },
  );
  transport.subscribe((change) => received.push(change));
  await assert.rejects(transport.call("getMeta", ["key"]), {
    code: "EIO",
    message: "Native write failed",
  });
  await assert.rejects(transport.close(), {
    code: "EBUSY",
    message: "Still closing",
  });
  assert.equal(
    received.length,
    1,
    "failed closure must not lose accepted changes",
  );
  await transport.close();
  assert.equal(closes, 2);
});

test("queued native calls snapshot JSON arguments before callers can mutate them", async () => {
  let request;
  const transport = await NativeDatabaseTransport.open(
    selected,
    async (command, payload) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") return;
      request = payload.request;
      return { kind: "undefined" };
    },
    channel,
  );
  const object = { text: "accepted" };
  const saved = transport.call("setMeta", ["key", object]);
  object.text = "later";
  await saved;
  assert.equal(request.args[1].value.text, "accepted");
  await transport.close();
});

test("committed changes, full resets, unsubscribe and view disposal use one scoped channel", async () => {
  let emit;
  const database = await createNativeDatabaseProvider(
    selected,
    async (command) =>
      command === "vault_db_open" ? { connectionId: "connection" } : undefined,
    (listener) => {
      emit = listener;
      return {};
    },
  ).open(context);
  const received = [];
  const off = database.subscribeToChanges((change) => received.push(change));
  const change = {
    revision: 1,
    domains: ["metadata"],
    paths: ["note.md"],
    committedAt: 1,
  };
  emit(change);
  emit({ ...change, revision: 2, reset: true, paths: [] });
  off();
  emit({ ...change, revision: 3 });
  assert.equal(received.length, 2);
  assert.equal(received[1].reset, true);
  database.subscribeToChanges((change) => received.push(change));
  await database.close();
  emit({ ...change, revision: 4 });
  assert.equal(received.length, 2);
});

test("provider admission rejects foreign vaults, roles and runtimes before native open", async () => {
  let calls = 0;
  const provider = createNativeDatabaseProvider(
    selected,
    async () => {
      calls++;
    },
    channel,
  );
  assert.equal(provider.canOpen(context), true);
  for (const invalid of [
    { ...context, vaultId: "other" },
    { ...context, runtime: "web-pwa" },
    { ...context, role: "proxy" },
  ]) {
    assert.equal(provider.canOpen(invalid), false);
    await assert.rejects(provider.open(invalid), /admitted Tauri vault/u);
  }
  assert.equal(calls, 0);
});

test("failed admission and malformed replies reject without a fallback engine", async () => {
  await assert.rejects(
    NativeDatabaseTransport.open(
      selected,
      async () => {
        throw { code: "ENOTSUP", message: "Native database unavailable" };
      },
      channel,
    ),
    { code: "ENOTSUP", message: "Native database unavailable" },
  );
  const transport = await NativeDatabaseTransport.open(
    selected,
    async (command) =>
      command === "vault_db_open"
        ? { connectionId: "connection" }
        : command === "vault_db_close"
          ? undefined
          : { kind: "value" },
    channel,
  );
  await assert.rejects(transport.call("getMeta", ["key"]), /response/u);
  await transport.close();
});
