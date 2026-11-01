import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readIdentity,
  hostedMain,
  createManifest,
  validateManifest,
  compareCalendar,
  versionPattern,
} from "../../scripts/release/contract.mjs";
import { fullCIJobs } from "../../scripts/release/source-ci.mjs";
import { verifySource } from "../../scripts/release/gate.mjs";
import { selectCandidate } from "../../scripts/release/select-candidate.mjs";
const source = "a".repeat(40),
  identity = {
    version: "2026.31.6-rc.1",
    tag: "desktop-v2026.31.6-rc.1",
    sourceCommit: source,
  };
const ci = {
  id: 9,
  event: "push",
  head_sha: source,
  head_branch: "main",
  conclusion: "success",
  status: "completed",
  run_attempt: 1,
  html_url: "https://github.com/lapismd/lapis-desktop/actions/runs/9",
};
const legacy = [
  { tag_name: "desktop-v2026.31.5", draft: false, prerelease: false },
];
function sourceServer({
  runs = [ci],
  releases = legacy,
  existing = null,
} = {}) {
  return async (path) =>
    path.includes("/actions/runs/9/jobs")
      ? {
          jobs: fullCIJobs.map((name, id) => ({
            id: id + 1,
            name,
            status: "completed",
            conclusion: "success",
          })),
        }
      : path.includes("ci.yml/runs")
        ? { workflow_runs: runs }
        : path.includes("lapis-notes/releases")
          ? releases
          : existing;
}
test("public preview identities agree and unhosted release operations reject", () => {
  assert.match(readIdentity().version, versionPattern);
  assert.throws(() => hostedMain({}), /hosted main/);
  const env = {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "lapismd/lapis-desktop",
    GITHUB_REF: "refs/heads/main",
    GITHUB_SHA: source,
  };
  assert.doesNotThrow(() => hostedMain(env));
  assert.throws(() =>
    hostedMain({ ...env, GITHUB_REF: "refs/heads/unreviewed" }),
  );
  const manifest = createManifest(identity, Buffer.from("archive"));
  assert.equal(validateManifest(manifest).artifacts[0].size, 7);
  for (const change of [
    (m) => {
      m.channel = "stable";
    },
    (m) => {
      m.repository = "elsewhere/app";
    },
    (m) => {
      m.artifacts[0].url += "?token=private";
    },
    (m) => {
      m.artifacts[0].sha256 = "0".repeat(64);
    },
  ]) {
    const invalid = structuredClone(manifest);
    change(invalid);
    assert.throws(() => validateManifest(invalid));
  }
  assert.equal(compareCalendar("2026.31.10-rc.1", "2026.31.9"), 1);
});
test("candidate preparation requires the latest successful exact-source main CI", async () => {
  assert.equal((await verifySource(identity, sourceServer())).ciRun, 9);
  for (const runs of [
    [],
    [{ ...ci, head_sha: "b".repeat(40) }],
    [{ ...ci, head_branch: "feature" }],
    [ci, { ...ci, id: 10, conclusion: "failure" }],
    [{ ...ci, status: "in_progress" }],
  ])
    await assert.rejects(
      verifySource(identity, sourceServer({ runs })),
      /latest main CI/,
    );
});
test("preparation checks the actual stable calendar baseline and refuses published version reuse", async () => {
  await assert.rejects(
    verifySource(
      identity,
      sourceServer({
        releases: [{ ...legacy[0], tag_name: "desktop-v2026.31.6" }],
      }),
    ),
    /advance/,
  );
  await assert.rejects(
    verifySource(
      identity,
      sourceServer({ existing: { tag_name: identity.tag } }),
    ),
    /recover the tap/,
  );
});
test("promotion selects only qualified unexpired artifacts from the same source workflow", async () => {
  const run = {
    head_sha: source,
    head_branch: "main",
    event: "workflow_dispatch",
    path: ".github/workflows/release-desktop.yml",
    status: "completed",
    conclusion: "success",
    run_attempt: 2,
  };
  const artifact = {
    name: `desktop-preview-${source}-2`,
    expired: false,
    size_in_bytes: 123,
  };
  const request =
    (r = run, artifacts = [artifact]) =>
    async (path) =>
      path.endsWith("artifacts?per_page=100") ? { artifacts } : r;
  assert.equal(
    (await selectCandidate("42", source, request())).artifact,
    artifact.name,
  );
  for (const invalid of [
    { ...run, head_sha: "b".repeat(40) },
    { ...run, conclusion: "failure" },
    { ...run, path: ".github/workflows/other.yml" },
    { ...run, head_branch: "feature" },
  ])
    await assert.rejects(selectCandidate("42", source, request(invalid)));
  for (const artifacts of [
    [],
    [{ ...artifact, expired: true }],
    [artifact, artifact],
  ])
    await assert.rejects(
      selectCandidate("42", source, request(run, artifacts)),
    );
  await assert.rejects(selectCandidate("42; shell", source, request()));
});

test("selective docs-only CI cannot qualify release preparation", async () => {
  const server = sourceServer();
  const request = async (path, options) =>
    path.includes("/actions/runs/9/jobs")
      ? {
          jobs: [
            { name: "Governance", conclusion: "success" },
            { name: "Validate", conclusion: "success" },
          ],
        }
      : server(path, options);
  await assert.rejects(verifySource(identity, request), /full native/);
});
