import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { listWindows } from "../../scripts/release/window-observation.mjs";
const read = (file) =>
  readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
const workflow = parse(read(".github/workflows/release-desktop.yml"));
test("trial builds stay manual, untested and outside preview publication", () => {
  const trial = parse(read(".github/workflows/trial-desktop.yml"));
  assert.equal(trial.name, "Desktop trial build");
  assert.deepEqual(Object.keys(trial.on), ["workflow_dispatch"]);
  assert.equal(trial.env.LAPIS_DESKTOP_TRIAL, "1");
  assert.equal(trial.jobs.build.strategy.matrix.include.length, 3);
  assert.deepEqual(trial.jobs.publish.needs, "build");
  assert.equal(trial.jobs.publish.permissions.contents, "write");
  assert.equal(trial.permissions.contents, "read");
  const source = read(".github/workflows/trial-desktop.yml");
  assert.match(source, /desktop-trial-\$\{GITHUB_SHA\}/);
  assert.match(source, /--target "\$GITHUB_SHA"/);
  assert.match(source, /--repo "\$GH_REPO"/);
  assert.ok(
    trial.jobs.publish.steps.some((step) =>
      step.uses?.startsWith("actions/checkout@"),
    ),
  );
  assert.match(source, /--prerelease/);
  assert.doesNotMatch(
    source,
    /gate\.mjs|test-preview-install|desktop-preview-release|node --test/,
  );
  assert.doesNotMatch(
    read(".github/workflows/release-desktop.yml"),
    /LAPIS_DESKTOP_TRIAL/,
  );
});
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
  assert.equal(
    workflow.jobs.publish.steps.find((step) =>
      step.run?.includes("publish.mjs"),
    ).env.CANDIDATE_SOURCE_COMMIT,
    "${{ needs.select-candidate.outputs.source || github.sha }}",
  );
});
test("release packaging requires real Homebrew installation and releases no acceptance binary", () => {
  assert.equal(workflow.jobs.build.strategy.matrix.include.length, 3);
  assert.deepEqual(workflow.jobs.assemble.needs, "build");
  assert.deepEqual(workflow.jobs.install.needs, "assemble");
  assert.deepEqual(workflow.jobs.candidate.needs, "install");
  assert.equal(workflow.jobs.install.strategy.matrix.include.length, 2);
  assert.ok(
    workflow.jobs.install.strategy.matrix.include.every(
      ({ os, target }) => os.startsWith("ubuntu-") && target.includes("linux"),
    ),
  );
  assert.ok(
    workflow.jobs.build.strategy.matrix.include.some(
      ({ os, target }) =>
        os === "macos-15" && target === "aarch64-apple-darwin",
    ),
  );
  const steps = workflow.jobs.install.steps;
  assert.ok(
    steps.some((step) =>
      step.uses?.startsWith("Homebrew/actions/setup-homebrew@"),
    ),
  );
  const install = steps.find((step) =>
    step.run?.includes("test-preview-install.mjs"),
  );
  assert.ok(install.run.includes("xvfb-run"));
  const previous = steps.find(
    (step) => step.with?.path === ".local/release/previous",
  );
  assert.equal(
    previous.with.ref,
    "main",
    "Qualify upgrades from current tap state",
  );
  const final = workflow.jobs.candidate.steps;
  assert.ok(
    final.findIndex((s) => s.run?.includes("verify-candidate.mjs --seal")) <
      final.findIndex((s) => s.uses?.startsWith("actions/upload-artifact")),
  );
  const source = read("scripts/release/build.mjs");
  assert.match(read("scripts/release/build-common.mjs"), /"--release"/);
  assert.match(read("scripts/release/build-linux.mjs"), /"--no-bundle"/);
  assert.match(source, /"--no-sign"/);
  assert.match(source, /"--force", "--deep", "--sign", "-"/);
  assert.match(source, /\["-cr", app\]/);
  assert.doesNotMatch(
    source,
    /"--debug"|"--features"|local-macos-build|native-test/,
  );
});
test("Linux window observation retries before the EWMH client list exists", () => {
  const unavailable = Object.assign(Error("client list unavailable"), {
    status: 1,
  });
  assert.deepEqual(
    listWindows(() => {
      throw unavailable;
    }),
    [],
  );
  assert.deepEqual(
    listWindows(() => "0x01 0 123 0 0 800 600 host Lapis Notes Preview\n"),
    ["0x01 0 123 0 0 800 600 host Lapis Notes Preview"],
  );
});
test("Linux window observation preserves non-transient tool failures", () => {
  const missing = Object.assign(Error("wmctrl missing"), { code: "ENOENT" });
  assert.throws(
    () =>
      listWindows(() => {
        throw missing;
      }),
    missing,
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
