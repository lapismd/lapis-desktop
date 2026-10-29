import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { resolveTurboConcurrency } from "../../scripts/lib/concurrency.mjs";
import { stepsToRun } from "../../scripts/ci-prepare-links.mjs";
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

test("hosted CI projects unpublished packages and restores the tracked lock", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(ci, /node scripts\/ci-prepare-links\.mjs/u);
  assert.match(ci, /node scripts\/ci-install\.mjs/u);
  assert.doesNotMatch(ci, /pnpm install --frozen-lockfile/u);
  const install = readFileSync("scripts/ci-install.mjs", "utf8");
  assert.match(install, /writeFileSync\(pkgPath, originalPkg\)/u);
  assert.match(install, /writeFileSync\(lockPath, originalLock\)/u);
});

test("sibling preparation skips a build the checkout does not define", () => {
  const steps = [
    ["../lapis-notes", "pnpm", ["install", "--frozen-lockfile"]],
    ["../lapis-notes/packages/app-profile", "pnpm", ["build:native-chat"]],
  ];
  assert.deepEqual(
    stepsToRun(steps, () => false),
    [],
  );
  assert.equal(
    stepsToRun(steps, (_cwd, script) => script === "build:native-chat").length,
    2,
  );
});
