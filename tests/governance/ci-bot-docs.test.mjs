import assert from "node:assert/strict";
import { test } from "node:test";
import { runDocumentationChecks } from "../../scripts/ci/docs.mjs";

const environment = {
  CI: "true",
  LAPIS_CI_EVENT: "pull_request",
  LAPIS_CI_PR_AUTHOR: "renovate[bot]",
  LAPIS_CI_PR_AUTHOR_TYPE: "Bot",
  LAPIS_DESKTOP_BASE: "base-revision",
  LAPIS_DESKTOP_HEAD: "head-revision",
};
function commands(env) {
  const calls = [];
  runDocumentationChecks({
    env,
    run(command, args) {
      calls.push([command, args]);
    },
  });
  return calls;
}
test("trusted dependency PRs retain formatting and skip each documentation spec phase on a human rerun", () => {
  const calls = commands({ ...environment, GITHUB_ACTOR: "maintainer" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "pnpm");
  assert.ok(calls[0][1].includes("prettier"));
  assert.ok(calls[0][1].includes("--check"));
});
test("human and untrusted bot PRs retain validation, build and the exact spec-first range", () => {
  for (const identity of [
    {
      LAPIS_CI_PR_AUTHOR: "maintainer",
      LAPIS_CI_PR_AUTHOR_TYPE: "User",
      GITHUB_ACTOR: "renovate[bot]",
    },
    { LAPIS_CI_PR_AUTHOR: "untrusted[bot]", LAPIS_CI_PR_AUTHOR_TYPE: "Bot" },
  ]) {
    const calls = commands({ ...environment, ...identity });
    assert.equal(calls.length, 4);
    assert.deepEqual(
      calls.slice(1).map(([, args]) => args[2]),
      ["validate", "build", "first"],
    );
    assert.deepEqual(calls[3][1].slice(3), [
      "--base",
      "base-revision",
      "--head",
      "head-revision",
    ]);
  }
});
test("main pushes retain specification checks regardless of author fields", () => {
  const calls = commands({ ...environment, LAPIS_CI_EVENT: "push" });
  assert.equal(calls.length, 4);
});
