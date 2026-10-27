import { test } from "node:test";
import assert from "node:assert/strict";
import { observeTaskTransport } from "../desktop/tasks-transport.ts";

function fixture() {
  const calls = [];
  const reply = { kind: "operation", operation: { disposition: "completed" } };
  const invoke = async (...args) => {
    calls.push(args);
    return reply;
  };
  const target = { invoke };
  const probe = observeTaskTransport(target);
  return { calls, reply, invoke, target, probe };
}
const submit = {
  sessionId: "admitted",
  command: { kind: "submit", request: { request_id: "one" } },
};

test("Task transport probe forwards ordinary calls and options unchanged", async () => {
  const f = fixture();
  const args = { path: "untouched" },
    options = { headers: { test: "yes" } };
  assert.equal(await f.target.invoke("ordinary", args, options), f.reply);
  assert.deepEqual(f.calls, [["ordinary", args, options]]);
  assert.deepEqual(f.probe.snapshot().records, []);
  f.probe.dispose();
  assert.equal(f.target.invoke, f.invoke);
});

test("Task submission gate holds before native admission and cleanup drains it", async () => {
  const f = fixture();
  f.probe.holdNextSubmit();
  const pending = f.target.invoke("vault_tasks", submit);
  await Promise.resolve();
  assert.equal(f.probe.snapshot().held, "submit");
  assert.equal(f.calls.length, 0);
  f.probe.dispose();
  assert.equal(await pending, f.reply);
  assert.equal(f.calls.length, 1);
});

test("Task lost reply records actual native completion and never retries", async () => {
  const f = fixture();
  f.probe.loseNextSubmitReply();
  await assert.rejects(f.target.invoke("vault_tasks", submit), /reply lost/i);
  assert.equal(f.calls.length, 1);
  const [record] = f.probe.snapshot().records;
  assert.equal(record.sessionId, "admitted");
  assert.deepEqual(record.native, f.reply);
  assert.equal(record.lostReply, true);
  assert.equal(await f.target.invoke("vault_tasks", submit), f.reply);
  assert.equal(f.calls.length, 2);
  f.probe.dispose();
});

test("Task save gate matches only the selected conditional write", async () => {
  const f = fixture();
  f.probe.holdNextSave("Hosted.md");
  await f.target.invoke("vault_fs", {
    request: { operation: "write-text", path: "Hosted.md" },
  });
  await f.target.invoke("vault_fs", {
    request: { operation: "write-text-if-unchanged", path: "Other.md" },
  });
  const pending = f.target.invoke("vault_fs", {
    request: { operation: "write-text-if-unchanged", path: "Hosted.md" },
  });
  await Promise.resolve();
  assert.equal(f.calls.length, 2);
  assert.equal(f.probe.snapshot().held, "save:Hosted.md");
  f.probe.release();
  await pending;
  assert.equal(f.calls.length, 3);
  f.probe.dispose();
});

test("Task transport probe retains native refusals without rewriting them", async () => {
  const failure = { code: "EACCES", message: "revoked" };
  const target = {
    invoke: async () => {
      throw failure;
    },
  };
  const probe = observeTaskTransport(target);
  await assert.rejects(
    target.invoke("vault_tasks", submit),
    (error) => error === failure,
  );
  assert.match(probe.snapshot().records[0].error, /revoked/);
  probe.dispose();
});
