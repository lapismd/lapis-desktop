import test from "node:test";
import assert from "node:assert/strict";
import { BackupController } from "../../src/lib/repository/backup.ts";
const ready = { phase: "ready", checkpoint: null, error: null };
function fixture(start) {
  const calls = [],
    errors = [];
  let changed;
  const service = {
    async start(callback) {
      calls.push("start");
      changed = callback;
      return start ? start(callback) : ready;
    },
    async capture() {
      calls.push("capture");
      return ready;
    },
    async stop() {
      calls.push("stop");
    },
  };
  const states = [];
  const controller = new BackupController(service, {
    report: (error) => errors.push(error),
    recovered: () => calls.push("recovered"),
  });
  controller.subscribe((state) => states.push(state));
  return {
    controller,
    service,
    calls,
    errors,
    states,
    changed: (value) => changed(value),
  };
}
test("a newer backup event cannot be replaced by the older start response", async () => {
  const f = fixture(async (changed) => {
    changed({ ...ready, phase: "saving" });
    return ready;
  });
  await f.controller.start();
  assert.equal(f.states.at(-1).phase, "saving");
  await f.controller.close();
});
test("removing a status observer does not stop automatic backup", async () => {
  const f = fixture();
  await f.controller.start();
  const dispose = f.controller.subscribe(() => {});
  dispose();
  f.changed({ ...ready, phase: "saving" });
  assert.equal(f.states.at(-1).phase, "saving");
  assert.equal(f.calls.includes("stop"), false);
  await f.controller.refresh();
  assert.ok(f.calls.includes("capture"));
  await f.controller.close();
  assert.equal(f.calls.filter((c) => c === "stop").length, 1);
});
test("failed capture reports a readable error and successful retry clears it", async () => {
  const f = fixture();
  await f.controller.start();
  f.service.capture = async () => {
    throw new Error("Backup storage is full");
  };
  await f.controller.refresh();
  assert.equal(f.states.at(-1).phase, "failed");
  assert.equal(f.errors.at(-1).message, "Backup storage is full");
  f.service.capture = async () => ready;
  await f.controller.refresh();
  assert.equal(f.states.at(-1).phase, "ready");
  assert.equal(f.states.at(-1).error, null);
  await f.controller.close();
});
test("close drains the native stop and fences delayed event delivery", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.close();
  f.changed(ready);
  assert.equal(f.states.at(-1).phase, "closed");
  await f.controller.refresh();
  assert.equal(f.calls.includes("capture"), false);
});
test("a lost start response still drains the possible native owner on close", async () => {
  const f = fixture(async () => {
    throw new Error("Start response was lost");
  });
  await f.controller.start();
  assert.equal(f.states.at(-1).phase, "failed");
  await f.controller.close();
  assert.equal(f.calls.filter((c) => c === "stop").length, 1);
});
test("pause fences delayed native events before a later enable", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.pause();
  f.changed(ready);
  assert.equal(f.states.at(-1).phase, "closed");
  await f.controller.start();
  assert.equal(f.states.at(-1).phase, "ready");
  await f.controller.close();
});
test("failed pause retains cleanup ownership and retries before enabling", async () => {
  const f = fixture();
  await f.controller.start();
  let attempts = 0;
  f.service.stop = async () => {
    f.calls.push("stop");
    if (++attempts === 1) throw new Error("Stop response was lost");
  };
  await assert.rejects(f.controller.pause(), /Stop response was lost/);
  assert.equal(f.states.at(-1).phase, "failed");
  f.changed(ready);
  assert.equal(f.states.at(-1).phase, "failed");
  await f.controller.start();
  assert.deepEqual(
    f.calls.filter((c) => c === "start" || c === "stop"),
    ["start", "stop", "stop", "start"],
  );
  assert.equal(f.states.at(-1).phase, "ready");
  await f.controller.close();
});
