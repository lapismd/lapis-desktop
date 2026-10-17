import test from "node:test";
import assert from "node:assert/strict";
import { createNativeRepository } from "../../src/lib/native/repository/services.ts";
const vault = {
  sessionId: "vault-token",
  path: "/private/not-renderer-authority",
  profileId: "profile",
  name: "Vault",
  resourceToken: "resources",
};
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function setup() {
  const calls = [],
    reads = [];
  const client = {
    heads: async () => {
      reads.push("heads");
      return { heads: [] };
    },
    open: async (operation) => {
      reads.push(["open", operation]);
      return "handle";
    },
    status: async (handle) => {
      reads.push(["status", handle]);
      return { state: "preparing" };
    },
    read: async (handle, query) => {
      reads.push([handle, query]);
      return { kind: query.kind };
    },
    close: async (handle) => {
      reads.push(["close", handle]);
    },
  };
  const call = async (command, args) => {
    calls.push([command, args]);
  };
  return { calls, reads, client, call };
}
test("native history lazily admits exactly the opaque vault once and stays independent of AI", async () => {
  const f = setup();
  const service = createNativeRepository(vault, f.call, f.client);
  assert.equal(f.calls.length, 0);
  await Promise.all([service.reader.heads(), service.reader.heads()]);
  assert.deepEqual(f.calls, [
    ["desktop_repository_admit", { request: { sessionId: "vault-token" } }],
  ]);
  await service.reader.open("operation");
  await service.reader.read("handle", { kind: "query_info" });
  await service.reader.close("handle");
  await service.close("reload");
  assert.deepEqual(f.calls.at(-1), [
    "desktop_repository_release",
    { request: { reload: true } },
  ]);
  assert.equal(
    f.calls.some(([command]) => command.includes("ai")),
    false,
  );
  await assert.rejects(service.reader.heads(), /closed/);
});
test("closing fences a pending admission before any history command and drains it", async () => {
  const f = setup();
  const admission = deferred();
  const call = async (command, args) => {
    await f.call(command, args);
    if (command.endsWith("admit")) await admission.promise;
  };
  const service = createNativeRepository(vault, call, f.client);
  const reading = service.reader.heads();
  const rejected = assert.rejects(reading, /closed/);
  const closing = service.close("close");
  assert.equal(f.calls.length, 1);
  admission.resolve();
  await rejected;
  await closing;
  assert.deepEqual(f.reads, []);
  assert.deepEqual(f.calls.at(-1), [
    "desktop_repository_release",
    { request: { reload: false } },
  ]);
});
test("a lost read outcome never retries and release failure remains explicitly retryable", async () => {
  const f = setup();
  let failures = 0;
  f.client.heads = async () => {
    f.reads.push("heads");
    throw new Error("lost reply");
  };
  const service = createNativeRepository(
    vault,
    async (command, args) => {
      await f.call(command, args);
      if (command.endsWith("release") && failures++ === 0)
        throw { code: "EIO", message: "lost release" };
    },
    f.client,
  );
  await assert.rejects(service.reader.heads(), /lost reply/);
  assert.deepEqual(f.reads, ["heads"]);
  await assert.rejects(service.close("close"), /lost release/);
  await service.close("close");
  assert.equal(
    f.calls.filter(([command]) => command.endsWith("release")).length,
    2,
  );
});
test("a denied vault never reaches the history reader and an unused scope releases nothing", async () => {
  const f = setup();
  const service = createNativeRepository(
    vault,
    async () => {
      throw { code: "EACCES", message: "Denied" };
    },
    f.client,
  );
  await assert.rejects(service.reader.heads(), /Denied/);
  assert.deepEqual(f.reads, []);
  const unused = createNativeRepository(vault, f.call, f.client);
  await unused.close("close");
  assert.deepEqual(f.calls, []);
});
