import assert from "node:assert/strict";
import { parse } from "yaml";

// A pinned metadata-only reusable job executes no Desktop setup or source lane.
// Unknown names, mutable delegates and any local execution remain ordinary CI.
export function metadataOnlyDelegate(name, source) {
  if (name !== "dependency-completed.yml") return false;
  const workflow = parse(source),
    job = workflow.jobs?.notify;
  assert.deepEqual(Object.keys(workflow).sort(), [
    "jobs",
    "name",
    "on",
    "permissions",
  ]);
  assert.equal(workflow.name, "Notify dependency completion");
  assert.deepEqual(workflow.permissions, {
    contents: "read",
    actions: "read",
    "pull-requests": "read",
  });
  assert.deepEqual(workflow.on, {
    workflow_run: {
      workflows: ["CI", "Publish Storybook to GitHub Pages"],
      types: ["completed"],
    },
  });
  assert.deepEqual(Object.keys(workflow.jobs), ["notify"]);
  assert.deepEqual(Object.keys(job).sort(), ["if", "secrets", "uses", "with"]);
  const pin = "b66a19937ea8b4bb1b0545396c920797c7832fb4";
  assert.equal(
    job.uses,
    "lapismd/dependency-automation/.github/workflows/completion.yml@" + pin,
  );
  assert.deepEqual(job.with, { "automation-ref": pin });
  assert.deepEqual(job.secrets, {
    "app-private-key": "${{ secrets.LAPIS_DEPENDENCY_APP_PRIVATE_KEY }}",
  });
  return true;
}
