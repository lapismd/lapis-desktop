import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";

const selected = {
  profileId: "profile",
  sessionId: "session",
  name: "Notes",
  path: "/vault",
  resourceToken: "resource",
};
const context = {
  vaultId: "profile",
  runtime: "tauri-desktop",
  role: "direct",
};
const status = {
  passes: 1,
  indexed: 1,
  deleted: 0,
  pending: 0,
  error: null,
  active: false,
  processed: 1,
  total: 1,
  phase: "idle",
};
const value = { status, contribution: null };
function fixture(owner, handler = async () => value) {
  const calls = [];
  let channels = 0;
  const provider = createNativeDatabaseProvider(
    selected,
    async (command, payload) => {
      calls.push({ command, payload });
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") return;
      return handler(command, payload);
    },
    () => {
      channels++;
      return {};
    },
    owner,
  );
  return { provider, calls, channels: () => channels };
}

test("absent and explicit renderer metadata selection retain the default provider without an indexing port", async () => {
  for (const owner of [undefined, "renderer"]) {
    const f = fixture(owner);
    assert.equal(f.provider.backgroundIndexing, undefined);
    const database = await f.provider.open(context);
    await database.close();
    assert.deepEqual(
      f.calls.map(({ command }) => command),
      ["vault_db_open", "vault_db_close"],
    );
  }
  for (const owner of ["", "native", "CORE", "auto"])
    assert.throws(() => fixture(owner), /metadata owner/u);
});

test("native metadata shares the one opened database admission and channel", async () => {
  const f = fixture("core");
  const port = f.provider.backgroundIndexing;
  assert.ok(port, "core selection must expose the admitted port");
  await assert.rejects(port.call({ kind: "status" }), /admission.*open/u);
  const database = await f.provider.open(context);
  assert.deepEqual(await port.call({ kind: "status" }), value);
  assert.equal(f.channels(), 1);
  assert.equal(
    f.calls.filter(({ command }) => command === "vault_db_open").length,
    1,
  );
  assert.deepEqual(f.calls.at(-1), {
    command: "vault_indexing",
    payload: {
      request: {
        sessionId: "session",
        connectionId: "connection",
        command: { kind: "status" },
      },
    },
  });
  assert.ok(
    f.calls.every(
      ({ payload }) => !JSON.stringify(payload).includes(selected.path),
    ),
  );
  await assert.rejects(f.provider.open(context), /already open/u);
  await database.close();
  await assert.rejects(port.call({ kind: "status" }), /closed/u);
});

test("passive status can observe an accepted refresh and view close drains it without stopping the owner", async () => {
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const f = fixture("core", async (_command, { request }) => {
    if (request.command.kind === "refresh") await barrier;
    return value;
  });
  const database = await f.provider.open(context);
  const refreshing = f.provider.backgroundIndexing.call({
    kind: "refresh",
    rebuild: false,
  });
  assert.deepEqual(
    await f.provider.backgroundIndexing.call({ kind: "status" }),
    value,
  );
  const closing = database.close();
  await assert.rejects(
    f.provider.backgroundIndexing.call({ kind: "status" }),
    /closed/u,
  );
  assert.equal(
    f.calls.some(({ command }) => command === "vault_db_close"),
    false,
  );
  release();
  await Promise.all([refreshing, closing]);
  assert.deepEqual(
    f.calls
      .filter(({ command }) => command === "vault_indexing")
      .map(({ payload }) => payload.request.command.kind),
    ["refresh", "status"],
  );
  assert.equal(f.calls.at(-1).command, "vault_db_close");
});

test("native indexing failure stays observable and never falls back to a database write", async () => {
  const f = fixture("core", async () => {
    throw { code: "EIO", message: "Indexer failed" };
  });
  const database = await f.provider.open(context);
  await assert.rejects(
    f.provider.backgroundIndexing.call({ kind: "refresh", rebuild: true }),
    { code: "EIO", message: "Indexer failed" },
  );
  await database.close();
  assert.equal(
    f.calls.some(({ command }) => command === "vault_db_call"),
    false,
  );
  assert.equal(
    f.calls.filter(({ command }) => command === "vault_indexing").length,
    1,
  );
});

test("accepted indexing commands snapshot caller data and reject malformed native replies", async () => {
  const f = fixture("core", async () => ({}));
  const database = await f.provider.open(context);
  const command = {
    kind: "register_projection",
    contribution: {
      projection_id: "fixture",
      owner_plugin_id: "fixture",
      schema_version: 1,
      configuration_hash: "",
      path_prefix: null,
    },
  };
  const operation = f.provider.backgroundIndexing.call(command);
  command.contribution.projection_id = "later";
  await assert.rejects(operation, /indexing response/u);
  assert.equal(
    f.calls.at(-1).payload.request.command.contribution.projection_id,
    "fixture",
  );
  await database.close();
});
