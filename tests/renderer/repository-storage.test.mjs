import test from "node:test";
import assert from "node:assert/strict";
import { StorageController } from "../../src/lib/repository/storage-controller.ts";
import { nativeStorage } from "../../src/lib/native/repository/storage.ts";
const external = { revision: 0, location: "external", pending: null };
const colocated = { revision: 1, location: "colocated", pending: null };
function held() {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { resolve, promise };
}
function setup(guard) {
  const errors = [],
    calls = [],
    states = [];
  const service = {
    async status() {
      return external;
    },
    async change(...args) {
      calls.push(["change", ...args]);
      return colocated;
    },
    async recover() {
      calls.push(["recover"]);
      return colocated;
    },
    async rollback(id) {
      calls.push(["rollback", id]);
      return external;
    },
    async reload() {
      calls.push(["reload"]);
    },
  };
  const controller = new StorageController(
    service,
    { report: (error) => errors.push(error), recovered() {} },
    guard,
  );
  controller.subscribe((state) => states.push(state));
  return { controller, service, errors, calls, states };
}
test("native storage accepts only the admitted session and native-selected layout with original request", async () => {
  const calls = [];
  const service = nativeStorage("opaque", async (command, args) => {
    calls.push([command, args]);
    return colocated;
  });
  await service.change(3, "colocated", "original");
  assert.deepEqual(calls[0], [
    "desktop_backup_storage",
    {
      request: {
        sessionId: "opaque",
        action: {
          kind: "change",
          revision: 3,
          location: "colocated",
          request_id: "original",
        },
      },
    },
  ]);
  await service.recover();
  await service.rollback("original");
  await service.reload();
  assert.deepEqual(calls[1][1].request.action, { kind: "recover" });
  assert.deepEqual(calls[2][1].request.action, {
    kind: "rollback",
    request_id: "original",
  });
  assert.deepEqual(calls[3], ["lifecycle_reload", undefined]);
  const invalid = nativeStorage("opaque", async () => ({
    ...external,
    location: "/renderer/path",
  }));
  await assert.rejects(invalid.status(), /Invalid history storage/);
});
test("moving uses the observed revision, guards saved files and reloads once", async () => {
  let guarded = 0;
  const f = setup(async (action) => {
    guarded++;
    return action();
  });
  await f.controller.refresh();
  assert.equal(await f.controller.change("colocated"), true);
  assert.equal(guarded, 1);
  assert.deepEqual(f.calls[0].slice(0, 3), ["change", 0, "colocated"]);
  assert.match(f.calls[0][3], /^[a-f0-9-]+$/);
  assert.deepEqual(f.calls[1], ["reload"]);
  assert.equal(f.states.at(-1).needsReload, true);
  f.controller.close();
});
test("canceled editor preparation never starts a storage move or reload", async () => {
  const f = setup(async () => undefined);
  await f.controller.refresh();
  assert.equal(await f.controller.change("colocated"), false);
  assert.deepEqual(f.calls, []);
  assert.equal(f.states.at(-1).needsReload, false);
  f.controller.close();
});
test("a lost move response exposes the original native recovery and cannot start another intent", async () => {
  const f = setup();
  await f.controller.refresh();
  f.service.change = async (_revision, _location, id) => {
    f.calls.push(["change", id]);
    f.service.status = async () => ({
      ...external,
      pending: { request_id: id, location: "colocated", phase: "archived" },
    });
    throw new Error("Storage move response was lost");
  };
  assert.equal(await f.controller.change("colocated"), false);
  const original = f.states.at(-1).data.pending.request_id;
  assert.equal(await f.controller.change("colocated"), false);
  assert.equal(f.calls.length, 1);
  assert.equal(f.errors[0].message, "Storage move response was lost");
  await f.controller.rollback();
  assert.deepEqual(f.calls[1], ["rollback", original]);
  assert.deepEqual(f.calls[2], ["reload"]);
  f.controller.close();
});
test("a failed reload retries only the reload after the layout is installed", async () => {
  const f = setup();
  await f.controller.refresh();
  f.service.status = async () => colocated;
  f.service.reload = async () => {
    throw new Error("Reload needs retry");
  };
  assert.equal(await f.controller.change("colocated"), false);
  assert.equal(f.states.at(-1).needsReload, true);
  f.service.reload = async () => f.calls.push(["reload"]);
  await f.controller.reload();
  assert.equal(f.calls.filter(([kind]) => kind === "change").length, 1);
  assert.deepEqual(f.calls.at(-1), ["reload"]);
  f.controller.close();
});
test("closing fences delayed status and keeps progress visible until native work drains", async () => {
  const f = setup(),
    pending = held(),
    activity = [];
  f.service.status = () => pending.promise;
  f.controller.subscribeActivity((state) => activity.push(state));
  const loading = f.controller.refresh();
  const count = f.states.length;
  f.controller.close();
  assert.equal(activity.at(-1).busy, true);
  pending.resolve(external);
  await loading;
  await f.controller.drained();
  assert.equal(f.states.length, count);
  assert.equal(activity.at(-1).busy, false);
  assert.deepEqual(f.errors, []);
});

test("an already requested native move finishes its reload even if its observer closes", async () => {
  const f = setup(),
    pending = held();
  await f.controller.refresh();
  f.service.change = () => pending.promise;
  const move = f.controller.change("colocated");
  await new Promise((done) => setImmediate(done));
  f.controller.close();
  const count = f.states.length;
  pending.resolve(colocated);
  await move;
  await f.controller.drained();
  assert.deepEqual(f.calls, [["reload"]]);
  assert.equal(f.states.length, count, "closed presentation remains fenced");
});

test("showing storage uses its native revision and never invokes the migration guard or reload", async () => {
  let guarded = false;
  const f = setup(async () => {
    guarded = true;
    throw new Error("Unexpected mutation");
  });
  f.service.status = async () => ({
    ...external,
    repositoryPath: "/native/history/vault/repo",
    canReveal: true,
  });
  f.service.reveal = async (revision) => {
    f.calls.push(["reveal", revision]);
    return f.service.status();
  };
  await f.controller.refresh();
  await f.controller.reveal();
  assert.equal(guarded, false);
  assert.deepEqual(f.calls, [["reveal", 0]]);
  assert.equal(f.states.at(-1).needsReload, false);
  f.controller.close();
});

test("native reveal sends only session and revision, rejecting malformed display metadata", async () => {
  const calls = [];
  const service = nativeStorage("opaque", async (command, args) => {
    calls.push([command, args]);
    return { ...external, repositoryPath: "/native/repo", canReveal: true };
  });
  await service.reveal(7);
  assert.deepEqual(calls, [
    [
      "desktop_backup_storage",
      {
        request: {
          sessionId: "opaque",
          action: { kind: "reveal", revision: 7 },
        },
      },
    ],
  ]);
  const invalid = nativeStorage("opaque", async () => ({
    ...external,
    repositoryPath: 42,
    canReveal: true,
  }));
  await assert.rejects(invalid.status(), /Invalid history storage state/);
});
