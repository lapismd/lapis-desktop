import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeValue,
  decodeValue,
  callArgs,
  decodeRows,
} from "../../src/database-codec.ts";
import { NativeTursoConnection } from "../../src/native-connection.ts";
import { createNativeDatabaseProvider } from "../../src/native-database-provider.ts";

const selected = {
  profileId: "profile",
  sessionId: "session",
  name: "Notes",
  path: "/vault",
  resourceToken: "resource",
};

test("SQL frames preserve integers, Unicode, real values and binary view boundaries", () => {
  for (const value of [
    null,
    "café 🪨\0",
    1,
    -42,
    1.25,
    (1n << 63n) - 1n,
    -(1n << 63n),
  ]) {
    const decoded = decodeValue(encodeValue(value));
    assert.equal(
      decoded,
      typeof value === "bigint" && Number.isSafeInteger(Number(value))
        ? Number(value)
        : value,
    );
  }
  const bytes = Uint8Array.from([99, 0, 255, 128, 42, 99]);
  assert.deepEqual(
    decodeValue(encodeValue(bytes.subarray(1, 5))),
    Uint8Array.from([0, 255, 128, 42]),
  );
  for (const value of [
    undefined,
    NaN,
    Infinity,
    1n << 63n,
    {},
    [1, 2],
    new Date(),
  ])
    assert.throws(() => encodeValue(value));
  for (const value of [
    { type: "integer", value: "01" },
    { type: "integer", value: "-0" },
    { type: "blob", value: [256] },
  ])
    assert.throws(() => decodeValue(value));
  assert.deepEqual(callArgs([{ ":id": 1 }]), {
    ":id": { type: "integer", value: "1" },
  });
  assert.throws(() => callArgs([{ id: 1 }]), /prefix/u);
  const row = decodeRows([
    JSON.parse('{"__proto__":{"type":"text","value":"safe"}}'),
  ])[0];
  assert.equal(Object.getPrototypeOf(row), Object.prototype);
  assert.equal(Object.getOwnPropertyDescriptor(row, "__proto__").value, "safe");
});

test("native connection forwards all public methods without sending database paths", async () => {
  const calls = [];
  const connection = await NativeTursoConnection.open(
    selected,
    async (command, payload) => {
      calls.push({ command, payload });
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") return;
      if (["all", "get"].includes(payload.request.operation))
        return {
          kind: "rows",
          rows: [{ value: { type: "integer", value: "9223372036854775807" } }],
        };
      if (payload.request.operation === "exec") return { kind: "empty" };
      if (payload.request.operation === "run")
        return { kind: "run", result: { changes: 1 } };
      return { kind: "batch", results: [] };
    },
  );
  await connection.exec("CREATE TABLE sample (id INTEGER)");
  await connection.run("INSERT INTO sample VALUES (?)", 1);
  assert.equal((await connection.get("SELECT 1")).value, 9223372036854775807n);
  assert.equal(
    (await connection.all("SELECT 1"))[0].value,
    9223372036854775807n,
  );
  await connection.batch(
    [{ sql: "INSERT INTO sample VALUES (:id)", args: { ":id": 2 } }],
    "immediate",
  );
  await connection.close();
  assert.deepEqual(
    calls.map(({ command }) => command),
    ["vault_db_open", ...Array(5).fill("vault_db_execute"), "vault_db_close"],
  );
  assert.ok(
    calls.every(({ payload }) => !JSON.stringify(payload).includes("/vault")),
  );
});

test("connection close drains earlier calls and immediately rejects later operations", async () => {
  const operations = [];
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  const connection = await NativeTursoConnection.open(
    selected,
    async (command, payload) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") {
        operations.push("close");
        return;
      }
      operations.push(payload.request.operation);
      if (payload.request.operation === "exec") {
        await blocked;
        return { kind: "empty" };
      }
      return { kind: "run", result: {} };
    },
  );
  const first = connection.exec("CREATE TABLE sample (id INTEGER)");
  const second = connection.run("INSERT INTO sample VALUES (1)");
  const closing = connection.close();
  assert.equal(connection.close(), closing);
  await assert.rejects(connection.all("SELECT 1"), /closed/u);
  assert.deepEqual(operations, ["exec"]);
  release();
  await Promise.all([first, second, closing]);
  assert.deepEqual(operations, ["exec", "run", "close"]);
});

test("native errors retain their code and a failed close can be retried", async () => {
  let closes = 0;
  const connection = await NativeTursoConnection.open(
    selected,
    async (command) => {
      if (command === "vault_db_open") return { connectionId: "connection" };
      if (command === "vault_db_close") {
        if (++closes === 1) throw { code: "EBUSY", message: "Checkpoint busy" };
        return;
      }
      throw { code: "EIO", message: "Database operation failed" };
    },
  );
  await assert.rejects(connection.exec("SELECT 1"), {
    code: "EIO",
    message: "Database operation failed",
  });
  await assert.rejects(connection.close(), {
    code: "EBUSY",
    message: "Checkpoint busy",
  });
  await connection.close();
  assert.equal(closes, 2);
});

test("provider admission rejects other vaults, roles and runtimes before native open", async () => {
  let calls = 0;
  const provider = createNativeDatabaseProvider(selected, async () => {
    calls++;
  });
  assert.equal(
    await provider.canOpen({
      vaultId: "profile",
      runtime: "tauri-desktop",
      role: "direct",
    }),
    true,
  );
  for (const context of [
    { vaultId: "other", runtime: "tauri-desktop", role: "direct" },
    { vaultId: "profile", runtime: "web-pwa", role: "direct" },
    { vaultId: "profile", runtime: "tauri-desktop", role: "proxy" },
  ]) {
    assert.equal(await provider.canOpen(context), false);
    await assert.rejects(provider.open(context), /admitted Tauri vault/u);
  }
  assert.equal(calls, 0);
});
