import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  catalogFiles,
  catalogOptions,
  displayReviewFiles,
  displayVariants,
  storyFiles,
} from "../../scripts/catalog-profile.mjs";
import { ciCatalogArguments } from "../../scripts/ci-catalog.mjs";

test("full retains every story/variant exactly once; ordinary retains broad primary plus reviewed displays", () => {
  const files = storyFiles();
  const inventory = new Set();
  for (const { viewport, theme } of displayVariants) {
    assert.deepEqual(catalogFiles("full", viewport, theme, files), files);
    for (const file of catalogFiles("full", viewport, theme, files)) {
      const key = `${file}:${viewport}:${theme}`;
      assert.ok(!inventory.has(key));
      inventory.add(key);
    }
    const ordinary = catalogFiles("ordinary", viewport, theme, files);
    assert.deepEqual(
      ordinary,
      viewport === "desktop" && theme === "light"
        ? files
        : [...displayReviewFiles].sort(),
    );
    assert.equal(new Set(ordinary).size, ordinary.length);
  }
  assert.equal(inventory.size, files.length * 4);
  assert.throws(
    () => catalogFiles("ordinary", "narrow", "light", []),
    /Stale catalog display mapping/,
  );
});

test("profiles default to full, reject invalid input, and survive CI lane dispatch and cache hashing", async () => {
  assert.equal(catalogOptions([], {}).profile, "full");
  assert.deepEqual(catalogOptions(["--profile=ordinary", "--shard=2/4"], {}), {
    profile: "ordinary",
    args: ["--shard=2/4"],
  });
  for (const profile of ["", "fast", "ordinary;true"])
    assert.throws(() => catalogOptions([`--profile=${profile}`], {}));
  assert.throws(() =>
    catalogOptions(["--profile=full", "--profile=ordinary"], {}),
  );
  assert.deepEqual(
    ciCatalogArguments({
      LAPIS_DESKTOP_CATALOG_PROFILE: "ordinary",
      LAPIS_DESKTOP_CATALOG_SHARD: "2",
    }),
    ["test:storybook", "--", "--shard=2/4", "--profile=ordinary"],
  );
  const turbo = JSON.parse(await readFile("turbo.json", "utf8"));
  const task = turbo.tasks["ci:storybook-interaction"];
  assert.ok(task.env.includes("LAPIS_DESKTOP_CATALOG_PROFILE"));
  assert.ok(task.env.includes("LAPIS_DESKTOP_CATALOG_SHARD"));
  assert.ok(task.outputs.includes(".local/catalog-reports/**"));
});

async function runCatalog(context, extraEnvironment = {}) {
  const directory = await mkdtemp(join(tmpdir(), "desktop-catalog-profile-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  for (const file of [
    ...displayReviewFiles,
    "catalog/primary-only.stories.ts",
  ]) {
    await mkdir(resolve(directory, file, ".."), { recursive: true });
    await writeFile(join(directory, file), "");
  }
  const bin = join(directory, "bin");
  await mkdir(bin);
  await writeFile(
    join(bin, "pnpm"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const variant = process.env.LAPIS_CATALOG_VIEWPORT + "/" + process.env.LAPIS_CATALOG_THEME;
const failed = variant === process.env.PROBE_FAIL;
const zero = process.env.PROBE_ZERO === "1";
fs.appendFileSync("calls.jsonl", JSON.stringify({variant, args:process.argv.slice(2)}) + "\\n");
if (process.env.PROBE_SIGNAL === "1") process.kill(process.pid, "SIGTERM");
fs.writeFileSync(process.env.LAPIS_CATALOG_REPORT, JSON.stringify({
  success: !failed, numPassedTests: zero || failed ? 0 : 1,
  numFailedTests: zero || !failed ? 0 : 1, numPendingTests: 2,
  testResults: [{name:"catalog/probe.stories.ts", status: failed ? "failed" : "passed", startTime: 10, endTime: 25}]
}));
process.exitCode = failed ? 1 : 0;
`,
    { mode: 0o755 },
  );
  const result = spawnSync(
    process.execPath,
    [
      resolve("scripts/catalog-tests.mjs"),
      "--profile=ordinary",
      "--shard=1/4",
      "--reporter=junit",
      "--outputFile=reports/test.xml",
    ],
    {
      cwd: directory,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        ...extraEnvironment,
      },
      encoding: "utf8",
    },
  );
  const reports = join(directory, ".local/catalog-reports/ordinary/1-4");
  const attempts = await readdir(reports);
  assert.equal(attempts.length, 1);
  const summary = JSON.parse(
    await readFile(join(reports, attempts[0], "summary.json"), "utf8"),
  );
  const calls = (await readFile(join(directory, "calls.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);
  return { result, summary, calls };
}

test("each variant emits fresh outcomes and file timing with its literal shard", async (context) => {
  const { result, summary, calls } = await runCatalog(context);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(summary.profile, "ordinary");
  assert.equal(summary.shard, "1/4");
  assert.equal(summary.variants.length, 4);
  for (const [index, variant] of summary.variants.entries()) {
    assert.equal(variant.status, "passed");
    assert.equal(variant.executed, 1);
    assert.equal(variant.skipped, 2);
    assert.equal(variant.notSelectedFiles, index === 0 ? 0 : 1);
    assert.equal(variant.files[0].durationMs, 15);
    assert.ok(calls[index].args.includes("--shard=1/4"));
    assert.ok(!calls[index].args.includes("--profile=ordinary"));
    assert.ok(calls[index].args.includes("--reporter=junit"));
    assert.ok(
      calls[index].args.includes("--reporter=./scripts/catalog-reporter.mjs"),
    );
    assert.ok(
      calls[index].args.includes(
        `--outputFile=reports/test-${variant.viewport}-${variant.theme}.xml`,
      ),
    );
  }
});

test("a failed or empty variant cannot report green and later variants remain not executed", async (context) => {
  for (const environment of [
    { PROBE_FAIL: "narrow/light" },
    { PROBE_ZERO: "1" },
  ]) {
    const { result, summary } = await runCatalog(context, environment);
    assert.equal(result.status, 1);
    assert.ok(summary.variants.some((variant) => variant.status === "failed"));
    assert.equal(summary.variants.at(-1).status, "not-executed");
  }
});

test("signal termination retains a cancelled outcome and cannot pass", async (context) => {
  const { result, summary } = await runCatalog(context, { PROBE_SIGNAL: "1" });
  assert.equal(result.status, 1);
  assert.equal(summary.variants[0].status, "cancelled");
  assert.equal(summary.variants[0].signal, "SIGTERM");
  assert.equal(summary.variants[0].executed, 0);
  assert.equal(summary.variants.at(-1).status, "not-executed");
});
