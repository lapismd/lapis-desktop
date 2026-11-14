import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkNightlyHealth, healthSummary } from "../../scripts/ci-health.mjs";
import { fullCIJobs, requireFullCI } from "../../scripts/release/source-ci.mjs";
const now = Date.parse("2026-11-02T12:00:00Z"),
  hour = 3600000;
const date = (age) => new Date(now - age * hour).toISOString();
function run(id = 10, age = 1, change = {}) {
  return {
    id,
    event: "schedule",
    path: ".github/workflows/ci.yml",
    head_branch: "main",
    head_sha: String((id % 9) + 1).repeat(40),
    run_attempt: 2,
    status: "completed",
    conclusion: "success",
    run_started_at: date(age),
    created_at: date(age),
    updated_at: date(age - 0.5),
    head_repository: { full_name: "lapismd/lapis-desktop" },
    ...change,
  };
}
function jobs(source) {
  return fullCIJobs.map((name, index) => ({
    name,
    id: index + 1,
    run_attempt: source.run_attempt,
    head_sha: source.head_sha,
    status: "completed",
    conclusion: "success",
  }));
}
function artifacts(source) {
  return [
    `ci-plan-${source.run_attempt}`,
    "portable-rust-x86_64-unknown-linux-gnu",
    "native-linux-aarch64-unknown-linux-gnu",
    "native-linux-x86_64-unknown-linux-gnu",
  ].map((name, index) => ({
    id: index + 1,
    name,
    expired: false,
    size_in_bytes: 100,
    created_at: new Date(
      Date.parse(source.run_started_at) + 1000,
    ).toISOString(),
    workflow_run: { head_sha: source.head_sha },
  }));
}
function service(
  runs,
  {
    transformJobs = (items) => items,
    transformArtifacts = (items) => items,
    intercept,
  } = {},
) {
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    const intercepted = await intercept?.(path);
    if (intercepted !== undefined) return intercepted;
    if (path.includes("/workflows/ci.yml/runs?"))
      return { workflow_runs: runs };
    const source = runs.find((entry) => path.includes(`/runs/${entry.id}/`));
    assert.ok(source, path);
    if (path.includes("/jobs?"))
      return { jobs: transformJobs(jobs(source), source) };
    if (path.includes("/artifacts?"))
      return { artifacts: transformArtifacts(artifacts(source), source) };
    throw Error("Unexpected endpoint");
  };
  return { request, calls };
}
const health = (request) => checkNightlyHealth(request, { now });

test("complete recent canonical scheduled evidence is healthy and never release authority", async () => {
  const latest = run();
  const { request, calls } = service([latest]);
  const result = await health(request);
  assert.equal(result.status, "healthy");
  assert.equal(result.releaseQualified, false);
  assert.equal(result.latestAttempt.sourceRevision, latest.head_sha);
  assert.equal(result.lastCompleteSuccess.id, latest.id);
  assert.equal(result.latestAttempt.selectedJobs, fullCIJobs.length);
  assert.ok(
    calls.every((path) => path.startsWith("/repos/lapismd/lapis-desktop/")),
  );
  assert.match(healthSummary(result), /does not authorize a release/u);
  await assert.rejects(
    requireFullCI(latest.head_sha, request),
    /latest main CI/u,
  );
});

test("missing and stale attempts are distinct from access failures", async () => {
  for (const entries of [[], [run(10, 31)]])
    assert.equal(
      (await health(service(entries).request)).status,
      "no-recent-attempt",
    );
  const failure = await health(async () => {
    throw Error("HTTP 403 credentials must never appear in summary");
  });
  assert.equal(failure.status, "access-unavailable");
  assert.ok(!healthSummary(failure).includes("credentials must never"));
});

test("fresh failures and cancelled attempts stay failed despite an earlier complete success", async () => {
  for (const conclusion of ["failure", "cancelled", "timed_out"]) {
    const latest = run(11, 1, { conclusion }),
      previous = run(10, 24);
    const result = await health(service([previous, latest]).request);
    assert.equal(result.status, "recent-failure");
    assert.equal(result.latestAttempt.id, 11);
    assert.equal(result.lastCompleteSuccess.id, 10);
  }
});

test("subset success and old job attempts cannot impersonate complete nightly coverage", async () => {
  const latest = run(11),
    previous = run(10, 24);
  for (const transform of [
    (items) => items.filter((job) => job.name !== "Unit tests"),
    (items) => items.map((job) => ({ ...job, run_attempt: 1 })),
    (items) => items.map((job) => ({ ...job, head_sha: "f".repeat(40) })),
    (items) =>
      items.map((job) =>
        job.name === "Storybook interactions (shard 4/4)"
          ? { ...job, conclusion: "skipped" }
          : job,
      ),
  ]) {
    const result = await health(
      service([latest, previous], {
        transformJobs: (items, source) =>
          source.id === latest.id ? transform(items) : items,
      }).request,
    );
    assert.equal(result.status, "subset-success");
    assert.equal(result.lastCompleteSuccess.id, previous.id);
    assert.ok(result.latestAttempt.incompleteJobs.length > 0);
  }
});

test("missing, expired, empty or wrong-source artifacts report unavailable evidence separately", async () => {
  for (const transformArtifacts of [
    (items) => items.filter((artifact) => artifact.name !== "ci-plan-2"),
    (items) => items.map((artifact) => ({ ...artifact, expired: true })),
    (items) =>
      items.map((artifact) => ({
        ...artifact,
        name: artifact.name.replace(/-2$/u, "-1"),
      })),
    (items) => items.map((artifact) => ({ ...artifact, size_in_bytes: 0 })),
    (items) =>
      items.map((artifact) => ({
        ...artifact,
        workflow_run: { head_sha: "f".repeat(40) },
      })),
  ]) {
    const result = await health(
      service([run()], { transformArtifacts }).request,
    );
    assert.equal(result.status, "missing-evidence");
    assert.ok(result.latestAttempt.missingArtifacts.length > 0);
  }
  assert.equal(
    (
      await health(
        service([run()], {
          intercept: (path) => {
            if (path.includes("/artifacts?")) throw Error("HTTP 404");
          },
        }).request,
      )
    ).status,
    "access-unavailable",
  );
});

test("attempt and success thresholds have independent inclusive boundaries", async () => {
  const attempt = run(11, 30, { status: "in_progress", conclusion: null });
  const complete = run(10, 50, { updated_at: date(48) });
  assert.equal(
    (await health(service([attempt, complete]).request)).status,
    "healthy",
  );
  const expired = run(10, 50, { updated_at: date(48.01) });
  assert.equal(
    (await health(service([attempt, expired]).request)).status,
    "no-recent-complete-success",
  );
  const late = { ...attempt, run_started_at: date(30.01) };
  assert.equal(
    (await health(service([late, complete]).request)).status,
    "no-recent-attempt",
  );
});

test("foreign workflows/events are ignored and malformed canonical evidence fails closed", async () => {
  for (const change of [
    { event: "push" },
    { head_branch: "feature" },
    { path: ".github/workflows/other.yml" },
  ])
    assert.equal(
      (await health(service([run(10, 1, change)]).request)).status,
      "no-recent-attempt",
    );
  for (const change of [
    { run_attempt: 0 },
    { head_sha: "wrong" },
    { run_started_at: "invalid" },
    { head_repository: { full_name: "foreign/repo" } },
  ])
    assert.equal(
      (await health(service([run(10, 1, change)]).request)).status,
      "invalid-evidence",
    );
  assert.equal(
    (await health(async () => ({ workflow_runs: null }))).status,
    "invalid-evidence",
  );
});

test("run, job and artifact pagination retains second-page evidence and latest failures", async () => {
  const latest = run(10),
    ignored = Array.from({ length: 100 }, (_, i) =>
      run(100 + i, 1, { event: "push" }),
    );
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    const first = path.endsWith("page=1");
    if (path.includes("/workflows/ci.yml/runs?"))
      return { workflow_runs: first ? ignored : [latest] };
    if (path.includes("/jobs?")) {
      const padding = Array.from(
        { length: 100 - fullCIJobs.length },
        (_, i) => ({ name: `other-${i}`, id: 500 + i }),
      );
      return { jobs: first ? [...jobs(latest), ...padding] : [] };
    }
    return {
      artifacts: first
        ? Array.from({ length: 100 }, (_, i) => ({ name: `other-${i}` }))
        : artifacts(latest),
    };
  };
  assert.equal((await health(request)).status, "healthy");
  assert.equal(calls.length, 6);
  const failed = service([latest], {
    intercept: (path) => {
      if (!path.includes("/jobs?")) return;
      return {
        jobs: path.endsWith("page=1")
          ? [
              ...jobs(latest),
              ...Array.from({ length: 100 - fullCIJobs.length }, (_, i) => ({
                name: `other-${i}`,
                id: 500 + i,
              })),
            ]
          : [{ ...jobs(latest)[0], id: 9999, conclusion: "failure" }],
      };
    },
  });
  assert.equal((await health(failed.request)).status, "subset-success");
});

test("pagination truncation is an evidence failure, not a successful freshness sample", async () => {
  const result = await health(async () => ({
    workflow_runs: Array.from({ length: 100 }, () => run()),
  }));
  assert.equal(result.status, "invalid-evidence");
  assert.match(result.detail, /pagination/u);
});

test("independent health schedule has read-only permissions and no coordinator dependency", () => {
  const workflow = readFileSync(".github/workflows/ci-health.yml", "utf8");
  assert.match(workflow, /cron: "43 \*\/6 \* \* \*"/u);
  assert.match(workflow, /actions: read/u);
  assert.ok(!workflow.includes("needs:"));
  assert.ok(!workflow.includes("write"));
  assert.ok(!workflow.includes("workflow_run:"));
});

test("portable full CI evidence is healthy without retired native-family artifacts", async () => {
  const latest = run();
  const names = [
    `ci-plan-${latest.run_attempt}`,
    "portable-rust-x86_64-unknown-linux-gnu",
    "native-linux-aarch64-unknown-linux-gnu",
    "native-linux-x86_64-unknown-linux-gnu",
  ];
  const { request } = service([latest], {
    transformArtifacts: () =>
      names.map((name, index) => ({
        id: index + 1,
        name,
        expired: false,
        size_in_bytes: 100,
        created_at: new Date(
          Date.parse(latest.run_started_at) + 1000,
        ).toISOString(),
        workflow_run: { head_sha: latest.head_sha },
      })),
  });
  const result = await health(request);
  assert.equal(result.status, "healthy");
  assert.equal(result.releaseQualified, false);
  assert.deepEqual(
    result.latestAttempt.artifacts.map((entry) => entry.name),
    names,
  );
});

test("portable artifacts cannot reuse earlier attempts or unknown creation identity", async () => {
  const latest = run();
  for (const created_at of [undefined, "invalid", date(2), date(0)]) {
    const result = await health(
      service([latest], {
        transformArtifacts: (items) =>
          items.map((item) => ({ ...item, created_at })),
      }).request,
    );
    assert.equal(result.status, "missing-evidence");
  }
});

test("each active portable artifact remains required", async () => {
  for (const missing of artifacts(run()).map((item) => item.name)) {
    const result = await health(
      service([run()], {
        transformArtifacts: (items) =>
          items.filter((item) => item.name !== missing),
      }).request,
    );
    assert.equal(result.status, "missing-evidence");
    assert.deepEqual(result.latestAttempt.missingArtifacts, [missing]);
  }
});
