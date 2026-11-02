import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { github } from "./release/github.mjs";
import { fullCIJobs } from "./release/source-ci.mjs";
import { nativeFamilies } from "./native-families.mjs";

export const nightlyRepository = "lapismd/lapis-desktop";
export const nightlyWorkflow = ".github/workflows/ci.yml";
export const healthThresholds = { attemptHours: 30, successHours: 48 };
const hour = 3600000;
class InvalidEvidence extends Error {}

async function pages(request, path, field) {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const data = await request(
      `${path}${path.endsWith("?") ? "" : "&"}per_page=100&page=${page}`,
    );
    if (!Array.isArray(data?.[field]))
      throw new InvalidEvidence(`Invalid ${field} response`);
    items.push(...data[field]);
    if (data[field].length < 100) return items;
  }
  throw new InvalidEvidence(`Incomplete ${field} pagination`);
}
function stamp(value, now) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now + 5 * 60000)
    throw new InvalidEvidence("Invalid nightly timestamp");
  return parsed;
}
function runIdentity(run, now) {
  if (
    !Number.isSafeInteger(run.id) ||
    run.id < 1 ||
    !Number.isSafeInteger(run.run_attempt) ||
    run.run_attempt < 1 ||
    !/^[a-f0-9]{40}$/u.test(run.head_sha ?? "") ||
    /^0+$/u.test(run.head_sha) ||
    (run.head_repository?.full_name &&
      run.head_repository.full_name !== nightlyRepository)
  )
    throw new InvalidEvidence("Invalid canonical nightly identity");
  const startedAt = run.run_started_at ?? run.created_at;
  const started = stamp(startedAt, now);
  const completed =
    run.status === "completed" ? stamp(run.updated_at, now) : null;
  return {
    id: run.id,
    attempt: run.run_attempt,
    sourceRevision: run.head_sha,
    startedAt,
    ageHours: (now - started) / hour,
    status: run.status,
    conclusion: run.conclusion,
    completedAt: completed === null ? null : run.updated_at,
    successAgeHours: completed === null ? null : (now - completed) / hour,
    durationSeconds: Math.max(
      0,
      ((run.status === "completed" ? stamp(run.updated_at, now) : now) -
        started) /
        1000,
    ),
    url: `https://github.com/${nightlyRepository}/actions/runs/${run.id}`,
  };
}
async function completeEvidence(request, run) {
  const root = `/repos/${nightlyRepository}/actions/runs/${run.id}`;
  const jobs = await pages(request, `${root}/jobs?filter=all`, "jobs");
  const newest = new Map();
  for (const job of jobs.sort((a, b) => b.id - a.id))
    if (!newest.has(job.name)) newest.set(job.name, job);
  const incompleteJobs = fullCIJobs.filter((name) => {
    const job = newest.get(name);
    return (
      !job ||
      job.run_attempt !== run.run_attempt ||
      job.status !== "completed" ||
      job.conclusion !== "success" ||
      (job.head_sha && job.head_sha !== run.head_sha)
    );
  });
  if (incompleteJobs.length)
    return { verdict: "subset-success", incompleteJobs };
  const artifacts = await pages(request, `${root}/artifacts?`, "artifacts");
  const required = [
    `ci-plan-${run.run_attempt}`,
    ...nativeFamilies.map(
      (family) => `native-family-${family}-${run.run_attempt}`,
    ),
  ];
  const validArtifact = (artifact, name) =>
    artifact.name === name &&
    Number.isSafeInteger(artifact.id) &&
    artifact.id > 0 &&
    artifact.expired === false &&
    artifact.size_in_bytes > 0 &&
    (!artifact.workflow_run?.head_sha ||
      artifact.workflow_run.head_sha === run.head_sha);
  const missingArtifacts = required.filter(
    (name) => !artifacts.some((artifact) => validArtifact(artifact, name)),
  );
  if (missingArtifacts.length)
    return { verdict: "missing-evidence", missingArtifacts };
  return {
    verdict: "complete-success",
    selectedJobs: fullCIJobs.length,
    artifacts: required.map((name) => ({
      name,
      id: artifacts.find((artifact) => validArtifact(artifact, name)).id,
    })),
  };
}

/** Read-only health signal; this evidence never authorizes release preparation. */
export async function checkNightlyHealth(request, { now = Date.now() } = {}) {
  const result = {
    schema: 1,
    checkedAt: new Date(now).toISOString(),
    thresholds: healthThresholds,
    releaseQualified: false,
    latestAttempt: null,
    lastCompleteSuccess: null,
  };
  try {
    const runs = (
      await pages(
        request,
        `/repos/${nightlyRepository}/actions/workflows/ci.yml/runs?event=schedule&branch=main`,
        "workflow_runs",
      )
    )
      .filter(
        (run) =>
          run.event === "schedule" &&
          run.head_branch === "main" &&
          run.path === nightlyWorkflow,
      )
      .map((run) => ({ run, identity: runIdentity(run, now) }))
      .sort(
        (a, b) =>
          a.identity.ageHours - b.identity.ageHours || b.run.id - a.run.id,
      );
    if (!runs.length) return { ...result, status: "no-recent-attempt" };
    result.latestAttempt = runs[0].identity;
    for (const { run, identity } of runs) {
      if (
        (identity.successAgeHours ?? identity.ageHours) >
        healthThresholds.successHours
      )
        continue;
      if (run.status !== "completed" || run.conclusion !== "success") continue;
      const evidence = await completeEvidence(request, run);
      if (run.id === runs[0].run.id)
        result.latestAttempt = { ...identity, ...evidence };
      if (evidence.verdict === "complete-success") {
        result.lastCompleteSuccess = { ...identity, ...evidence };
        break;
      }
    }
    if (result.latestAttempt.ageHours > healthThresholds.attemptHours)
      result.status = "no-recent-attempt";
    else if (
      result.latestAttempt.status === "completed" &&
      result.latestAttempt.conclusion !== "success"
    )
      result.status = "recent-failure";
    else if (
      ["subset-success", "missing-evidence"].includes(
        result.latestAttempt.verdict,
      )
    )
      result.status = result.latestAttempt.verdict;
    else if (!result.lastCompleteSuccess)
      result.status = "no-recent-complete-success";
    else result.status = "healthy";
    return result;
  } catch (error) {
    return {
      ...result,
      status:
        error instanceof InvalidEvidence
          ? "invalid-evidence"
          : "access-unavailable",
      detail:
        error instanceof InvalidEvidence
          ? error.message
          : "GitHub Actions read access is unavailable; no health conclusion is inferred",
    };
  }
}
export function healthSummary(result) {
  const row = (name, run) =>
    `| ${name} | ${run ? `[${run.id}, attempt ${run.attempt}](${run.url})` : "none"} | ${run?.sourceRevision ?? "unknown"} | ${run?.conclusion ?? run?.status ?? "unknown"} | ${run ? (name === "Last complete success" ? run.successAgeHours : run.ageHours).toFixed(1) + " h" : "unknown"} |`;
  return (
    `## Nightly validation health: ${result.status}\n\n` +
    `Attempt threshold: ${result.thresholds.attemptHours} hours; complete-success threshold: ${result.thresholds.successHours} hours.\n\n` +
    "| Evidence | Run | Source SHA | Verdict | Age |\n| --- | --- | --- | --- | --- |\n" +
    row("Latest attempt", result.latestAttempt) +
    "\n" +
    row("Last complete success", result.lastCompleteSuccess) +
    "\n\n" +
    (result.detail ? result.detail + "\n\n" : "") +
    (result.latestAttempt?.incompleteJobs
      ? `Incomplete jobs: ${result.latestAttempt.incompleteJobs.join(", ")}.\n\n`
      : "") +
    (result.latestAttempt?.missingArtifacts
      ? `Missing or expired artifacts: ${result.latestAttempt.missingArtifacts.join(", ")}.\n\n`
      : "") +
    "This read-only health result is separate from test verdicts and does not authorize a release.\n"
  );
}
async function main() {
  if (
    process.env.GITHUB_REPOSITORY !== nightlyRepository ||
    process.env.GITHUB_REF !== "refs/heads/main"
  )
    throw Error(
      "Nightly health runs only for canonical lapismd/lapis-desktop main",
    );
  let result;
  try {
    result = await checkNightlyHealth(github());
  } catch {
    result = await checkNightlyHealth(async () => {
      throw Error("read access unavailable");
    });
  }
  const summary = healthSummary(result);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  mkdirSync(".local", { recursive: true });
  writeFileSync(
    ".local/ci-health.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(summary);
  if (result.status !== "healthy") process.exitCode = 1;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch(() => {
    console.error(
      "Nightly health could not run in the admitted canonical context",
    );
    process.exitCode = 1;
  });
