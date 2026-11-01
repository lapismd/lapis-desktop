import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  hostedMain,
  readIdentity,
  compareCalendar,
  repository,
} from "./contract.mjs";
import { github } from "./github.mjs";
export async function verifySource(identity, request) {
  const response = await request(
    `/repos/${repository}/actions/workflows/ci.yml/runs?head_sha=${identity.sourceCommit}&event=push&per_page=100`,
  );
  const latest = response.workflow_runs
    .filter(
      (run) =>
        run.head_sha === identity.sourceCommit && run.head_branch === "main",
    )
    .sort((a, b) => b.id - a.id)[0];
  if (
    !latest ||
    latest.conclusion !== "success" ||
    latest.status !== "completed"
  )
    throw Error(
      "The latest main CI run for this exact source commit must pass before candidate preparation",
    );
  let highest;
  for (let page = 1; page <= 100; page++) {
    const releases = await request(
      `/repos/lapismd/lapis-notes/releases?per_page=100&page=${page}`,
    );
    for (const release of releases) {
      const version = /^desktop-v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1];
      if (
        version &&
        !release.draft &&
        !release.prerelease &&
        (!highest || compareCalendar(version, highest) > 0)
      )
        highest = version;
    }
    if (releases.length < 100) break;
    if (page === 100)
      throw Error("Legacy release scan exceeded its page limit");
  }
  if (!highest || compareCalendar(identity.version, highest) <= 0)
    throw Error(
      "Preview CalVer must advance above the highest published stable Deno desktop",
    );
  const existing = await request(
    `/repos/${repository}/releases/tags/${identity.tag}`,
    { optional: true },
  );
  if (existing)
    throw Error(
      "Candidate release already exists; recover the tap update instead of rebuilding it",
    );
  return {
    sourceCommit: identity.sourceCommit,
    ciRun: latest.id,
    ciAttempt: latest.run_attempt,
    ciUrl: latest.html_url,
    ciResult: latest.conclusion,
    legacyVersion: highest,
  };
}
async function main() {
  hostedMain();
  const identity = readIdentity();
  const receipt = await verifySource(identity, github());
  await mkdir(".local/release", { recursive: true });
  await writeFile(
    ".local/release/source-ci.json",
    JSON.stringify(receipt, null, 2) + "\n",
  );
  console.log(`Qualified source ${identity.sourceCommit}: ${receipt.ciUrl}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
