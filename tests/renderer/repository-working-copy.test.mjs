import test from "node:test";
import assert from "node:assert/strict";
import { WorkingCopyController } from "../../src/lib/repository/working-copy-controller.ts";
import { parseWorkingCopyStatus } from "../../src/lib/repository/working-copy-status.ts";
const frame = {
  version: 1,
  operation: "ab".repeat(64),
  working_copy: "cd".repeat(20),
  workspace: "default",
  commit: {
    change_id: "ef".repeat(16),
    description: "Working copy",
    author: {
      name: "Ada",
      email: "dev@lapis.md",
      timestamp: { millis: "9223372036854775807", offset_minutes: 0 },
    },
  },
  files: 2,
  lines: { additions: 1, deletions: 22 },
  uncounted: 0,
};
const value = parseWorkingCopyStatus(JSON.stringify(frame));
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
test("status frame retains full identities/time and refuses false complete totals", () => {
  assert.equal(value.author.timestamp.millis, 9223372036854775807n);
  assert.equal(value.revision, frame.working_copy);
  for (const patch of [
    { files: -1 },
    { lines: null },
    { uncounted: 1 },
    { operation: "short" },
    { version: 2 },
  ])
    assert.throws(() =>
      parseWorkingCopyStatus(JSON.stringify({ ...frame, ...patch })),
    );
  const binary = parseWorkingCopyStatus(
    JSON.stringify({ ...frame, lines: null, uncounted: 1 }),
  );
  assert.equal(binary.lines, null);
});
test("refresh coalesces and hidden status drains then rejects late results", async () => {
  const pending = deferred();
  let calls = 0;
  const states = [],
    failures = [];
  const controller = new WorkingCopyController(
    () => {
      calls++;
      return pending.promise;
    },
    { report: (e) => failures.push(e), recovered() {} },
  );
  controller.subscribe((s) => states.push(s));
  const first = controller.refresh(),
    second = controller.refresh();
  assert.equal(first, second);
  assert.equal(calls, 1);
  let drained = false;
  const close = controller.close().then(() => {
    drained = true;
  });
  await Promise.resolve();
  assert.equal(drained, false);
  pending.resolve(value);
  await first;
  await close;
  assert.equal(
    states.some((s) => s.value),
    false,
  );
  assert.deepEqual(failures, []);
  await controller.refresh();
  assert.equal(calls, 1);
  assert.equal(states.at(-1).busy, false);
});
test("failed refresh clears old totals and reports once; explicit recovery replaces them", async () => {
  const errors = [];
  let fail = false,
    recovered = 0;
  const states = [];
  const controller = new WorkingCopyController(
    async () => {
      if (fail) throw Error("Scan changed");
      return value;
    },
    {
      report: (e) => errors.push(e),
      recovered() {
        recovered++;
      },
    },
  );
  controller.subscribe((s) => states.push(s));
  await controller.refresh();
  fail = true;
  await controller.refresh();
  assert.equal(states.at(-1).status, "unavailable");
  assert.equal(states.at(-1).value, undefined);
  assert.equal(errors.length, 1);
  fail = false;
  await controller.refresh();
  assert.equal(recovered, 2);
  assert.equal(states.at(-1).value, value);
  await controller.close();
});
