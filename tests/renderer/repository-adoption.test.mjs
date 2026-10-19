import test from "node:test";
import assert from "node:assert/strict";
import { AdoptionController } from "../../src/lib/repository/adoption-controller.ts";
import { nativeAdoption } from "../../src/lib/native/repository/adoption.ts";
const source = { operation: "ab".repeat(64), commit: "cd".repeat(20) };
const status = { source, pending: null };
function fixture(guard) {
  const calls = [],
    errors = [],
    states = [];
  let saved;
  const service = {
    async status() {
      return status;
    },
    async adopt(request) {
      calls.push(["adopt", request]);
      return status;
    },
    async stop(id) {
      calls.push(["stop", id]);
      return status;
    },
  };
  const recovery = {
    async load() {
      return saved;
    },
    async save(request) {
      saved = request;
      calls.push(["save", request]);
    },
  };
  const controller = new AdoptionController(
    service,
    recovery,
    { report: (error) => errors.push(error), recovered() {} },
    guard,
  );
  controller.subscribe((state) => states.push(state));
  return { controller, service, recovery, calls, errors, states };
}
test("native adoption uses only the admitted vault and exact original source; malformed data is rejected", async () => {
  const calls = [];
  const service = nativeAdoption("opaque", async (command, args) => {
    calls.push([command, args]);
    return status;
  });
  const request = { request_id: "original", source };
  await service.adopt(request);
  assert.deepEqual(calls[0], [
    "desktop_backup_adoption",
    { request: { sessionId: "opaque", action: { kind: "adopt", request } } },
  ]);
  await service.stop("original");
  assert.deepEqual(calls[1][1].request.action, {
    kind: "stop",
    request_id: "original",
  });
  await assert.rejects(
    service.adopt({ ...request, source: { ...source, operation: "short" } }),
    /Invalid original/,
  );
  assert.equal(calls.length, 2);
});
test("import is guarded and durably records the original request before native work", async () => {
  let guarded = 0;
  const f = fixture(async (action) => {
    guarded++;
    return action();
  });
  await f.controller.refresh();
  await f.controller.adopt();
  assert.equal(guarded, 1);
  assert.deepEqual(
    f.calls.map(([kind]) => kind),
    ["save", "adopt", "save"],
  );
  assert.deepEqual(f.calls[0][1], f.calls[1][1]);
  assert.deepEqual(f.calls[1][1].source, source);
  assert.equal(await f.recovery.load(), undefined);
});
test("canceling editor preparation neither saves a request nor starts native adoption", async () => {
  const f = fixture(async () => undefined);
  await f.controller.refresh();
  await f.controller.adopt();
  assert.deepEqual(f.calls, []);
});
test("a lost response retains the original identity across a new controller and resumes without a second intent", async () => {
  const f = fixture();
  await f.controller.refresh();
  f.service.adopt = async (request) => {
    f.calls.push(["adopt", request]);
    throw new Error("Import reply lost");
  };
  assert.equal(await f.controller.adopt(), false);
  const request = await f.recovery.load();
  assert.deepEqual(
    f.errors.map((error) => error.message),
    ["Import reply lost"],
  );
  assert.equal(await f.controller.adopt(), false);
  f.controller.close();
  f.service.adopt = async (value) => {
    assert.deepEqual(value, request);
    return status;
  };
  const resumed = new AdoptionController(f.service, f.recovery, {
    report: assert.fail,
    recovered() {},
  });
  await resumed.refresh();
  await resumed.resume();
  assert.equal(await f.recovery.load(), undefined);
  resumed.close();
});
test("stopping retains the original native request and clears UI recovery only after acknowledgement", async () => {
  const f = fixture();
  const request = { request_id: "native-original", source };
  f.service.status = async () => ({ source, pending: request });
  await f.controller.refresh();
  await f.controller.stop();
  assert.deepEqual(f.calls[0], ["stop", "native-original"]);
  assert.deepEqual(f.calls[1], ["save", undefined]);
});
test("closing fences presentation while in-flight native import and persistent cleanup drain", async () => {
  const f = fixture();
  await f.controller.refresh();
  let release;
  f.service.adopt = () =>
    new Promise((done) => {
      release = done;
    });
  const activity = [];
  f.controller.subscribeActivity((state) => activity.push(state));
  const job = f.controller.adopt();
  await new Promise((done) => setImmediate(done));
  f.controller.close();
  const count = f.states.length;
  assert.equal(activity.at(-1).busy, true);
  release(status);
  await job;
  await f.controller.drained();
  assert.equal(await f.recovery.load(), undefined);
  assert.equal(f.states.length, count);
  assert.equal(activity.at(-1).busy, false);
});

test("an unreadable original source retains pending recovery and reports through feedback", async () => {
  const f = fixture();
  const request = { request_id: "native-original", source };
  f.service.status = async () => ({
    source: null,
    source_unavailable: true,
    pending: request,
  });
  assert.equal(await f.controller.refresh(), false);
  assert.deepEqual(f.states.at(-1).request, request);
  assert.match(f.errors[0].message, /could not be inspected/);
  await f.controller.stop();
  assert.deepEqual(f.calls[0], ["stop", "native-original"]);
});
