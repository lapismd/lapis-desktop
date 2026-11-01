import { repository } from "./contract.mjs";
export const fullCIJobs = [
  "Full source qualification",
  "Plan affected CI",
  "Governance",
  "Quality",
  "Unit tests",
  "Dependency audits",
  "Static Storybook",
  "Storybook interactions",
  "Native bundle",
  "Native ARM64 acceptance",
  ...[1, 2, 3, 4].map((n) => `Storybook interactions (shard ${n}/4)`),
  "Native Linux (aarch64-unknown-linux-gnu)",
  "Native Linux (x86_64-unknown-linux-gnu)",
  "Validate",
];
export async function requireFullCI(sourceCommit, request) {
  const response = await request(
    `/repos/${repository}/actions/workflows/ci.yml/runs?head_sha=${sourceCommit}&per_page=100`,
  );
  const latest = response.workflow_runs
    .filter(
      (r) =>
        r.head_sha === sourceCommit &&
        r.head_branch === "main" &&
        ["push", "workflow_dispatch"].includes(r.event),
    )
    .sort((a, b) => b.id - a.id)[0];
  if (
    !latest ||
    latest.status !== "completed" ||
    latest.conclusion !== "success"
  )
    throw Error(
      "The latest main CI run for this exact source commit must pass before qualification",
    );
  const jobs = [];
  for (let page = 1; page <= 100; page++) {
    const result = await request(
      `/repos/${repository}/actions/runs/${latest.id}/jobs?filter=all&per_page=100&page=${page}`,
    );
    jobs.push(...result.jobs);
    if (result.jobs.length < 100) break;
    if (page === 100) throw Error("Source CI job scan exceeded its page limit");
  }
  const newest = new Map();
  for (const job of jobs.sort((a, b) => b.id - a.id))
    if (!newest.has(job.name)) newest.set(job.name, job);
  if (
    fullCIJobs.some(
      (name) =>
        newest.get(name)?.conclusion !== "success" ||
        newest.get(name)?.status !== "completed",
    )
  )
    throw Error(
      "Release requires full native/feature CI on this exact source; dispatch CI with full=true",
    );
  return {
    sourceCommit,
    ciRun: latest.id,
    ciAttempt: latest.run_attempt,
    ciUrl: latest.html_url,
    ciResult: "success",
    fullQualification: true,
    jobs: fullCIJobs.map((name) => ({
      name,
      id: newest.get(name).id,
      conclusion: "success",
    })),
  };
}
