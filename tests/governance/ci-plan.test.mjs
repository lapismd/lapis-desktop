import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const script = resolve("scripts/ci/plan.mjs");

function fixture(context) {
  const directory = mkdtempSync(join(tmpdir(), "desktop-ci-plan-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: directory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const commit = (message) => {
    git("add", ".");
    git(
      "-c",
      "user.name=CI regression",
      "-c",
      "user.email=ci@localhost",
      "commit",
      "--allow-empty",
      "-m",
      message,
    );
    return git("rev-parse", "HEAD");
  };
  git("init", "--initial-branch=main");
  mkdirSync(join(directory, "tests/desktop"), { recursive: true });
  writeFileSync(
    join(directory, "tests/desktop/metadata-owner.test.mjs"),
    "// native regression fixture\n",
  );
  const base = commit("baseline");
  git("mv", "tests/desktop/metadata-owner.test.mjs", "review.md");
  const head = commit("rename native test into documentation");
  const actual = commit(
    "actual synthetic tested checkout differs from PR head",
  );
  const invoke = (
    event,
    {
      sha = actual,
      eventName = "pull_request",
      repository = "lapismd/lapis-desktop",
      ref = "refs/heads/main",
      narrowProfiles = "qualified",
    } = {},
  ) => {
    writeFileSync(join(directory, "event.json"), JSON.stringify(event));
    const output = join(directory, "output.txt"),
      summary = join(directory, "summary.md");
    writeFileSync(output, "");
    writeFileSync(summary, "");
    const process = spawnSync(globalThis.process.execPath, [script], {
      cwd: directory,
      env: {
        ...globalThis.process.env,
        GITHUB_EVENT_PATH: join(directory, "event.json"),
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
        GITHUB_SHA: sha,
        GITHUB_EVENT_NAME: eventName,
        GITHUB_REPOSITORY: repository,
        GITHUB_REF: ref,
        LAPIS_CI_NARROW_PROFILES: narrowProfiles,
      },
      encoding: "utf8",
    });
    return {
      ...process,
      output: readFileSync(output, "utf8"),
      summary: readFileSync(summary, "utf8"),
      plan: () =>
        JSON.parse(
          readFileSync(join(directory, ".local/ci-plan.json"), "utf8"),
        ),
    };
  };
  return { base, head, actual, invoke };
}

test("CI planner binds actual checkout separately from PR head and includes rename source ownership", (context) => {
  const { base, head, actual, invoke } = fixture(context);
  const result = invoke({
    pull_request: { base: { sha: base }, head: { sha: head } },
  });
  assert.equal(result.status, 0, result.stderr);
  const selected = result.plan();
  assert.equal(selected.testedRevision, actual);
  assert.equal(selected.range.head, head);
  assert.deepEqual(selected.nativeFamilies, ["smoke", "workspace"]);
  assert.equal(selected.profile, "ordinary");
  assert.match(result.output, /native_families=\["smoke","workspace"\]/u);
  assert.match(result.output, new RegExp(`tested_revision=${actual}`, "u"));
  assert.match(result.summary, new RegExp(actual, "u"));
});

test("missing history and explicit full dispatch conservatively select complete qualification", (context) => {
  const { actual, invoke } = fixture(context);
  for (const [event, eventName] of [
    [{ before: "0".repeat(40) }, "push"],
    [{ inputs: { full: "true" } }, "workflow_dispatch"],
  ]) {
    const result = invoke(event, { eventName });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.plan().profile, "full");
    assert.equal(result.plan().catalogProfile, "full");
    assert.equal(result.plan().testedRevision, actual);
    assert.deepEqual(result.plan().nativeFamilies, [
      "smoke",
      "workspace",
      "services",
    ]);
  }
});

test("CI planner rejects a mislabeled checkout instead of qualifying another source", (context) => {
  const { base, head, invoke } = fixture(context);
  const result = invoke(
    { pull_request: { base: { sha: base }, head: { sha: head } } },
    { sha: head },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /actual tested checkout must match GITHUB_SHA/u);
  assert.equal(result.output, "");
});

test("nightly always plans complete canonical-main coverage against one actual source and parent", (context) => {
  const { head, actual, invoke } = fixture(context);
  const result = invoke(
    { inputs: { full: "false" } },
    { eventName: "schedule" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.plan().profile, "full");
  assert.equal(result.plan().range.head, actual);
  assert.equal(result.plan().range.base, head);
  for (const change of [
    { repository: "other/lapis-desktop" },
    { ref: "refs/heads/feature" },
  ]) {
    const invalid = invoke({}, { eventName: "schedule", ...change });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /canonical/u);
  }
});

test("ordinary CI narrowing requires the explicit qualified rollout setting", (context) => {
  const { base, head, invoke } = fixture(context);
  for (const narrowProfiles of ["", "true", "unqualified"]) {
    const result = invoke(
      { pull_request: { base: { sha: base }, head: { sha: head } } },
      { narrowProfiles },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.plan().ordinaryProfilesEnabled, false);
    assert.deepEqual(result.plan().nativeFamilies, [
      "smoke",
      "workspace",
      "services",
    ]);
    assert.equal(result.plan().catalogProfile, "full");
  }
});
