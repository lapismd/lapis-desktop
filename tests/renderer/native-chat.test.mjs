import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeChatHost } from "../../src/lib/native/ai/native-chat.ts";
test("native chat keeps the vault's admitted commands and detach/disable intent without renderer execution", async () => {
  const calls = [];
  const app = {
    workspaceTrust: { trusted: true },
    safeMode: { disableOptionalCorePlugins: false },
    vault: { adapter: { read: async (path) => `saved:${path}` } },
    notifications: { notify() {} },
  };
  const client = createNativeChatHost(
    app,
    { sessionId: "owned-vault" },
    async (command, args) => {
      calls.push([command, args]);
      return { kind: "records", records: [] };
    },
  );
  assert.equal(calls.length, 0);
  await client.activate();
  await client.call({ kind: "list" });
  await client.leave("detach");
  await client.leave("disable");
  assert.deepEqual(calls, [
    ["desktop_ai_admit", { request: { sessionId: "owned-vault" } }],
    [
      "desktop_ai_turn",
      { request: { sessionId: "owned-vault", command: { kind: "list" } } },
    ],
    ["desktop_ai_release", { request: { reload: true } }],
    ["desktop_ai_release", { request: { reload: false } }],
  ]);
  assert.equal(
    await client.readText("retained/transcript.jsonl"),
    "saved:retained/transcript.jsonl",
  );
  app.workspaceTrust.trusted = false;
  assert.equal(client.allowed(), false);
});
test("native turn transport preserves typed refusals and never retries a failed command", async () => {
  let calls = 0;
  const host = createNativeChatHost({}, {}, async () => {
    calls++;
    throw { code: "EACCES", message: "Admission revoked" };
  });
  await assert.rejects(
    host.call({ kind: "list" }),
    (error) => error.code === "EACCES" && error.message === "Admission revoked",
  );
  assert.equal(calls, 1);
});
test("each turn command carries the exact owning vault admission token", async () => {
  let request;
  const host = createNativeChatHost(
    {},
    { sessionId: "vault-A" },
    async (_command, args) => {
      request = args.request;
      return { kind: "records", records: [] };
    },
  );
  await host.call({ kind: "list" });
  assert.equal(request.sessionId, "vault-A");
});
