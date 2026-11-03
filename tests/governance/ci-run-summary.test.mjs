import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { github } from "../../scripts/release/github.mjs";
import {
  collectRunSummary,
  main,
  renderRunSummary,
} from "../../scripts/ci/run-summary.mjs";

const source = "a".repeat(40),
  now = Date.parse("2026-11-02T12:10:00Z");
const date = (minute) => `2026-11-02T12:${String(minute).padStart(2, "0")}:00Z`;
const plan = {
  testedRevision: source,
  profile: "full",
  gates: ["quality"],
  nativeFamilies: [],
  catalogProfile: "full",
};
const run = {
  id: 12,
  run_attempt: 2,
  head_sha: source,
  status: "completed",
  conclusion: "failure",
  created_at: date(0),
  run_started_at: date(2),
  completed_at: date(8),
};
function job(id, name, change = {}) {
  return {
    id,
    name,
    run_attempt: 2,
    status: "completed",
    conclusion: "success",
    started_at: date(2),
    completed_at: date(4),
    runner_name: "hosted-runner",
    labels: ["macOS", "ARM64"],
    ...change,
  };
}
function service(jobs, metadata = run) {
  const calls = [];
  return {
    calls,
    request: async (path) => {
      calls.push(path);
      if (path.endsWith("/attempts/2")) return metadata;
      const page = Number(
        new URL(`https://api.github.com${path}`).searchParams.get("page"),
      );
      return { jobs: jobs.slice((page - 1) * 100, page * 100) };
    },
  };
}
const collect = (request, changes = {}) =>
  collectRunSummary(request, {
    repository: "lapismd/lapis-desktop",
    runId: "12",
    attempt: "2",
    plan,
    sourceRevision: source,
    now,
    ...changes,
  });

test("queue, execution wall and completed-job runner minutes are distinct and retain actual failures/platforms", async () => {
  const { request } = service([
    job(1, "Quality"),
    job(2, "Native family (services)", {
      conclusion: "failure",
      completed_at: date(6),
    }),
    job(3, "Unselected Linux", {
      conclusion: "skipped",
      started_at: null,
      completed_at: null,
    }),
  ]);
  const result = await collect(request);
  assert.equal(result.status, "available");
  assert.equal(result.queueMs, 2 * 60000);
  assert.equal(result.executionWallMs, 6 * 60000);
  assert.equal(result.completedJobRunnerMinutes, 6);
  assert.equal(result.countedJobs, 2);
  assert.equal(result.conclusion, "failure");
  assert.equal(result.jobs[1].conclusion, "failure");
  assert.deepEqual(result.jobs[1].runner.labels, ["macOS", "ARM64"]);
  assert.equal(result.jobs[2].timing, "skipped");
  assert.equal(result.profile, "full");
  assert.equal(result.source.testedRevision, source);
  assert.match(renderRunSummary(result), /failure/u);
  assert.match(
    renderRunSummary(result),
    /does not establish a pass rate or a cold\/warm comparison/u,
  );
});

test("unfinished, queued and unknown-attempt jobs produce a partial live snapshot and no invented runner time", async () => {
  const { request } = service(
    [
      job(1, "Finished"),
      job(2, "Running", {
        status: "in_progress",
        conclusion: null,
        completed_at: null,
      }),
      job(3, "Queued", {
        status: "queued",
        conclusion: null,
        started_at: null,
        completed_at: null,
      }),
      job(4, "Unknown attempt", { run_attempt: undefined }),
    ],
    { ...run, status: "in_progress", conclusion: null, completed_at: null },
  );
  const result = await collect(request);
  assert.equal(result.status, "partial");
  assert.equal(result.executionWallMs, 8 * 60000);
  assert.equal(result.completedJobRunnerMinutes, 2);
  assert.equal(result.countedJobs, 1);
  assert.equal(result.jobs[1].durationMs, 8 * 60000);
  assert.equal(result.jobs[1].countedRunnerMs, null);
  assert.equal(result.jobs[2].durationMs, null);
  assert.equal(result.unattributedJobs.length, 1);
  assert.match(renderRunSummary(result), /incomplete; excluded/u);
});

test("paginated latest current attempts win; earlier successful results never hide current failure or enter totals", async () => {
  const padding = Array.from({ length: 98 }, (_, n) =>
    job(n + 100, `previous-${n}`, { run_attempt: 1 }),
  );
  const { request, calls } = service([
    job(9, "Quality", { run_attempt: 1 }),
    job(20, "Quality"),
    ...padding,
    job(21, "Quality", { conclusion: "failure", completed_at: date(7) }),
  ]);
  const result = await collect(request);
  assert.equal(calls.length, 3);
  assert.match(calls[0], /\/runs\/12\/attempts\/2$/u);
  assert.match(calls[1], /filter=all&per_page=100&page=1$/u);
  assert.match(calls[2], /page=2$/u);
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].id, 21);
  assert.equal(result.jobs[0].conclusion, "failure");
  assert.equal(result.completedJobRunnerMinutes, 5);
  assert.equal(result.previousAttempts.length, 100);
  assert.ok(result.previousAttempts.some((entry) => entry.id === 9));
});

test("stale plans and invalid timestamps remain visible instead of claiming complete timing", async () => {
  const { request } = service(
    [job(1, "Invalid clock", { completed_at: date(1) })],
    {
      ...run,
      created_at: "invalid",
      completed_at: undefined,
      updated_at: date(8),
    },
  );
  const result = await collect(request, {
    plan: { ...plan, testedRevision: "b".repeat(40) },
  });
  assert.equal(result.status, "partial");
  assert.equal(result.source.planStatus, "stale");
  assert.equal(result.source.testedRevision, source);
  assert.equal(result.profile, null);
  assert.equal(result.queueMs, null);
  assert.equal(result.jobs[0].timing, "unavailable");
  assert.equal(result.completedJobRunnerMinutes, 0);
  assert.equal(result.executionBasis, "API run_started_at to updated_at");
});

test("wrong run/attempt and truncated pagination cannot produce a timing success", async () => {
  await assert.rejects(
    collect(service([], { ...run, id: 13 }).request),
    /identity mismatch/u,
  );
  await assert.rejects(
    collect(service([], { ...run, run_attempt: 1 }).request),
    /identity mismatch/u,
  );
  await assert.rejects(
    collect(async (path) =>
      path.endsWith("/attempts/2") ? run : { jobs: null },
    ),
    /Invalid timing jobs/u,
  );
  const records = Array.from({ length: 100 }, (_, n) =>
    job(n + 1, `same-${n}`),
  );
  await assert.rejects(
    collect(async (path) =>
      path.endsWith("/attempts/2") ? run : { jobs: records },
    ),
    /pagination incomplete/u,
  );
});

test("main persists advisory unavailable evidence on API denial without leaking errors or failing checks", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ci-run-summary-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const summary = join(directory, "summary.md");
  const result = await main({
    directory,
    now,
    environment: {
      GITHUB_REPOSITORY: "lapismd/lapis-desktop",
      GITHUB_RUN_ID: "12",
      GITHUB_RUN_ATTEMPT: "2",
      GITHUB_STEP_SUMMARY: summary,
      LAPIS_CI_PLAN: JSON.stringify(plan),
    },
    request: async () => {
      throw Error("HTTP 403 secret-looking-private-value");
    },
  });
  assert.equal(result.status, "unavailable");
  const saved = await readFile(join(directory, "ci-run-summary.json"), "utf8");
  assert.equal(JSON.parse(saved).advisory, true);
  assert.ok(!saved.includes("secret-looking"));
  assert.match(
    await readFile(summary, "utf8"),
    /Existing check results remain authoritative/u,
  );
});

test("read-only GitHub helper authenticates requests and main loads exact-source plan from disk", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ci-run-summary-plan-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "ci-plan.json"), JSON.stringify(plan));
  const requests = [];
  const request = github("test-only-token", async (url, options) => {
    requests.push({ url, method: options.method });
    assert.equal(options.headers.Authorization, "Bearer test-only-token");
    return {
      ok: true,
      json: async () =>
        url.endsWith("/attempts/2")
          ? run
          : { jobs: [job(1, "Quality | checks")] },
    };
  });
  const result = await main({
    directory,
    request,
    now,
    environment: {
      GITHUB_REPOSITORY: "lapismd/lapis-desktop",
      GITHUB_RUN_ID: "12",
      GITHUB_RUN_ATTEMPT: "2",
      GITHUB_SHA: source,
    },
  });
  assert.equal(result.profile, "full");
  assert.equal(result.source.planStatus, "available");
  assert.ok(
    requests.every(
      ({ url, method }) =>
        url.startsWith("https://api.github.com/repos/lapismd/lapis-desktop/") &&
        method === "GET",
    ),
  );
  assert.match(renderRunSummary(result), /Quality \\\| checks/u);
});
