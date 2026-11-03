import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { github } from "../release/github.mjs";

const timestamp = (value) => {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const elapsed = (start, end) => {
  const first = timestamp(start),
    last = timestamp(end);
  return first !== null && last !== null && last >= first ? last - first : null;
};
const sha = (value) => (/^[a-f0-9]{40}$/u.test(value ?? "") ? value : null);

function jobTiming(job, now) {
  const skipped = job.conclusion === "skipped";
  const complete = job.status === "completed";
  const durationMs = skipped
    ? null
    : elapsed(
        job.started_at,
        complete ? job.completed_at : new Date(now).toISOString(),
      );
  return {
    id: job.id,
    name: job.name,
    attempt: job.run_attempt ?? null,
    status: job.status ?? "unknown",
    conclusion: job.conclusion ?? null,
    runner: {
      name: job.runner_name ?? null,
      labels: Array.isArray(job.labels)
        ? job.labels.filter((label) => typeof label === "string")
        : [],
    },
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    durationMs,
    countedRunnerMs: complete && !skipped ? durationMs : null,
    timing: skipped
      ? "skipped"
      : !complete
        ? "incomplete"
        : durationMs === null
          ? "unavailable"
          : "complete",
  };
}

/** Advisory timing only: this never evaluates or replaces qualification gates. */
export async function collectRunSummary(
  request,
  {
    repository,
    runId,
    attempt,
    plan = null,
    sourceRevision = null,
    now = Date.now(),
  },
) {
  if (
    !/^[\w.-]+\/[\w.-]+$/u.test(repository ?? "") ||
    !/^[1-9]\d*$/u.test(String(runId)) ||
    !/^[1-9]\d*$/u.test(String(attempt)) ||
    !Number.isFinite(now)
  )
    throw Error("Invalid timing identity");
  const base = `/repos/${repository}/actions/runs/${runId}`;
  const run = await request(`${base}/attempts/${attempt}`);
  if (String(run.id) !== String(runId) || run.run_attempt !== Number(attempt))
    throw Error("Timing attempt identity mismatch");
  const all = [];
  for (let page = 1; page <= 100; page++) {
    const response = await request(
      `${base}/jobs?filter=all&per_page=100&page=${page}`,
    );
    if (!Array.isArray(response.jobs)) throw Error("Invalid timing jobs");
    all.push(...response.jobs);
    if (response.jobs.length < 100) break;
    if (page === 100) throw Error("Timing pagination incomplete");
  }
  const latest = new Map(),
    previousAttempts = [],
    unattributedJobs = [];
  for (const job of all.sort((a, b) => b.id - a.id)) {
    if (typeof job.name !== "string" || !Number.isInteger(job.id) || job.id < 1)
      throw Error("Invalid timing job identity");
    const record = jobTiming(job, now);
    if (
      !Number.isInteger(job.run_attempt) ||
      job.run_attempt < 1 ||
      job.run_attempt > Number(attempt)
    )
      unattributedJobs.push(record);
    else if (job.run_attempt !== Number(attempt) || latest.has(job.name))
      previousAttempts.push(record);
    else latest.set(job.name, record);
  }
  const jobs = [...latest.values()].sort((a, b) => a.id - b.id);
  const planRevision = sha(plan?.testedRevision),
    actualRevision = sha(sourceRevision);
  const planStatus =
    !planRevision || !["ordinary", "full"].includes(plan?.profile)
      ? "unavailable"
      : actualRevision && planRevision !== actualRevision
        ? "stale"
        : "available";
  const queueMs = elapsed(run.created_at, run.run_started_at);
  const completed = run.status === "completed";
  const finishedAt = completed
    ? (run.completed_at ?? run.updated_at)
    : new Date(now).toISOString();
  const executionWallMs = elapsed(run.run_started_at, finishedAt);
  const reasons = [
    ...(!completed
      ? ["Run is still in progress; timing is a live snapshot"]
      : []),
    ...(jobs.some((job) => ["incomplete", "unavailable"].includes(job.timing))
      ? [
          "Unfinished or unavailable job timings are excluded from runner minutes",
        ]
      : []),
    ...(unattributedJobs.length
      ? ["Job attempt metadata is missing or newer than this snapshot"]
      : []),
    ...(!jobs.length ? ["No current-attempt jobs were returned"] : []),
    ...(queueMs === null || executionWallMs === null
      ? ["Run timestamps are incomplete or invalid"]
      : []),
    ...(planStatus !== "available"
      ? ["Exact-source plan metadata is unavailable or stale"]
      : []),
  ];
  return {
    schema: 1,
    status: reasons.length ? "partial" : "available",
    advisory: true,
    observedAt: new Date(now).toISOString(),
    repository,
    runId: String(runId),
    attempt: Number(attempt),
    url: run.html_url ?? null,
    runStatus: run.status ?? "unknown",
    conclusion: run.conclusion ?? null,
    source: {
      testedRevision: actualRevision ?? planRevision,
      apiHeadSha: sha(run.head_sha),
      planRevision,
      planStatus,
    },
    profile: planStatus === "available" ? plan.profile : null,
    selectedCoverage:
      planStatus === "available"
        ? {
            gates: plan.gates ?? [],
            nativeFamilies: plan.nativeFamilies ?? [],
            catalogProfile: plan.catalogProfile ?? null,
          }
        : null,
    queueMs,
    executionWallMs,
    queueBasis:
      "API created_at to run_started_at; reruns may include prior-attempt time",
    executionBasis:
      completed && !run.completed_at
        ? "API run_started_at to updated_at"
        : "API run_started_at to completion or snapshot time",
    completedJobRunnerMinutes:
      jobs.reduce((total, job) => total + (job.countedRunnerMs ?? 0), 0) /
      60000,
    countedJobs: jobs.filter((job) => job.countedRunnerMs !== null).length,
    jobs,
    previousAttempts,
    unattributedJobs,
    reasons,
  };
}

const cell = (value) =>
  String(value ?? "unknown")
    .replaceAll("|", "\\|")
    .replace(/[\r\n]/gu, " ");
const minutes = (milliseconds) =>
  milliseconds === null
    ? "unavailable"
    : `${(milliseconds / 60000).toFixed(2)} min`;
export function renderRunSummary(report) {
  if (report.status === "unavailable")
    return "## CI timing snapshot\n\nTiming unavailable. Existing check results remain authoritative.\n";
  return (
    `## CI timing snapshot (${report.status})\n\n` +
    `Source: ${report.source.testedRevision ?? "unavailable"}; profile: ${report.profile ?? "unavailable"}; attempt: ${report.attempt}.\n\n` +
    `Queue (API creation → start): ${minutes(report.queueMs)}. Execution wall: ${minutes(report.executionWallMs)}. Completed-job runner subtotal: ${report.completedJobRunnerMinutes.toFixed(2)} min (${report.countedJobs} jobs).\n\n` +
    "| Current-attempt job | Runner/platform labels | Outcome | Duration |\n| --- | --- | --- | --- |\n" +
    report.jobs
      .map(
        (job) =>
          `| ${cell(job.name)} | ${cell(job.runner.labels.join(", ") || job.runner.name)} | ${cell(job.conclusion ?? job.status)} | ${job.timing === "skipped" ? "skipped" : minutes(job.durationMs)}${job.timing === "incomplete" ? " (incomplete; excluded)" : ""} |`,
      )
      .join("\n") +
    `\n\nPrior job attempts retained: ${report.previousAttempts.length}; excluded from this subtotal.\n` +
    "Rerun queue intervals may include prior-attempt time. This snapshot does not establish a pass rate or a cold/warm comparison. Existing check results remain authoritative.\n" +
    report.reasons.map((reason) => `- ${reason}\n`).join("")
  );
}

export async function main({
  environment = process.env,
  request,
  now = Date.now(),
  directory = ".local",
} = {}) {
  let report;
  try {
    let plan;
    try {
      plan = JSON.parse(
        environment.LAPIS_CI_PLAN ??
          (await readFile(resolve(directory, "ci-plan.json"), "utf8")),
      );
    } catch {
      plan = null;
    }
    if (!request && !environment.GITHUB_TOKEN)
      throw Error("GitHub timing token unavailable");
    const deadline = AbortSignal.timeout(15000);
    report = await collectRunSummary(
      request ??
        github(environment.GITHUB_TOKEN, (url, options) =>
          fetch(url, { ...options, signal: deadline }),
        ),
      {
        repository: environment.GITHUB_REPOSITORY,
        runId: environment.GITHUB_RUN_ID,
        attempt: environment.GITHUB_RUN_ATTEMPT,
        sourceRevision: environment.GITHUB_SHA,
        plan,
        now,
      },
    );
  } catch {
    // Never reflect API response/error bodies, credentials or arbitrary exception text.
    report = {
      schema: 1,
      status: "unavailable",
      advisory: true,
      observedAt: new Date(now).toISOString(),
    };
  }
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(
      resolve(directory, "ci-run-summary.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    if (environment.GITHUB_STEP_SUMMARY)
      await appendFile(
        environment.GITHUB_STEP_SUMMARY,
        renderRunSummary(report),
      );
    console.log(`CI timing snapshot: ${report.status} (advisory)`);
  } catch {
    console.log(
      "CI timing snapshot unavailable: report persistence failed (advisory)",
    );
  }
  return report;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
