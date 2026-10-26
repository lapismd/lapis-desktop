import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NativeTaskError,
  NativeTasksSession,
} from "@lapis-notes/api/native-tasks";
import {
  createNativeTasks,
  validateTasksSelection,
} from "../../src/lib/native/tasks/tasks.ts";

const selected = { sessionId: "admitted-session" };

test("native Task calls retain the existing vault admission and exact typed outcome", async () => {
  const calls = [];
  const failure = {
    kind: "failure",
    failure: {
      name: "TaskRecoveryError",
      code: "ECONFLICT",
      message: "Inspect the accepted operation before retrying",
      parts: ["daily"],
      request_id: "accepted-request",
      uncertain: true,
      operation: null,
    },
  };
  const port = createNativeTasks(selected, async (command, args) => {
    calls.push([command, args]);
    return failure;
  });
  const command = { kind: "inspect", request_id: "accepted-request" };
  assert.equal(await port.call(command), failure);
  assert.deepEqual(calls, [
    ["vault_tasks", { sessionId: "admitted-session", command }],
  ]);
});

test("Task permission and lost-response errors are never replayed or replaced by renderer work", async () => {
  for (const code of ["EACCES", "EIO", "ENOTSUP"]) {
    let calls = 0;
    const port = createNativeTasks(selected, async () => {
      calls++;
      throw { code, message: "Native Task admission failed" };
    });
    await assert.rejects(
      port.call({ kind: "retry", request_id: "accepted-request" }),
      (error) => error.code === code && /admission failed/.test(error.message),
    );
    assert.equal(calls, 1);
  }
});

test("Task selection stays renderer-owned unless explicitly selected with native writer prerequisites", () => {
  assert.doesNotThrow(() =>
    validateTasksSelection("renderer", "renderer", "renderer"),
  );
  assert.doesNotThrow(() => validateTasksSelection("core", "core", "core"));
  for (const [tasks, metadata, editing] of [
    ["auto", "core", "core"],
    ["core", "renderer", "core"],
    ["core", "core", "renderer"],
  ]) {
    assert.throws(
      () => validateTasksSelection(tasks, metadata, editing),
      /Tasks|tasks/,
    );
  }
});

test("the public App observer drains an accepted transport call on passive detach without disabling it", async () => {
  const accepted = Promise.withResolvers();
  const calls = [];
  const observer = new NativeTasksSession(
    createNativeTasks(selected, async (command, args) => {
      calls.push([command, args]);
      return accepted.promise;
    }),
  );
  const pending = observer.call({ kind: "status" });
  await Promise.resolve();
  let drained = false;
  const detached = observer.detach().then(() => {
    drained = true;
  });
  await assert.rejects(observer.call({ kind: "status" }), /detached/);
  assert.equal(drained, false);
  accepted.resolve({
    kind: "status",
    status: { enabled: true, configuration: null, tracked: null },
  });
  await pending;
  await detached;
  assert.deepEqual(calls, [
    [
      "vault_tasks",
      { sessionId: selected.sessionId, command: { kind: "status" } },
    ],
  ]);
});

test("the public observer retains uncertain Task failure identity from the native transport", async () => {
  const observer = new NativeTasksSession(
    createNativeTasks(selected, async () => ({
      kind: "failure",
      failure: {
        name: "TaskRecoveryError",
        code: "IO",
        message: "Inspect the original operation",
        parts: ["daily"],
        request_id: "accepted-request",
        uncertain: true,
        operation: null,
      },
    })),
  );
  await assert.rejects(
    observer.call({ kind: "inspect", request_id: "accepted-request" }),
    (error) => {
      assert.ok(error instanceof NativeTaskError);
      assert.equal(error.requestId, "accepted-request");
      assert.equal(error.uncertain, true);
      assert.deepEqual(error.parts, ["daily"]);
      return true;
    },
  );
  await observer.detach();
});
