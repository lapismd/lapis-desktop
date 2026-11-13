import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hostedMain, repository, readIdentity } from "./contract.mjs";
import { github } from "./github.mjs";
import { requireFullCI } from "./source-ci.mjs";
export async function selectCandidate(runId, sourceCommit, request) {
  if (!/^[1-9]\d*$/.test(runId ?? ""))
    throw Error("Select an exact qualified candidate run ID");
  const api = `/repos/${repository}/actions/runs/${runId}`;
  const run = await request(api);
  if (
    !/^[a-f0-9]{40}$/.test(run.head_sha ?? "") ||
    run.head_branch !== "main" ||
    run.event !== "workflow_dispatch" ||
    run.path !== ".github/workflows/release-desktop.yml" ||
    run.status !== "completed" ||
    run.conclusion !== "success"
  )
    throw Error("Candidate must be a successful main release preparation");
  if (run.head_sha !== sourceCommit) {
    await requireFullCI(sourceCommit, request);
    const { tag } = readIdentity();
    const tagRef = await request(`/repos/${repository}/git/ref/tags/${tag}`, {
      optional: true,
    });
    const releases = await request(
      `/repos/${repository}/releases?per_page=100`,
    );
    if (
      tagRef?.object?.type !== "commit" ||
      tagRef.object.sha !== run.head_sha ||
      !releases.some(
        (release) =>
          release.tag_name === tag &&
          release.target_commitish === run.head_sha &&
          release.draft === true &&
          release.prerelease === true,
      )
    )
      throw Error(
        "Cross-source publication is limited to an existing interrupted draft",
      );
  }
  const name = `desktop-preview-${run.head_sha}-${run.run_attempt}`;
  const { artifacts } = await request(`${api}/artifacts?per_page=100`);
  const matches = artifacts.filter(
    (item) => item.name === name && !item.expired && item.size_in_bytes > 0,
  );
  if (matches.length !== 1)
    throw Error("Qualified candidate artifact is missing or expired");
  return { runId, artifact: name, sourceCommit: run.head_sha };
}
async function main() {
  hostedMain();
  const result = await selectCandidate(
    process.env.CANDIDATE_RUN_ID,
    process.env.GITHUB_SHA,
    github(),
  );
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `run-id=${result.runId}\nartifact=${result.artifact}\nsource=${result.sourceCommit}\ntag=${readIdentity().tag}\n`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
