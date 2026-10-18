import test from "node:test";
import assert from "node:assert/strict";
import { BackgroundWork } from "../../src/lib/desktop/background-work.ts";
function setup() {
  const handles = [];
  const notifications = {
    createProgress(options) {
      const handle = {
        options,
        reports: [],
        complete() {
          this.ended = "complete";
        },
        fail(error) {
          this.ended = error;
        },
        report(value) {
          this.reports.push(value);
        },
      };
      handles.push(handle);
      return handle;
    },
  };
  return {
    handles,
    work: new BackgroundWork(notifications, "repository-history"),
  };
}
test("background status spans pending work and clears on success or failure without duplicate feedback", async () => {
  const { handles, work } = setup();
  let done;
  const pending = work.run(
    "Loading JJ Log",
    () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  );
  assert.equal(handles[0].options.location, "status");
  assert.equal(handles[0].options.persistOnError, false);
  assert.equal(handles[0].ended, undefined);
  done(42);
  assert.equal(await pending, 42);
  assert.equal(handles[0].ended, "complete");
  const failure = new Error("read failed");
  await assert.rejects(
    work.run("Loading Op Log", async () => {
      throw failure;
    }),
    failure,
  );
  assert.equal(handles[1].ended, failure);
});
test("each restored view retains its own activity until complete or released", () => {
  const { handles, work } = setup();
  let publish;
  let unsubscribed = false;
  const release = work.follow("Loading JJ Log", {
    subscribe(listener) {
      publish = listener;
      return () => {
        unsubscribed = true;
      };
    },
  });
  publish({ busy: true, phase: "loading" });
  publish({ busy: true, phase: "ready" });
  assert.equal(handles.length, 1);
  assert.deepEqual(
    handles[0].reports.map(({ message }) => message),
    ["Preparing pinned repository data", "Reading repository changes"],
  );
  publish({ busy: false, phase: "ready" });
  assert.equal(handles[0].ended, "complete");
  publish({ busy: true, phase: "loading" });
  release();
  assert.equal(unsubscribed, true);
  assert.equal(handles[1].ended, "complete");
});
