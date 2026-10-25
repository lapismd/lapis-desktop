import test from "node:test";
import assert from "node:assert/strict";
import { HistoryIndexController } from "../../src/lib/repository/history-index-controller.ts";
import {
  nativeIndexedSearch,
  indexedPage,
} from "../../src/lib/native/repository/indexed-search.ts";
import { historyExpression } from "../../src/lib/repository/history-search-expression.ts";
const status = (complete, generation = 1) => ({
  complete,
  generation,
  indexed: generation,
  omitted: 0,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { resolve, promise };
};

test("history observation never schedules index batches and drains only its own read", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = deferred();
  const calls = [];
  const states = [];
  const controller = new HistoryIndexController(
    {
      start: async () => {
        calls.push("start");
        return status(false);
      },
      status: async () => {
        calls.push("status");
        return pending.promise;
      },
      step: async () => {
        calls.push("step");
        throw Error("Renderer cannot schedule native batches");
      },
      stop: async () => {
        calls.push("stop");
      },
    },
    {
      report(error) {
        throw error;
      },
      recovered() {},
    },
  );
  controller.subscribe((state) => states.push(state));
  controller.start();
  controller.start();
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start"]);
  assert.equal(states.at(-1).busy, true);
  context.mock.timers.tick(1000);
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start", "status"]);
  let closed = false;
  const close = controller.close().then(() => (closed = true));
  await Promise.resolve();
  assert.equal(closed, false);
  pending.resolve(status(true));
  await close;
  context.mock.timers.tick(60_000);
  assert.deepEqual(calls, ["start", "status"]);
  assert.equal(states.at(-1).busy, true, "No stale completion after disposal");
});

test("failed History observations recover from cached status without restarting the owner", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const failures = [];
  let recovered = 0;
  let latest;
  const controller = new HistoryIndexController(
    {
      async start() {
        calls.push("start");
        throw Error("History worker paused");
      },
      async status() {
        calls.push("status");
        return status(true, 2);
      },
    },
    {
      report(error) {
        failures.push(String(error));
      },
      recovered() {
        recovered++;
      },
    },
  );
  controller.subscribe((state) => (latest = state));
  controller.start();
  await new Promise(setImmediate);
  assert.equal(latest.phase, "paused");
  assert.deepEqual(failures, ["Error: History worker paused"]);
  context.mock.timers.tick(1000);
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start", "status"]);
  assert.equal(latest.phase, "ready");
  assert.equal(latest.status.generation, 2);
  assert.equal(recovered, 1);
  await controller.close();
});

test("index query transport is vault-scoped and validates immutable identities", async () => {
  const requests = [];
  const service = nativeIndexedSearch("admitted", async (command, args) => {
    requests.push({ command, args });
    return ["start", "status"].includes(args.request.action.kind)
      ? status(true)
      : { status: status(false), hits: [], next: null, reset: false };
  });
  await service.start();
  await service.status();
  await service.query({
    expression: { type: "term", field: null, value: "old text" },
    case_sensitive: false,
    cursor: null,
    limit: 100,
  });
  assert.equal(requests[0].command, "desktop_backup_history_search");
  assert.deepEqual(
    requests.map((request) => request.args.request.action.kind),
    ["start", "status", "query"],
  );
  assert.equal(requests[2].args.request.sessionId, "admitted");
  assert.equal("root" in requests[1].args.request, false);
  assert.throws(
    () =>
      indexedPage({
        status: status(true),
        hits: [{ record: { revision: { checkpoint: { commit: "invalid" } } } }],
        next: null,
        reset: false,
      }),
    /Invalid/,
  );
});

test("history lowering retains Boolean structure and UTC dates and rejects unsupported predicates", () => {
  const literal = (value) => ({
    type: "literal",
    kind: "word",
    value,
    from: 0,
    to: value.length,
    text: value,
  });
  const field = (name, value) => ({
    type: "field",
    name,
    value: literal(value),
    from: 0,
    to: 10,
    text: "",
  });
  const lowered = historyExpression({
    type: "and",
    clauses: [
      field("after", "2026-10-19"),
      { type: "not", operand: literal("private") },
    ],
  });
  assert.equal(lowered.type, "and");
  assert.equal(
    lowered.clauses[0].value,
    String(Date.parse("2026-10-19T00:00:00Z")),
  );
  assert.equal(lowered.clauses[1].type, "not");
  assert.throws(
    () => historyExpression(field("tag", "secret")),
    /does not support/,
  );
  assert.throws(
    () => historyExpression(field("before", "invalid")),
    /ISO date/,
  );
});
