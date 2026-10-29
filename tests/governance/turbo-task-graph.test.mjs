import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { resolveTurboConcurrency } from "../../scripts/lib/concurrency.mjs";
import { summarizeTurboCache } from "../../scripts/report-turbo-cache.mjs";

test("Turbo defaults to half the processors capped at four", () => {
  assert.equal(resolveTurboConcurrency({}, 1), "1");
  assert.equal(resolveTurboConcurrency({}, 6), "3");
  assert.equal(resolveTurboConcurrency({}, 32), "4");
});

test("Turbo accepts numeric and percentage overrides", () => {
  assert.equal(resolveTurboConcurrency({ TURBO_CONCURRENCY: "2" }, 32), "2");
  assert.equal(
    resolveTurboConcurrency({ TURBO_CONCURRENCY: "50%" }, 32),
    "50%",
  );
  assert.throws(
    () => resolveTurboConcurrency({ TURBO_CONCURRENCY: "0" }, 4),
    /positive integer/,
  );
});

test("summarizes local and remote cache outcomes", () => {
  assert.deepEqual(
    summarizeTurboCache({
      tasks: [
        { cache: { status: "HIT", source: "REMOTE" } },
        { cache: { status: "HIT", source: "LOCAL" } },
        { cache: { status: "MISS" } },
      ],
    }),
    { attempted: 3, executed: 1, localHits: 1, remoteHits: 1 },
  );
});

test("Cargo and catalog browser tasks stay in separate Turbo invocations", () => {
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  const invocations = scripts.checks.split("&&").map((part) => part.trim());
  const exclusive = [
    "ci:storybook-interaction",
    "ci:quality",
    "ci:unit",
    "ci:bundle",
  ];
  for (const task of exclusive) {
    const owners = invocations.filter((invocation) =>
      invocation.includes(task),
    );
    assert.equal(owners.length, 1, `${task} is invoked once`);
    for (const other of exclusive)
      if (other !== task) assert.ok(!owners[0].includes(other));
  }
  assert.ok(!scripts.checks.includes("ci:headed"));
  assert.ok(!scripts.checks.includes("test:desktop:headed"));
});
