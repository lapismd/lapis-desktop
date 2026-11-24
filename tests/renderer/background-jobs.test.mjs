import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeBackgroundJobs } from "../../src/lib/native/background-jobs/jobs.ts";
test("background jobs use the admitted vault and retain exact commands", async () => {
  const calls = [],
    reply = { revision: 1, jobs: [] };
  const jobs = createNativeBackgroundJobs(
    { sessionId: "admitted" },
    async (name, args) => {
      calls.push([name, args]);
      return reply;
    },
  );
  const command = {
    kind: "runNow",
    pluginId: "tasks",
    jobId: "overdue-digest",
  };
  assert.equal(await jobs.call(command), reply);
  assert.deepEqual(calls, [
    ["vault_background_jobs", { sessionId: "admitted", command }],
  ]);
});
test("unknown background control outcomes are never retried", async () => {
  let count = 0;
  const jobs = createNativeBackgroundJobs(
    { sessionId: "admitted" },
    async () => {
      count++;
      throw { code: "EIO", message: "Lost response" };
    },
  );
  await assert.rejects(
    jobs.call({ kind: "runNow", pluginId: "tasks", jobId: "overdue-digest" }),
    /Lost response/,
  );
  assert.equal(count, 1);
});
