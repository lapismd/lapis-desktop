import test from "node:test";
import assert from "node:assert/strict";
import { AsyncEventQueue } from "../../src/lib/ai/core/event-queue.ts";
import { requireApprovalOption } from "../../src/lib/ai/core/approvals.ts";

test("AI event delivery retains its ordered prefix and wakes a waiting consumer", async () => {
  const queue = new AsyncEventQueue();
  queue.push("one");
  const iterator = queue[Symbol.asyncIterator]();
  assert.deepEqual(await iterator.next(), { done: false, value: "one" });
  const waiting = iterator.next();
  queue.push("two");
  assert.deepEqual(await waiting, { done: false, value: "two" });
  queue.close();
  assert.equal((await iterator.next()).done, true);
  assert.equal(queue.push("late"), false);
});

test("event overflow is explicit and never silently discards an accepted prefix", async () => {
  const queue = new AsyncEventQueue(2);
  queue.push(1);
  queue.push(2);
  assert.throws(() => queue.push(3), /coverage lost/);
  const values = [];
  for await (const value of queue) values.push(value);
  assert.deepEqual(values, [1, 2]);
});

test("close releases a waiting reader without inventing a terminal event", async () => {
  const queue = new AsyncEventQueue();
  const next = queue[Symbol.asyncIterator]().next();
  queue.close();
  assert.equal((await next).done, true);
});

test("custom and unknown provider choices retain exact IDs; semantic defaults cannot approve", () => {
  const option = {
    id: "provider:custom",
    label: "Custom choice",
    kind: "unknown",
  };
  const request = {
    id: "live",
    kind: "other",
    title: "Provider",
    options: [option],
  };
  assert.equal(requireApprovalOption(request, "provider:custom"), option);
  assert.throws(
    () => requireApprovalOption(request, "allow-once"),
    /Unknown approval option/,
  );
});
