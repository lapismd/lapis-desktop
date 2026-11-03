import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

/** Same-run fanout only. Cross-run artifact reuse needs a separate reviewed policy. */
export function artifactProvenance(
  root = process.cwd(),
  environment = process.env,
) {
  if (environment.GITHUB_ACTIONS !== "true" && !environment.GITHUB_RUN_ID)
    return null;
  for (const name of [
    "GITHUB_REPOSITORY",
    "GITHUB_WORKFLOW_REF",
    "GITHUB_SHA",
    "GITHUB_RUN_ID",
    "GITHUB_RUN_ATTEMPT",
  ])
    assert.ok(environment[name], `Missing artifact producer context: ${name}`);
  assert.match(environment.GITHUB_RUN_ID, /^\d+$/);
  assert.match(environment.GITHUB_RUN_ATTEMPT, /^[1-9]\d*$/);
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  return {
    repository: environment.GITHUB_REPOSITORY,
    workflow: environment.GITHUB_WORKFLOW_REF,
    sourceCommit,
    eventCommit: environment.GITHUB_SHA,
    runId: environment.GITHUB_RUN_ID,
    attempt: environment.GITHUB_RUN_ATTEMPT,
  };
}
export function verifyArtifactProvenance(
  provenance,
  root = process.cwd(),
  environment = process.env,
) {
  assert.deepEqual(
    provenance,
    artifactProvenance(root, environment),
    "Artifact producer provenance does not match the current repository/workflow/source/run/attempt",
  );
}
