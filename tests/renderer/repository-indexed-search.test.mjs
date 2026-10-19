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

test("history indexing coalesces captures and drains native work before closing", async () => {
  const pending = deferred();
  let calls = 0;
  const controller = new HistoryIndexController(
    {
      step: async () => {
        calls++;
        return pending.promise;
      },
    },
    {
      report(error) {
        throw error;
      },
      recovered() {},
    },
  );
  controller.schedule();
  controller.schedule();
  controller.schedule();
  assert.equal(calls, 1);
  let closed = false;
  const close = controller.close().then(() => (closed = true));
  await Promise.resolve();
  assert.equal(closed, false);
  pending.resolve(status(true));
  await close;
  assert.equal(calls, 1);
});

test("index query transport is vault-scoped and validates immutable identities", async () => {
  const requests = [];
  const service = nativeIndexedSearch("admitted", async (command, args) => {
    requests.push({ command, args });
    return args.request.action.kind === "step"
      ? status(true)
      : { status: status(false), hits: [], next: null, reset: false };
  });
  await service.step();
  await service.query({
    expression: { type: "term", field: null, value: "old text" },
    case_sensitive: false,
    cursor: null,
    limit: 100,
  });
  assert.equal(requests[0].command, "desktop_backup_history_search");
  assert.equal(requests[1].args.request.sessionId, "admitted");
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
