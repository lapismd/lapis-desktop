import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { requireFullCI } from "./source-ci.mjs";
import { github } from "./github.mjs";
const prefix = "/repos/lapismd/lapis-desktop";
export async function advanceRelease(source, version, request) {
  if (
    !/^[a-f0-9]{40}$/.test(source) ||
    !/^20\d{2}\.\d+\.\d+-rc\.[1-9]\d*$/.test(version)
  )
    throw Error("Invalid automatic release identity");
  if ((await request(`${prefix}/git/ref/heads/main`)).object.sha !== source)
    return "superseded";
  if (
    await request(`${prefix}/releases/tags/desktop-v${version}`, {
      optional: true,
    })
  )
    return "already-published";
  try {
    await requireFullCI(source, request);
  } catch (error) {
    if (
      error.message !==
      "Release requires full Linux test and platform build CI on this exact source; dispatch CI with full=true"
    )
      throw error;
    await request(`${prefix}/actions/workflows/ci.yml/dispatches`, {
      method: "POST",
      body: { ref: "main", inputs: { full: true } },
    });
    return "full-ci-requested";
  }
  const runs = await request(
    `${prefix}/actions/workflows/release-desktop.yml/runs?head_sha=${source}&per_page=100`,
  );
  if (runs.workflow_runs.some((r) => r.head_sha === source))
    return "candidate-already-requested";
  await request(`${prefix}/actions/workflows/release-desktop.yml/dispatches`, {
    method: "POST",
    body: { ref: "main", inputs: { operation: "prepare", publish: true } },
  });
  return "candidate-requested";
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const run = event.workflow_run;
  if (
    process.env.GITHUB_REPOSITORY !== "lapismd/lapis-desktop" ||
    !["push", "workflow_dispatch"].includes(run?.event) ||
    run.head_branch !== "main" ||
    run.conclusion !== "success"
  )
    throw Error(
      "Automatic publication requires successful authoritative main CI",
    );
  const source = run.head_sha;
  if (
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !==
    source
  )
    throw Error("Automatic release checkout/source mismatch");
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const pending = readdirSync(".changeset").some(
    (f) => f.endsWith(".md") && f !== "README.md",
  );
  console.log(
    pending
      ? "awaiting-version-pr"
      : await advanceRelease(source, version, github()),
  );
}
