import test from "node:test";
import assert from "node:assert/strict";
import { RemoteController } from "../../src/lib/repository/remote-controller.ts";
import { nativeRemote } from "../../src/lib/native/repository/remote.ts";
import { updateRepositoryData } from "../../src/lib/repository/plugin-data.ts";
const empty = { revision: 0, configuration: null, checkpoint: null };
const connected = {
  revision: 1,
  configuration: {
    account: "account",
    project: "owner/notes",
    target: { url: "https://github.com/owner/notes.git", branch: "main" },
    canPush: true,
  },
  checkpoint: null,
};
function held() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
function fixture() {
  const states = [],
    errors = [],
    calls = [];
  const service = {
    async status() {
      return empty;
    },
    async configure(...args) {
      calls.push(args);
      return connected;
    },
    async fetch(revision) {
      calls.push({ fetch: revision });
      return {
        ...connected,
        checkpoint: { commit: "a".repeat(40), operation: "b".repeat(128) },
      };
    },
    async disconnect(revision) {
      calls.push({ disconnect: revision });
      return { ...empty, revision: 2 };
    },
  };
  const controller = new RemoteController(service, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  controller.subscribe((state) => states.push(state));
  return { controller, service, states, errors, calls };
}
test("remote configuration and fetch retain exact observed revisions and preserve state on failure", async () => {
  const f = fixture();
  await f.controller.refresh();
  await f.controller.configure("account", " owner/notes ", " main ");
  assert.deepEqual(f.calls[0], [0, "account", "owner/notes", "main"]);
  await f.controller.fetch();
  assert.deepEqual(f.calls[1], { fetch: 1 });
  f.service.disconnect = async () => {
    throw new Error("Connection changed");
  };
  assert.equal(await f.controller.disconnect(), false);
  assert.equal(f.states.at(-1).data.configuration.project, "owner/notes");
  assert.equal(f.errors[0].message, "Connection changed");
  f.controller.close();
});
test("closing a remote settings view fences late responses but retains activity until native work drains", async () => {
  const f = fixture(),
    pending = held(),
    activity = [];
  f.service.status = () => pending.promise;
  f.controller.subscribeActivity((value) => activity.push(value));
  const read = f.controller.refresh();
  const count = f.states.length;
  f.controller.close();
  assert.equal(activity.at(-1).busy, true);
  pending.resolve(connected);
  await read;
  await f.controller.drained();
  assert.equal(f.states.length, count);
  assert.equal(activity.at(-1).busy, false);
  assert.equal(f.errors.length, 0);
});
test("native remote frames bind the admitted session and never forward paths or secrets", async () => {
  const calls = [];
  const service = nativeRemote("opaque-session", async (command, args) => {
    calls.push({ command, args });
    return connected;
  });
  await service.configure(4, "account", "owner/notes", "");
  assert.deepEqual(calls[0], {
    command: "desktop_backup_remote",
    args: {
      request: {
        sessionId: "opaque-session",
        action: {
          kind: "configure",
          revision: 4,
          account: "account",
          project: "owner/notes",
          branch: null,
        },
      },
    },
  });
  const request = {
    request_id: "stable",
    checkpoint: "a".repeat(40),
    expected: "b".repeat(40),
  };
  await service.restore(request);
  assert.deepEqual(calls[1].args.request.action, { kind: "restore", request });
  await service.keepCurrent();
  assert.equal(calls[2].command, "desktop_backup_capture");
  const invalid = nativeRemote("opaque", async () => ({ revision: -1 }));
  await assert.rejects(invalid.status(), /Invalid remote/);
});
test("concurrent recovery and settings writes merge without losing another original command", async () => {
  let data = { showWorkingCopyStatus: true };
  const pending = held();
  let saves = 0;
  const owner = {
    async loadData() {
      return data;
    },
    async saveData(next) {
      if (++saves === 1) await pending.promise;
      data = next;
    },
  };
  const local = updateRepositoryData(owner, {
    pendingRestore: { request: "local-original" },
  });
  const remote = updateRepositoryData(owner, {
    pendingRemoteRestore: { request: "remote-original" },
  });
  const settings = updateRepositoryData(owner, {
    showWorkingCopyStatus: false,
  });
  pending.resolve();
  await Promise.all([local, remote, settings]);
  assert.deepEqual(data, {
    showWorkingCopyStatus: false,
    pendingRestore: { request: "local-original" },
    pendingRemoteRestore: { request: "remote-original" },
  });
});
test("a failed plugin-data write does not poison subsequent recovery persistence", async () => {
  let data = {},
    fail = true;
  const owner = {
    async loadData() {
      return data;
    },
    async saveData(next) {
      if (fail) {
        fail = false;
        throw new Error("write failed");
      }
      data = next;
    },
  };
  await assert.rejects(
    updateRepositoryData(owner, { pendingRestore: { id: "first" } }),
    /write failed/,
  );
  await updateRepositoryData(owner, {
    pendingRemoteRestore: { id: "original" },
  });
  assert.deepEqual(data, { pendingRemoteRestore: { id: "original" } });
});
test("recreated plugin owners serialize their writes and an obsolete completion cannot clear a newer intent", async () => {
  const app = {},
    pause = held();
  let data = { pendingRemoteRestore: { request: { request_id: "old" } } },
    saves = 0;
  const owner = () => ({
    app,
    id: "repository-history",
    async loadData() {
      return data;
    },
    async saveData(next) {
      if (++saves === 1) await pause.promise;
      data = next;
    },
  });
  const old = owner(),
    fresh = owner();
  const clear = (current) =>
    current.pendingRemoteRestore?.request.request_id === "old"
      ? { pendingRemoteRestore: null }
      : {};
  const completing = updateRepositoryData(old, clear);
  const starting = updateRepositoryData(fresh, {
    pendingRemoteRestore: { request: { request_id: "new" } },
  });
  pause.resolve();
  await Promise.all([completing, starting]);
  await updateRepositoryData(old, clear);
  assert.equal(data.pendingRemoteRestore.request.request_id, "new");
});
