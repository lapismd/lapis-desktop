import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  nativeQuarantines,
  selectQuarantines,
  quarantine,
  quarantineVariable,
  quarantineNamePattern,
  quarantineResults,
} from "../desktop/native-quarantine.mjs";
import {
  quarantineArguments,
  quarantineCommand,
} from "../../scripts/native-quarantine.mjs";

const entry = nativeQuarantines[0];

test("quarantines retain default skip and only allowlisted explicit selections execute", () => {
  assert.equal(quarantine(entry.id, true, {}).skip, entry.reason);
  assert.equal(quarantine(entry.id, false, {}).skip, false);
  const environment = { [quarantineVariable]: JSON.stringify([entry.id]) };
  assert.equal(quarantine(entry.id, true, environment).skip, false);
  assert.equal(
    quarantine(nativeQuarantines[1].id, true, environment).skip,
    nativeQuarantines[1].reason,
  );
  for (const ids of [[], ["unknown"], [entry.id, entry.id], "all"])
    assert.throws(() => selectQuarantines(ids));
  assert.throws(() =>
    quarantine(entry.id, true, { [quarantineVariable]: "[]" }),
  );
  assert.throws(() =>
    quarantine(entry.id, true, { [quarantineVariable]: "all" }),
  );
});

test("selectors target complete original titles and reject broad or empty execution", () => {
  const selected = selectQuarantines([entry.id]);
  assert.deepEqual(
    quarantineArguments([`--cases=${entry.id}`]).selected,
    selected,
  );
  for (const args of [
    [],
    ["--cases="],
    ["--cases=all"],
    [`--cases=${entry.id}`, "--all"],
    [
      `--cases=${nativeQuarantines
        .slice(0, 6)
        .map((entry) => entry.id)
        .join(",")}`,
    ],
  ])
    assert.throws(() => quarantineArguments(args));
  const pattern = new RegExp(quarantineNamePattern(selected));
  assert.ok(pattern.test(entry.title));
  assert.equal(pattern.test(`${entry.title} unrelated`), false);
  const command = quarantineCommand(selected);
  assert.ok(command.includes(entry.file));
  assert.ok(command.includes("--test-concurrency=1"));
});

test("zero, skipped, failed or duplicated intended cases never establish diagnostic success", () => {
  const selected = [entry];
  const event = (type, data = {}) => ({
    type,
    data: { name: entry.title, ...data },
  });
  assert.equal(quarantineResults(selected, []).ok, false);
  assert.equal(
    quarantineResults(selected, [event("test:pass", { skip: "quarantine" })])
      .ok,
    false,
  );
  assert.equal(quarantineResults(selected, [event("test:fail")]).ok, false);
  assert.equal(
    quarantineResults(selected, [event("test:pass"), event("test:pass")]).ok,
    false,
  );
  const success = quarantineResults(selected, [event("test:pass")]);
  assert.equal(success.ok, true);
  assert.equal(success.qualification, false);
  assert.equal(success.executed, 1);
  assert.ok(success.cases.some((entry) => entry.status === "not-selected"));
});

test("every registered case retains executable skip metadata and complete failure ownership", () => {
  assert.equal(
    new Set(nativeQuarantines.map((entry) => entry.id)).size,
    nativeQuarantines.length,
  );
  assert.equal(
    new Set(nativeQuarantines.map((entry) => entry.title)).size,
    nativeQuarantines.length,
  );
  for (const entry of nativeQuarantines) {
    const source = readFileSync(entry.file, "utf8");
    assert.ok(source.includes(`quarantine("${entry.id}"`), entry.id);
    for (const field of [
      "platform",
      "mechanism",
      "owner",
      "firstFailure",
      "latestFailure",
      "nextReview",
      "nextDiagnostic",
      "reenableWhen",
    ])
      assert.ok(entry[field]?.length > 0, `${entry.id}: ${field}`);
    assert.ok(readFileSync(entry.firstFailure, "utf8").length > 0);
  }
});

test("real Node reporter preserves a failing original body and rejects a skipped-only run", () => {
  const directory = mkdtempSync(join(tmpdir(), "native-quarantine-"));
  try {
    const fixture = join(directory, "original.test.mjs");
    const report = join(directory, "report.json");
    writeFileSync(
      fixture,
      `import test from 'node:test';\ntest(${JSON.stringify(entry.title)}, () => {throw Error('deliberate original failure')});\n`,
    );
    const childEnvironment = { ...process.env };
    delete childEnvironment.NODE_TEST_CONTEXT;
    const run = (pattern) =>
      spawnSync(
        process.execPath,
        [
          "--test",
          `--test-reporter=${resolve("scripts/native-quarantine-reporter.mjs")}`,
          `--test-name-pattern=${pattern}`,
          fixture,
        ],
        {
          encoding: "utf8",
          env: {
            ...childEnvironment,
            [quarantineVariable]: JSON.stringify([entry.id]),
            LAPIS_DESKTOP_QUARANTINE_REPORT: report,
          },
        },
      );
    const failed = run(quarantineNamePattern([entry]));
    assert.notEqual(failed.status, 0);
    assert.match(failed.stdout, /FAIL/);
    let result = JSON.parse(readFileSync(report, "utf8"));
    assert.equal(result.failed, 1);
    assert.equal(result.ok, false);
    run("^no such case$");
    result = JSON.parse(readFileSync(report, "utf8"));
    assert.equal(result.executed, 0);
    assert.equal(result.ok, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
