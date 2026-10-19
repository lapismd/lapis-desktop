import test from "node:test";
import assert from "node:assert/strict";
import { createNativeRepository } from "../../src/lib/native/repository/services.ts";
const vault = { sessionId: "vault", profileId: "profile", name: "Notes" };
const operation = "ab".repeat(64);
const repository = "cd".repeat(16);
const handle = "3f7ead75-e6d2-43f0-92dd-f7f3236bc634";
const frame = (data) => JSON.stringify({ version: 1, data });
function setup() {
  const calls = [];
  let preparing = false;
  const call = async (command, args) => {
    calls.push([command, args]);
    if (command === "desktop_repository_sources")
      return {
        original: true,
        token: args.request.openOriginal ? "original:scope" : null,
      };
    if (command.startsWith("plugin:jj-store|")) {
      const request = JSON.parse(args.request).data;
      assert.equal(request.vault, "original:scope");
      switch (command.split("|")[1]) {
        case "heads":
          return frame({
            version: 1,
            profile: "local",
            repository,
            generation: 1,
            heads: [operation],
          });
        case "open":
          assert.equal(
            preparing,
            false,
            "the shared preparation queue must drain first",
          );
          preparing = true;
          return frame(handle);
        case "status":
          preparing = false;
          return frame({ state: "failed", data: "unavailable" });
        case "close":
          return frame(null);
      }
    }
  };
  return { calls, call };
}
test("source discovery initializes no repository; original reads use a native-issued token without managed admission", async () => {
  const f = setup();
  const services = createNativeRepository(vault, f.call);
  assert.deepEqual(await services.sources(), { original: true });
  assert.deepEqual(f.calls, [
    [
      "desktop_repository_sources",
      { request: { sessionId: "vault", openOriginal: false } },
    ],
  ]);
  await Promise.all([services.original.heads(), services.original.heads()]);
  assert.equal(
    f.calls.filter(
      ([command, args]) =>
        command === "desktop_repository_sources" && args.request.openOriginal,
    ).length,
    1,
  );
  assert.equal(
    f.calls.some(([command]) => command === "desktop_repository_admit"),
    false,
  );
  await services.close("reload");
  assert.equal(f.calls.at(-1)[0], "desktop_repository_release");
  await assert.rejects(services.original.heads(), /closed/);
});
test("original history remains usable after backup startup fails and sources share preparation capacity", async (context) => {
  const previous = globalThis.window;
  globalThis.window = { __TAURI_INTERNALS__: { transformCallback: () => 1 } };
  context.after(() => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
  const f = setup();
  let managedPreparing = false;
  const client = {
    async open() {
      managedPreparing = true;
      return "managed-handle";
    },
    async status() {
      managedPreparing = false;
      return { state: "failed" };
    },
    async close() {},
  };
  const services = createNativeRepository(
    vault,
    async (command, args) => {
      if (command === "desktop_backup_start")
        throw new Error("Backup requires recovery");
      if (command === "plugin:jj-store|open")
        assert.equal(managedPreparing, false);
      return f.call(command, args);
    },
    client,
  );
  await services.reader.open(operation);
  await services.original.open(operation);
  await services.original.open(operation);
  await assert.rejects(
    services.backup.start(() => {}),
    /Backup requires recovery/,
  );
  assert.equal((await services.original.heads()).heads[0], operation);
  await assert.rejects(services.reader.heads(), /Backup requires recovery/);
  await services.close("close");
});
test("closing drains a late original admission and fences all later native reads", async () => {
  const f = setup();
  let resolve;
  const held = new Promise((done) => {
    resolve = done;
  });
  const services = createNativeRepository(vault, async (command, args) => {
    if (command === "desktop_repository_sources") await held;
    return f.call(command, args);
  });
  const reading = services.original.heads();
  const rejected = assert.rejects(reading, /closed/);
  const closing = services.close("close");
  resolve();
  await rejected;
  await closing;
  assert.equal(
    f.calls.some(([command]) => command.startsWith("plugin:")),
    false,
  );
  assert.equal(f.calls.at(-1)[0], "desktop_repository_release");
});
test("malformed or unavailable source state never falls back to backup or renderer paths", async () => {
  for (const result of [
    null,
    { original: false, token: null },
    { original: true, token: "" },
    { original: true, token: 5 },
  ]) {
    const calls = [];
    const services = createNativeRepository(vault, async (command) => {
      calls.push(command);
      return result;
    });
    await assert.rejects(
      services.original.heads(),
      /Invalid repository source/,
    );
    assert.deepEqual(calls, ["desktop_repository_sources"]);
    await services.close("close");
  }
});
