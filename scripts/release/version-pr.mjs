import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { releasePlan, versionDesktop } from "./version.mjs";
import { refreshReleaseContext } from "./refresh-context.mjs";
import { versionEvidence } from "./version-evidence.mjs";
import { github } from "./github.mjs";
const prefix = "/repos/lapismd/lapis-desktop";
const branch = "changeset-release/main";
export async function openVersionPR(
  source,
  files,
  version,
  request,
  root = process.cwd(),
) {
  if (!/^[a-f0-9]{40}$/.test(source))
    throw Error("Exact version source required");
  const main = (await request(`${prefix}/git/ref/heads/main`)).object.sha;
  if (main !== source) throw Error("Main moved during version preparation");
  const current = await request(`${prefix}/git/ref/heads/${branch}`, {
    optional: true,
  });
  if (current) {
    const comparison = await request(
      `${prefix}/compare/${source}...${current.object.sha}`,
    );
    if (comparison.files.some((file) => !files.includes(file.filename)))
      throw Error("Version branch contains unrelated edits");
  }
  const parent = await request(`${prefix}/git/commits/${source}`);
  const tree = await request(`${prefix}/git/trees`, {
    method: "POST",
    body: {
      base_tree: parent.tree.sha,
      tree: files.map((path) => ({
        path,
        mode: "100644",
        type: "blob",
        ...(existsSync(join(root, path))
          ? { content: readFileSync(join(root, path), "utf8") }
          : { sha: null }),
      })),
    },
  });
  const commit = await request(`${prefix}/git/commits`, {
    method: "POST",
    body: {
      message: `Version Desktop preview ${version}`,
      tree: tree.sha,
      parents: [source],
    },
  });
  await request(
    current ? `${prefix}/git/refs/heads/${branch}` : `${prefix}/git/refs`,
    {
      method: current ? "PATCH" : "POST",
      body: current
        ? { sha: commit.sha, force: true }
        : { ref: `refs/heads/${branch}`, sha: commit.sha },
    },
  );
  const pulls = await request(
    `${prefix}/pulls?state=open&head=lapismd:${encodeURIComponent(branch)}`,
  );
  const fields = {
    title: `Version Desktop preview ${version}`,
    body: `Apply the reviewed Changesets release plan for ${version}.\n\nAfter merge, full exact-source CI, candidate qualification and Homebrew installation checks gate automatic publication. No npm package or stable cutover is published.`,
  };
  return pulls.length
    ? request(`${prefix}/pulls/${pulls[0].number}`, {
        method: "PATCH",
        body: fields,
      })
    : request(`${prefix}/pulls`, {
        method: "POST",
        body: { ...fields, head: branch, base: "main" },
      });
}
function main() {
  if (process.argv.includes("--intent")) {
    const plan = releasePlan();
    if (!process.env.GITHUB_OUTPUT)
      throw Error("Intent requires GitHub output");
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `hasChangesets=${plan.releases.length > 0}\n`,
    );
    return;
  }
  const source = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (
    process.env.GITHUB_REPOSITORY !== "lapismd/lapis-desktop" ||
    process.env.GITHUB_REF !== "refs/heads/main" ||
    process.env.GITHUB_SHA !== source
  )
    throw Error("Version PR writes require exact canonical main");
  const result = versionDesktop();
  const files = versionEvidence(result);
  refreshReleaseContext();
  execFileSync(
    process.execPath,
    [
      "scripts/release-tools/node_modules/prettier/bin/prettier.cjs",
      "--write",
      ...files.filter(
        (p) => existsSync(p) && !p.endsWith(".toml") && !p.endsWith(".lock"),
      ),
    ],
    { stdio: "inherit" },
  );
  return openVersionPR(source, files, result.version, github());
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = await main();
  if (result?.html_url) console.log(result.html_url);
}
