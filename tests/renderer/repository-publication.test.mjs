import { test } from "node:test";
import assert from "node:assert/strict";
import { RemoteController } from "../../src/lib/repository/remote-controller.ts";
import { nativeRemote } from "../../src/lib/native/repository/remote.ts";
const pending = {
  request_id: "original",
  before: null,
  after: "a".repeat(40),
  outcome: "unknown",
};
test("publication recovery pins original request and connection revision, preserves failed state, and fences close", async () => {
  let value = {
    revision: 8,
    configuration: {
      account: "a",
      project: "o/n",
      target: { url: "https://github.com/o/n.git", branch: "main" },
      canPush: false,
    },
    checkpoint: null,
    publication: pending,
  };
  let fail = true;
  const calls = [],
    errors = [];
  const controller = new RemoteController(
    {
      status: async () => value,
      publication: {
        observe: async (revision, id) => {
          calls.push([revision, id]);
          return value;
        },
        stop: async (revision, id) => {
          calls.push([revision, id]);
          if (fail) throw Error("Original push still active");
          return { ...value, publication: null };
        },
      },
    },
    { report: (error) => errors.push(error), recovered() {} },
  );
  let state;
  controller.subscribe((next) => (state = next));
  await controller.refresh();
  await controller.observePublication("original");
  assert.deepEqual(calls[0], [8, "original"]);
  assert.equal(await controller.stopPublication("original"), false);
  assert.equal(state.data.publication.request_id, "original");
  assert.equal(errors.length, 1);
  fail = false;
  assert.equal(await controller.stopPublication("original"), true);
  assert.equal(state.data.publication, null);
  controller.close();
  assert.equal(await controller.observePublication("original"), false);
});
test("native observation and explicit stop never forward endpoints, paths or credentials", async () => {
  const frames = [];
  const service = nativeRemote("opaque", async (command, args) => {
    frames.push({ command, ...args });
    return {
      revision: 4,
      configuration: null,
      checkpoint: null,
      publication: pending,
    };
  });
  await service.publication.observe(4, "original");
  await service.publication.stop(4, "original");
  assert.deepEqual(
    frames.map((frame) => frame.request.action),
    [
      { kind: "observe_publication", revision: 4, request_id: "original" },
      { kind: "stop_publication", revision: 4, request_id: "original" },
    ],
  );
  assert(
    frames.every(
      (frame) =>
        frame.command === "desktop_backup_remote" &&
        frame.request.sessionId === "opaque",
    ),
  );
});
test("automatic sync observes an original unknown request before any new merge or push", async () => {
  const { SyncController } = await import(
    "../../src/lib/repository/sync-controller.ts"
  );
  let unresolved = true;
  const calls = [],
    errors = [];
  const value = {
    revision: 3,
    configuration: { canPush: true },
    checkpoint: null,
    publication: pending,
  };
  const remote = {
    status: async () => value,
    publication: {
      observe: async (revision, id) => {
        calls.push("observe");
        assert.equal(revision, 3);
        assert.equal(id, "original");
        return unresolved ? value : { ...value, publication: null };
      },
    },
  };
  const service = {
    prepare: async () => {
      calls.push("prepare");
      return null;
    },
    publish: async () => {
      calls.push("publish");
      return "complete";
    },
  };
  const controller = new SyncController(
    remote,
    service,
    async (action) => action(),
    { report: (error) => errors.push(error), recovered() {} },
    { load: async () => null, save: async () => {} },
  );
  await controller.run();
  assert.deepEqual(calls, ["observe"]);
  assert.equal(errors.length, 1);
  unresolved = false;
  await controller.run();
  assert.deepEqual(calls, ["observe", "observe", "prepare", "publish"]);
  controller.close();
});
