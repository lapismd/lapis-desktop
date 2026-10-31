import { test } from "node:test";
import assert from "node:assert/strict";
import { observeTaskTransport } from "../desktop/tasks-transport.ts";
import { NativeTasksSession } from "@lapis-notes/api/native-tasks";
import { createNativeTasks } from "../../src/lib/native/tasks/tasks.ts";

function fixture() {
  const calls = [];
  const reply = { kind: "operation", operation: { disposition: "completed" } };
  const invoke = async (...args) => {
    calls.push(args);
    return reply;
  };
  const target = Object.freeze({ invoke });
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
  assert.equal(await f.probe.invoke("ordinary", args, options), f.reply);
  assert.deepEqual(f.calls, [["ordinary", args, options]]);
  assert.deepEqual(f.probe.snapshot().records, []);
  f.probe.dispose();
  assert.equal(f.target.invoke, f.invoke);
});

test("Task submission gate holds before native admission and cleanup drains it", async () => {
  const f = fixture();
  f.probe.holdNextSubmit();
  const pending = f.probe.invoke("vault_tasks", submit);
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
  await assert.rejects(f.probe.invoke("vault_tasks", submit), /reply lost/i);
  assert.equal(f.calls.length, 1);
  const [record] = f.probe.snapshot().records;
  assert.equal(record.sessionId, "admitted");
  assert.deepEqual(record.native, f.reply);
  assert.equal(record.lostReply, true);
  assert.equal(await f.probe.invoke("vault_tasks", submit), f.reply);
  assert.equal(f.calls.length, 2);
  f.probe.dispose();
});

test("Task save gate matches only the selected conditional write", async () => {
  const f = fixture();
  f.probe.holdNextSave("Hosted.md");
  await f.probe.invoke("vault_fs", {
    request: { operation: "write-text", path: "Hosted.md" },
  });
  await f.probe.invoke("vault_fs", {
    request: { operation: "write-text-if-unchanged", path: "Other.md" },
  });
  const pending = f.probe.invoke("vault_fs", {
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
    probe.invoke("vault_tasks", submit),
    (error) => error === failure,
  );
  assert.match(probe.snapshot().records[0].error, /revoked/);
  probe.dispose();
});

test("ordinary read gate holds all selected reads while native editing snapshots remain real", async () => {
  const f = fixture();
  f.probe.holdFileReads("Note.md");
  const read = { request: { operation: "read-text", path: "Note.md" } };
  const pending = [
    f.probe.invoke("vault_fs", read),
    f.probe.invoke("vault_fs", read),
  ];
  await Promise.resolve();
  assert.equal(f.calls.length, 0);
  assert.equal(f.probe.snapshot().held, "read:Note.md");
  const snapshot = { path: "Note.md", sessionId: "admitted" };
  assert.equal(
    await f.probe.invoke("vault_editing_snapshot", snapshot),
    f.reply,
  );
  assert.deepEqual(f.calls, [["vault_editing_snapshot", snapshot, undefined]]);
  f.probe.release();
  assert.deepEqual(await Promise.all(pending), [f.reply, f.reply]);
  assert.equal(f.calls.length, 3);
  assert.equal(f.target.invoke, f.invoke);
  f.probe.dispose();
});

test("protected editing observation failure is exact-path and one-shot without fabricating a native outcome", async () => {
  const f = fixture();
  f.probe.failNextEditingSnapshot("Note.md");
  const selected = { sessionId: "admitted", path: "Note.md" };
  const other = { sessionId: "admitted", path: "Other.md" };
  const options = { headers: { test: "yes" } };
  assert.equal(
    await f.probe.invoke("vault_editing_snapshot", other, options),
    f.reply,
  );
  await assert.rejects(
    f.probe.invoke("vault_editing_snapshot", selected),
    /Protected saved-text observation failed: Note.md/,
  );
  assert.deepEqual(f.probe.snapshot().failedEditingSnapshots, ["Note.md"]);
  assert.deepEqual(f.calls, [["vault_editing_snapshot", other, options]]);
  assert.equal(
    await f.probe.invoke("vault_editing_snapshot", selected, options),
    f.reply,
  );
  assert.deepEqual(f.calls.at(-1), [
    "vault_editing_snapshot",
    selected,
    options,
  ]);
  assert.deepEqual(f.probe.snapshot().records, []);
});

test("disposing the fixture clears an unconsumed protected-observation fault", async () => {
  const f = fixture();
  f.probe.failNextEditingSnapshot("Note.md");
  f.probe.dispose();
  const selected = { sessionId: "admitted", path: "Note.md" };
  assert.equal(
    await f.probe.invoke("vault_editing_snapshot", selected),
    f.reply,
  );
  assert.deepEqual(f.probe.snapshot().failedEditingSnapshots, []);
  assert.equal(f.calls.length, 1);
});

test("forwarding below the public observer retains its pending drain and typed native outcome", async () => {
  const f = fixture();
  const observer = new NativeTasksSession(
    createNativeTasks({ sessionId: "admitted" }, f.probe.invoke),
  );
  f.probe.holdNextSubmit();
  const pending = observer.call(submit.command);
  await Promise.resolve();
  assert.equal(f.calls.length, 0);
  let drained = false;
  const detached = observer.detach().then(() => {
    drained = true;
  });
  await Promise.resolve();
  assert.equal(drained, false);
  await assert.rejects(observer.call({ kind: "status" }), /detached/);
  f.probe.release();
  assert.equal(await pending, f.reply);
  await detached;
  assert.equal(drained, true);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.probe.snapshot().records[0].native, f.reply);
});
