import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { parse } from "yaml";
import { ciCatalogArguments } from "../../scripts/ci-catalog.mjs";

const { jobs } = parse(readFileSync(".github/workflows/ci.yml", "utf8"));

test("hosted catalog covers four independent shards at the existing deadline", () => {
  const job = jobs["storybook-interaction-shards"];
  assert.ok(job, "All catalog shards need independent runner lifetimes");
  assert.deepEqual(job.strategy.matrix.shard, [1, 2, 3, 4]);
  assert.equal(job.strategy["fail-fast"], false);
  assert.equal(job["timeout-minutes"], 90);
  assert.equal(job.env.LAPIS_DESKTOP_CATALOG_SHARD, "${{ matrix.shard }}");
  assert.ok(
    job.steps.some((step) => step.run?.includes("ci:storybook-interaction")),
  );
});

test("CI passes every selected shard through the public lane and includes it in cache identity", () => {
  assert.deepEqual(ciCatalogArguments({}), ["test:storybook"]);
  for (const shard of ["1", "2", "3", "4"])
    assert.deepEqual(
      ciCatalogArguments({ LAPIS_DESKTOP_CATALOG_SHARD: shard }),
      ["test:storybook", "--", `--shard=${shard}/4`],
    );
  const turbo = JSON.parse(readFileSync("turbo.json", "utf8"));
  assert.ok(
    turbo.tasks["ci:storybook-interaction"].env.includes(
      "LAPIS_DESKTOP_CATALOG_SHARD",
    ),
  );
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    pkg.scripts["ci:storybook-interaction"],
    "node scripts/ci-catalog.mjs",
  );
});

test("invalid CI shard input refuses before starting a partial catalog", () => {
  for (const shard of ["", "0", "5", "2/4", "all", "1; unexpected"])
    assert.throws(
      () => ciCatalogArguments({ LAPIS_DESKTOP_CATALOG_SHARD: shard }),
      /four shards/,
    );
});

test("the existing catalog merge check requires every shard and rejects partial results", () => {
  const job = jobs["storybook-interaction"];
  assert.equal(job.name, "Storybook interactions");
  assert.equal(job.if, "always()");
  assert.deepEqual(job.needs, ["storybook-interaction-shards"]);
  const step = job.steps.find(
    (candidate) => candidate.name === "Require every catalog shard",
  );
  assert.equal(
    step.env.SHARDS,
    "${{ needs.storybook-interaction-shards.result }}",
  );
  for (const result of ["success", "failure", "cancelled", "skipped", ""]) {
    const child = spawnSync("bash", ["-euc", step.run], {
      env: { ...process.env, SHARDS: result },
    });
    assert.equal(child.status === 0, result === "success", result);
  }
  for (const name of ["audit", "validate"])
    assert.ok(jobs[name].needs.includes("storybook-interaction"));
});
