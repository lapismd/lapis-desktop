import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
const read = (file) =>
  readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
const workflow = parse(read(".github/workflows/release-desktop.yml"));
test("preview publication stays manual, disabled by default and protected after candidate qualification", () => {
  assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
  assert.equal(workflow.on.workflow_dispatch.inputs.publish.default, false);
  assert.equal(workflow.jobs.publish.environment, "desktop-preview-release");
  assert.equal(workflow.jobs.publish.permissions.contents, "write");
  assert.equal(workflow.permissions.contents, "read");
  assert.ok(workflow.jobs.publish.if.includes("inputs.publish == true"));
  const publishing = JSON.stringify(workflow.jobs.publish);
  assert.ok(publishing.includes("download-artifact"));
  assert.ok(publishing.includes("publish.mjs"));
  assert.doesNotMatch(publishing, /tauri.*build|release:prepare|ci-install/);
  assert.ok(workflow.jobs.publish.steps.some((step) => step.with?.["run-id"]));
});
test("release packaging requires real Homebrew installation and releases no acceptance binary", () => {
  const steps = workflow.jobs.candidate.steps;
  const build = steps.findIndex((step) => step.run === "pnpm release:prepare");
  const install = steps.findIndex((step) =>
    step.run?.includes("test-preview-install.mjs"),
  );
  const seal = steps.findIndex(
    (step) => step.run === "pnpm release:verify --seal",
  );
  const upload = steps.findIndex((step) =>
    step.uses?.startsWith("actions/upload-artifact"),
  );
  assert.ok(build >= 0 && install > build && seal > install && upload > seal);
  const previous = steps.find(
    (step) => step.with?.path === ".local/release/previous",
  );
  assert.equal(
    previous.with.ref,
    "main",
    "Later candidates must qualify upgrades from current tap state",
  );
  const source = read("scripts/release/build.mjs");
  assert.match(source, /"--release"/);
  assert.match(source, /"--no-sign"/);
  assert.doesNotMatch(
    source,
    /"--debug"|"--features"|local-macos-build|native-test/,
  );
});
test("tap automation uses a restricted installation token and recovery has no publication step", () => {
  for (const name of ["tap-update", "recover-tap"]) {
    const job = workflow.jobs[name];
    const app = job.steps.find((step) =>
      step.uses?.startsWith("actions/create-github-app-token"),
    );
    assert.equal(app.with.repositories, "homebrew-tap");
    assert.equal(app.with["permission-contents"], "write");
    assert.equal(app.with["permission-pull-requests"], "write");
    assert.match(JSON.stringify(job), /--channel preview/);
    assert.doesNotMatch(
      JSON.stringify(job),
      /release\/publish\.mjs|release:prepare/,
    );
  }
});
