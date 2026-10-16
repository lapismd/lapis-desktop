import { test } from "node:test";
import assert from "node:assert/strict";
import { startFileWatch } from "../../src/lib/native/file-watch.ts";
import { VaultClient } from "../../src/lib/native/vault-client.ts";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const selected = {
  sessionId: "session",
  profileId: "profile",
  path: "/vault",
  name: "Vault",
  resourceToken: "token",
};
function fixture({ pendingStart, failStop = false } = {}) {
  let deliver;
  const calls = [],
    events = [];
  let shouldFail = failStop;
  const call = async (command, payload) => {
    calls.push({ command, payload });
    if (command === "vault_select") return selected;
    if (command === "vault_watch_start")
      return pendingStart?.promise ?? "watch-id";
    if (command === "vault_watch_stop" && shouldFail)
      throw new Error("stop failed");
  };
  const channel = (listener) => {
    deliver = listener;
    return { channel: true };
  };
  return {
    call,
    calls,
    events,
    channel,
    deliver: (value) => deliver(value),
    allowStop: () => {
      shouldFail = false;
    },
  };
}
function frame(sequence, changes = [], reconciliation = false) {
  return { sequence, changes, reconciliation };
}
test("watch delivery validates complete scoped frames and requests reconciliation on gaps", async () => {
  const f = fixture();
  const watch = startFileWatch(
    f.call,
    selected,
    "Notes",
    true,
    (event) => f.events.push(event),
    f.channel,
  );
  f.deliver(
    frame(1, [
      {
        type: "create",
        path: "Notes/café.md",
        previousPath: "Notes/before.md",
      },
    ]),
  );
  assert.deepEqual(f.events, [
    { type: "create", path: "Notes/café.md", previousPath: "Notes/before.md" },
  ]);
  for (const invalid of [
    frame(3, [{ type: "delete", path: "Notes/partial.md" }]),
    frame(4, [{ type: "create", path: "outside.md" }]),
    frame(5, [
      { type: "modify", path: "Notes/good.md" },
      { type: "delete", path: "../private" },
    ]),
    frame(6, [], true),
  ])
    f.deliver(invalid);
  assert.equal(f.events.length, 5);
  assert.ok(
    f.events
      .slice(1)
      .every(
        (event) =>
          event.type === "error" && event.error.code === "EWATCHRECONCILE",
      ),
  );
  await watch.close();
  f.deliver(frame(7, [{ type: "create", path: "Notes/retired.md" }]));
  assert.equal(f.events.length, 5);
});
test("closing before native startup awaits its ID and retries failed cleanup without callbacks", async () => {
  const start = deferred();
  const f = fixture({ pendingStart: start, failStop: true });
  const watch = startFileWatch(
    f.call,
    selected,
    "",
    true,
    (event) => f.events.push(event),
    f.channel,
  );
  let done = false;
  const closing = watch.close().finally(() => {
    done = true;
  });
  const rejected = assert.rejects(closing, /stop failed/);
  await Promise.resolve();
  assert.equal(done, false);
  f.deliver(frame(1, [{ type: "create", path: "stale.md" }]));
  assert.equal(f.events.length, 0);
  start.resolve("watch-id");
  await rejected;
  f.allowStop();
  await watch.close();
  assert.equal(
    f.calls.filter((entry) => entry.command === "vault_watch_stop").length,
    2,
  );
});
test("start failure is visible but closing needs no nonexistent native resource", async () => {
  const start = deferred();
  const f = fixture({ pendingStart: start });
  const watch = startFileWatch(
    f.call,
    selected,
    "",
    true,
    (event) => f.events.push(event),
    f.channel,
  );
  start.reject(new Error("native registration failed"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.events[0].type, "error");
  assert.match(f.events[0].error.message, /registration failed/);
  await watch.close();
  assert.equal(
    f.calls.filter((entry) => entry.command === "vault_watch_stop").length,
    0,
  );
});
test("vault closure retains failed watch ownership and waits for stop before releasing admission", async () => {
  const f = fixture({ failStop: true });
  const client = new VaultClient(f.call, undefined, f.channel);
  await client.select();
  const bridge = createNativeBridge(client, "macos");
  assert.equal(bridge.capabilities["file-watch"].status, "available");
  bridge.watch(selected.path, "/", { recursive: true }, (event) =>
    f.events.push(event),
  );
  await assert.rejects(client.close(selected), /stop failed/);
  assert.equal(client.admitted(selected.path), selected);
  assert.ok(!f.calls.some((entry) => entry.command === "vault_close"));
  f.deliver(frame(1, [{ type: "create", path: "retired.md" }]));
  assert.equal(f.events.length, 0);
  f.allowStop();
  await client.closeAll();
  assert.equal(f.calls.at(-1).command, "vault_close");
  assert.throws(() => client.admitted(selected.path), /closed/);
});
test("nonrecursive scope, traversal and oversized batches reject without partial delivery", async () => {
  const f = fixture();
  assert.throws(
    () =>
      startFileWatch(f.call, selected, "../escape", true, () => {}, f.channel),
    /path/,
  );
  const watch = startFileWatch(
    f.call,
    selected,
    "Notes",
    false,
    (event) => f.events.push(event),
    f.channel,
  );
  f.deliver(frame(1, [{ type: "create", path: "Notes/nested/no.md" }]));
  f.deliver(
    frame(
      2,
      Array.from({ length: 257 }, () => ({
        type: "modify",
        path: "Notes/n.md",
      })),
    ),
  );
  f.deliver(frame(3, [{ type: "create", path: "Notes/yes.md" }]));
  assert.deepEqual(
    f.events.map((event) => event.type),
    ["error", "error", "create"],
  );
  await watch.close();
});
