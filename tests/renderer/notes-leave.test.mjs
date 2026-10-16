import { test } from "node:test";
import assert from "node:assert/strict";
import { leaveWithStoppedWatching } from "../../src/lib/notes/notes-leave.ts";

test("leaving stops watching before persistence and does not restart after success", async () => {
  const events = [];
  const app = {
    vaultChanges: {
      stop: async () => events.push("stop"),
      start: async () => events.push("start"),
    },
  };
  await leaveWithStoppedWatching(
    app,
    async () => events.push("leave"),
    () => true,
  );
  assert.deepEqual(events, ["stop", "leave"]);
});
test("a failed save resumes watching before returning the original failure", async () => {
  const events = [];
  const original = new Error("save failed");
  const app = {
    vaultChanges: {
      stop: async () => events.push("stop"),
      start: async () => events.push("start"),
    },
  };
  await assert.rejects(
    leaveWithStoppedWatching(
      app,
      async () => {
        events.push("leave");
        throw original;
      },
      () => true,
    ),
    (error) => error === original,
  );
  assert.deepEqual(events, ["stop", "leave", "start"]);
});
test("failed cleanup never starts destructive teardown and preserves a resume failure", async () => {
  const original = new Error("stop failed"),
    resume = new Error("resume failed");
  let left = false;
  const app = {
    vaultChanges: {
      stop: async () => {
        throw original;
      },
      start: async () => {
        throw resume;
      },
    },
  };
  await assert.rejects(
    leaveWithStoppedWatching(
      app,
      async () => {
        left = true;
      },
      () => true,
    ),
    (error) =>
      error instanceof AggregateError &&
      error.errors[0] === original &&
      error.errors[1] === resume,
  );
  assert.equal(left, false);
});
test("a partially disposed App never restarts watching", async () => {
  let resumed = false,
    live = true;
  const app = {
    vaultChanges: {
      stop: async () => {},
      start: async () => {
        resumed = true;
      },
    },
  };
  await assert.rejects(
    leaveWithStoppedWatching(
      app,
      async () => {
        live = false;
        throw new Error("teardown failed");
      },
      () => live,
    ),
  );
  assert.equal(resumed, false);
});
