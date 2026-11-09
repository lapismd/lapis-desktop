import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  nativeInventory,
  nativeFamilies,
  nativeStages,
  nativeFamiliesForFile,
  parseAcceptanceArgs,
  validateNativeInventory,
  validateNativeReports,
} from "../../scripts/native-families.mjs";
import { recover as recoverPluginDataMirror } from "../desktop/plugin-data-recovery.mjs";

// Original headed scope is a review boundary, not an expected execution count.
const original = JSON.parse(
  readFileSync("tests/governance/fixtures/native-headed-files.json", "utf8"),
);

test("each original native file has exactly one independent family and execution mode", () => {
  assert.deepEqual(
    nativeInventory.files.map(({ file }) => file.split("/").at(-1)).sort(),
    original.sort(),
  );
  for (const entry of nativeInventory.files)
    assert.ok(existsSync(entry.file), entry.file);
  assert.throws(
    () =>
      validateNativeInventory({
        ...nativeInventory,
        files: [...nativeInventory.files, nativeInventory.files[0]],
      }),
    /duplicate/,
  );
  for (const entry of nativeInventory.files.filter(
    ({ mode }) => mode === "wdio",
  ))
    assert.doesNotMatch(
      readFileSync(entry.file, "utf8"),
      /\b(?:it|describe)\.skip\(/u,
      "WDIO pending-case reporting must be added before introducing skips",
    );
});

test("smoke owns its own geometry producer and real cold edit/save/reopen boundary", () => {
  const stages = nativeStages("smoke");
  assert.deepEqual(
    stages.map(({ id }) => id),
    ["startup", "wdio", "feature"],
  );
  const files = stages.flatMap(({ files }) => files);
  assert.ok(files.includes("tests/desktop/lifecycle.test.mjs"));
  assert.ok(files.includes("tests/desktop/notes-lifecycle.test.mjs"));
  assert.ok(files.includes("tests/desktop/shell.spec.mjs"));
  const services = nativeStages("services");
  assert.equal(services.at(-1).id, "resource");
  assert.deepEqual(services.at(-1).files, [
    "tests/desktop/file-http-representation.test.mjs",
  ]);
});

test("mapped native tests include smoke; unknown production or harness ownership stays broad", () => {
  assert.deepEqual(
    nativeFamiliesForFile("tests/desktop/acp-transport.test.mjs"),
    ["smoke", "services"],
  );
  assert.deepEqual(
    nativeFamiliesForFile("tests/desktop/file-creation.test.mjs"),
    ["smoke", "workspace"],
  );
  assert.deepEqual(
    nativeFamiliesForFile("src-tauri/src/host/windows/mod.rs"),
    nativeFamilies,
  );
  assert.deepEqual(
    nativeFamiliesForFile("tests/desktop/new-unmapped.test.mjs"),
    nativeFamilies,
  );
});

test("native conflict recovery proves every writer and focused input boundary", () => {
  const graph = readFileSync("tests/desktop/navigation-graph.test.mjs", "utf8");
  assert.match(graph, /mirror\.wait\(browser, directory, pluginId\)/);
  assert.match(graph, /mirror\.recover\(browser, compatibility, pluginId/);

  const mirror = readFileSync("tests/desktop/plugin-data-recovery.mjs", "utf8");
  assert.match(mirror, /openConflictReview\(browser, resource\)/);
  assert.match(mirror, /matches\(path, expected\)/);
  assert.match(mirror, /conflictProblemResource\(resource\)/);
  assert.match(mirror, /isExisting\(\)/);
  assert.match(mirror, /mirror must match recovered canonical data/);

  const preview = readFileSync(
    "tests/desktop/preview-conflicts.test.mjs",
    "utf8",
  );
  assert.match(preview, /document\.activeElement === element/);
  assert.match(preview, /Preview editor must own native input focus/);
});

test("an already synchronized plugin mirror needs no manufactured review", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "lapis-plugin-mirror-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "lapis-graph.json");
  const expected = { filters: { showTags: false } };
  writeFileSync(path, JSON.stringify(expected));
  const waits = [];
  const browser = {
    async waitUntil(condition, options) {
      assert.equal(await condition(), true);
      waits.push(options.timeoutMsg);
    },
    $() {
      return {
        async waitForExist(options) {
          assert.deepEqual(options, { reverse: true });
        },
      };
    },
  };
  await recoverPluginDataMirror(browser, path, "lapis-graph", expected);
  assert.deepEqual(waits, [
    "Plugin data mirror must synchronize or expose its exact conflict",
    "Plugin data mirror must match recovered canonical data",
  ]);
});

test("execution requires a verified artifact and selectors reject unknown or ambiguous work", () => {
  assert.equal(parseAcceptanceArgs([]).operation, "all");
  assert.equal(parseAcceptanceArgs(["--operation", "prepare"]).family, "all");
  assert.deepEqual(
    parseAcceptanceArgs([
      "--operation=execute",
      "--family=services",
      "--reuse-artifact=artifact",
    ]),
    { operation: "execute", family: "services", reuseArtifact: "artifact" },
  );
  for (const args of [
    ["--family=nope"],
    ["--operation=execute"],
    ["--family"],
    ["--operation=prepare", "--family=smoke"],
    ["--family=smoke", "--family=services"],
    ["--oops"],
  ])
    assert.throws(() => parseAcceptanceArgs(args));
});

function reports() {
  return nativeFamilies.map((family) => ({
    schema: 1,
    family,
    status: "passed",
    sourceRevision: "a".repeat(40),
    profile: "full",
    runId: "100",
    runAttempt: "1",
    artifactId: "b".repeat(64),
    stages: nativeStages(family).map((stage) => ({
      ...stage,
      status: "passed",
      counts: { tests: 2, passed: 1, failed: 0, cancelled: 0, skipped: 1 },
    })),
  }));
}

test("full aggregation rejects missing, failed, cancelled, empty, duplicate and incomplete native work", () => {
  assert.equal(
    validateNativeReports(nativeFamilies, reports()).status,
    "passed",
  );
  assert.throws(() => validateNativeReports([], []), /nonempty/);
  assert.throws(() => validateNativeReports(["all"], []), /Unknown/);
  assert.throws(
    () => validateNativeReports(nativeFamilies, reports().slice(1)),
    /Missing/,
  );
  const mutations = [
    (r) => {
      r[1].status = "cancelled";
    },
    (r) => {
      r[1].family = r[0].family;
    },
    (r) => {
      r[1].stages.pop();
    },
    (r) => {
      r[1].stages[0].files.pop();
    },
    (r) => {
      r[1].stages[0].status = "not-executed";
    },
    (r) => {
      r[1].stages[0].counts.passed = 0;
    },
    (r) => {
      r[1].stages[0].counts.failed = 1;
    },
    (r) => {
      r[1].stages[0].counts.cancelled = 1;
    },
    (r) => {
      delete r[1].stages[0].counts.tests;
    },
    (r) => {
      r[1].stages[0].counts.tests = 0;
    },
    (r) => {
      r[1].runAttempt = "2";
    },
    (r) => {
      r[1].artifactId = "other";
    },
    (r) => {
      r[1].sourceRevision = "c".repeat(40);
    },
    (r) => {
      r[1].profile = "fast";
    },
  ];
  for (const mutate of mutations) {
    const selected = reports();
    mutate(selected);
    assert.throws(() => validateNativeReports(nativeFamilies, selected));
  }
  assert.throws(
    () =>
      validateNativeReports(nativeFamilies, reports(), {
        sourceRevision: "d".repeat(40),
      }),
    /mismatch/,
  );
});

test("native Node reporting retains real failed and skipped cases and underlying exit status", () => {
  const directory = mkdtempSync(join(tmpdir(), "lapis-native-report-"));
  try {
    const fixture = join(directory, "example.test.mjs"),
      result = join(directory, "result.json");
    writeFileSync(
      fixture,
      'import {test} from "node:test"; test("pass",()=>{}); test("skip",{skip:true},()=>{}); test("fail",()=>{throw Error("original failure")});',
    );
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    const child = spawnSync(
      process.execPath,
      [
        "--test",
        "--test-reporter=./scripts/native-count-reporter.mjs",
        `--test-reporter-destination=${result}`,
        fixture,
      ],
      { encoding: "utf8", env: environment },
    );
    assert.equal(child.status, 1, child.stderr);
    const counts = JSON.parse(readFileSync(result));
    assert.deepEqual(
      { ...counts, durationMs: undefined },
      {
        tests: 3,
        passed: 1,
        failed: 1,
        cancelled: 0,
        skipped: 1,
        todo: 0,
        durationMs: undefined,
      },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a failed feature stage retains its first failure while HTTP/resource checks still execute", async () => {
  const { executeNativeFamily } = await import(
    "../../scripts/desktop-acceptance.mjs"
  );
  const directory = mkdtempSync(join(tmpdir(), "lapis-native-independent-"));
  const called = [];
  try {
    await assert.rejects(
      executeNativeFamily(
        "services",
        {
          artifactId: "artifact",
          identity: {
            sourceCommit: "a".repeat(40),
            sourceTree: "b".repeat(40),
          },
        },
        async (_command, args) => {
          const feature = args.includes("--import");
          called.push(feature ? "feature" : "resource");
          const output = args
            .filter((arg) => arg.startsWith("--test-reporter-destination="))
            .at(-1)
            .split("=")
            .slice(1)
            .join("=");
          writeFileSync(
            output,
            JSON.stringify({
              tests: 1,
              passed: feature ? 0 : 1,
              failed: feature ? 1 : 0,
              cancelled: 0,
              skipped: 0,
            }),
          );
          if (feature) throw Error("Original feature failure");
        },
        () => ({ directory, environment: {} }),
      ),
      /services acceptance failed/,
    );
    assert.deepEqual(called, ["feature", "resource"]);
    const report = JSON.parse(
      readFileSync(join(directory, "native-family-services.json")),
    );
    assert.equal(report.status, "failed");
    assert.equal(report.stages[0].error, "Original feature failure");
    assert.equal(report.stages[0].counts.failed, 1);
    assert.equal(report.stages[1].status, "passed");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("cancelling a family retains incomplete coverage and does not start another stage", async () => {
  const { executeNativeFamily } = await import(
    "../../scripts/desktop-acceptance.mjs"
  );
  const directory = mkdtempSync(join(tmpdir(), "lapis-native-cancel-"));
  let called = 0;
  try {
    await assert.rejects(
      executeNativeFamily(
        "services",
        {
          artifactId: "artifact",
          identity: { sourceCommit: "a".repeat(40) },
        },
        async () => {
          called++;
          const error = Error("Cancelled original attempt");
          error.cancelled = true;
          throw error;
        },
        () => ({ directory, environment: {} }),
      ),
      (error) => error.cancelled === true,
    );
    assert.equal(called, 1);
    const report = JSON.parse(
      readFileSync(join(directory, "native-family-services.json")),
    );
    assert.equal(report.status, "cancelled");
    assert.deepEqual(
      report.stages.map(({ status }) => status),
      ["cancelled", "not-executed"],
    );
    assert.throws(() => validateNativeReports(["services"], [report]));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
