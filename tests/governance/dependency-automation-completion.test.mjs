import { readFile } from "node:fs/promises";
import { metadataOnlyDelegate } from "./completion-delegate.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
const pin = "b66a19937ea8b4bb1b0545396c920797c7832fb4";
const workflow = parse(
  readFileSync(
    new URL(
      "../../.github/workflows/dependency-completed.yml",
      import.meta.url,
    ),
    "utf8",
  ),
);
test("Desktop completion observes only the exact registered source workflows", () => {
  assert.deepEqual(workflow.on, {
    workflow_run: {
      workflows: ["CI", "Publish Storybook to GitHub Pages"],
      types: ["completed"],
    },
  });
  assert.equal(workflow.concurrency, undefined);
  assert.deepEqual(workflow.permissions, {
    contents: "read",
    actions: "read",
    "pull-requests": "read",
  });
  assert.deepEqual(Object.keys(workflow.jobs), ["notify"]);
});
test("scheduled and unsupported original runs skip before the shared verifier or App mint", () => {
  assert.equal(
    workflow.jobs.notify.if,
    'github.event.workflow_run.conclusion == \'success\' && contains(fromJSON(\'["pull_request","push","workflow_dispatch"]\'), github.event.workflow_run.event)',
  );
});
test("Desktop implementation and held metadata-only registration share one reviewed immutable source", () => {
  const job = workflow.jobs.notify;
  assert.equal(
    job.uses,
    "lapismd/dependency-automation/.github/workflows/completion.yml@" + pin,
  );
  assert.deepEqual(job.with, { "automation-ref": pin });
  assert.deepEqual(job.secrets, {
    "app-private-key": "${{ secrets.LAPIS_DEPENDENCY_APP_PRIVATE_KEY }}",
  });
  for (const key of [
    "steps",
    "env",
    "strategy",
    "permissions",
    "continue-on-error",
  ])
    assert.equal(job[key], undefined);
});
test("the source preserves private CalVer releases and every installed audit gate", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  assert.equal(pkg.private, true);
  assert.equal(pkg.scripts["release:version"], undefined);
  assert.equal(pkg.devDependencies["@changesets/cli"], undefined);
  assert.equal(
    pkg.scripts["release:prepare"],
    "node scripts/release/prepare-platform.mjs",
  );
  const ci = parse(
    readFileSync(
      new URL("../../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    ),
  );
  const checkout = ci.jobs.audit.steps.find((s) =>
    s.uses?.startsWith("actions/checkout@"),
  );
  assert.ok(checkout, "original owning audit checkout remains present");
  assert.ok(
    ci.jobs.audit.steps.some((s) =>
      s.run?.includes("node scripts/ci-install.mjs --audit"),
    ),
  );
  assert.equal(ci.jobs.audit.needs.includes("prerequisites"), true);
});

test("only the exact reviewed non-executable completion delegate skips Desktop runtime setup", async () => {
  const source = await readFile(
    new URL(
      "../../.github/workflows/dependency-completed.yml",
      import.meta.url,
    ),
    "utf8",
  );
  assert.equal(metadataOnlyDelegate("dependency-completed.yml", source), true);
  assert.equal(metadataOnlyDelegate("unknown.yml", source), false);
  for (const mutate of [
    (d) =>
      (d.jobs.notify.uses =
        "lapismd/dependency-automation/.github/workflows/completion.yml@main"),
    (d) => (d.jobs.notify.with["automation-ref"] = "a".repeat(40)),
    (d) => (d.jobs.notify.steps = [{ run: "pnpm test" }]),
    (d) => (d.jobs.notify.env = { LAPIS_DESKTOP_VALIDATION_RUNTIME: "native" }),
    (d) =>
      (d.jobs.local = {
        "runs-on": "ubuntu-latest",
        steps: [{ run: "pnpm check" }],
      }),
    (d) => (d.permissions.contents = "write"),
    (d) => (d.jobs.notify.secrets = "inherit"),
  ]) {
    const changed = parse(source);
    mutate(changed);
    assert.throws(() =>
      metadataOnlyDelegate("dependency-completed.yml", JSON.stringify(changed)),
    );
  }
});
