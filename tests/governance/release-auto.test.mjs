import test from "node:test";
import assert from "node:assert/strict";
import { advanceRelease } from "../../scripts/release/auto.mjs";
import { fullCIJobs } from "../../scripts/release/source-ci.mjs";
import { github } from "../../scripts/release/github.mjs";
const source = "a".repeat(40),
  version = "2026.31.6-rc.3";
function fixture({
  full = true,
  published = false,
  superseded = false,
  failed = false,
  attempted = false,
  scheduled = false,
} = {}) {
  const calls = [];
  const request = async (path, options = {}) => {
    calls.push({ path, ...options });
    if (options.method === "POST") return null;
    if (path.endsWith("/git/ref/heads/main"))
      return { object: { sha: superseded ? "b".repeat(40) : source } };
    if (path.includes("/releases/tags/"))
      return published ? { tag_name: `desktop-v${version}` } : null;
    if (path.includes("/workflows/ci.yml/runs?"))
      return {
        workflow_runs: [
          {
            id: 7,
            head_sha: source,
            head_branch: "main",
            event: scheduled ? "schedule" : "push",
            status: "completed",
            conclusion: failed ? "failure" : "success",
            run_attempt: 1,
            html_url: "https://example.invalid/ci",
          },
        ],
      };
    if (path.includes("/runs/7/jobs?"))
      return {
        jobs: fullCIJobs.map((name, id) => ({
          name,
          id,
          status: "completed",
          conclusion:
            !full && name === "Full source qualification"
              ? "skipped"
              : "success",
          run_attempt: 1,
        })),
      };
    if (path.includes("/workflows/release-desktop.yml/runs?"))
      return {
        workflow_runs: attempted
          ? [{ head_sha: source, status: "completed", conclusion: "failure" }]
          : [],
      };
    throw Error(`Unexpected request: ${path}`);
  };
  return {
    request,
    calls,
    writes: () => calls.filter((c) => c.method === "POST"),
  };
}
test("selective CI requests full qualification without publishing", async () => {
  const f = fixture({ full: false });
  assert.equal(
    await advanceRelease(source, version, f.request),
    "full-ci-requested",
  );
  assert.equal(f.writes().length, 1);
  assert.ok(f.writes()[0].path.endsWith("/ci.yml/dispatches"));
  assert.deepEqual(f.writes()[0].body, { ref: "main", inputs: { full: true } });
});
test("full authoritative source requests verified candidate publication once", async () => {
  const f = fixture();
  assert.equal(
    await advanceRelease(source, version, f.request),
    "candidate-requested",
  );
  assert.deepEqual(
    f.writes().map((c) => c.body),
    [{ ref: "main", inputs: { operation: "prepare", publish: true } }],
  );
  const retry = fixture({ attempted: true });
  assert.equal(
    await advanceRelease(source, version, retry.request),
    "candidate-already-requested",
  );
  assert.equal(retry.writes().length, 0);
});
test("failed, scheduled, superseded and published source cannot dispatch publication", async () => {
  for (const options of [{ failed: true }, { scheduled: true }]) {
    const f = fixture(options);
    await assert.rejects(advanceRelease(source, version, f.request));
    assert.equal(f.writes().length, 0);
  }
  for (const options of [{ superseded: true }, { published: true }]) {
    const f = fixture(options);
    await advanceRelease(source, version, f.request);
    assert.equal(f.writes().length, 0);
  }
});
test("successful GitHub dispatch accepts an empty 204 response without replay", async () => {
  let calls = 0;
  const request = github("private", async () => {
    calls++;
    return new Response(null, { status: 204 });
  });
  assert.equal(
    await request(
      "/repos/lapismd/lapis-desktop/actions/workflows/ci.yml/dispatches",
      { method: "POST", body: { ref: "main" } },
    ),
    null,
  );
  assert.equal(calls, 1);
});
