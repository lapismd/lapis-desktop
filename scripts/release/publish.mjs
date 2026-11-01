import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { hostedMain, hash, repository } from "./contract.mjs";
import { verifyCandidate } from "./candidate.mjs";
import { github } from "./github.mjs";
export async function publishCandidate(
  directory,
  sourceCommit,
  { request, upload, assetBytes },
) {
  const { manifest, metadata, files } = await verifyCandidate(
    directory,
    sourceCommit,
  );
  const api = `/repos/${repository}`;
  const runs = await request(
    `${api}/actions/workflows/ci.yml/runs?head_sha=${sourceCommit}&event=push&per_page=100`,
  );
  const latest = runs.workflow_runs
    .filter(
      (run) => run.head_sha === sourceCommit && run.head_branch === "main",
    )
    .sort((a, b) => b.id - a.id)[0];
  if (
    !latest ||
    latest.status !== "completed" ||
    latest.conclusion !== "success" ||
    latest.id !== metadata.sourceCI.ciRun
  )
    throw Error(
      "The approved candidate no longer has its exact successful CI qualification",
    );
  const tag = await request(`${api}/git/ref/tags/${manifest.tag}`, {
    optional: true,
  });
  if (tag && (tag.object.type !== "commit" || tag.object.sha !== sourceCommit))
    throw Error("Release tag source changed");
  if (!tag)
    await request(`${api}/git/refs`, {
      method: "POST",
      body: { ref: `refs/tags/${manifest.tag}`, sha: sourceCommit },
    });
  let release = await request(`${api}/releases/tags/${manifest.tag}`, {
    optional: true,
  });
  if (
    release &&
    (release.tag_name !== manifest.tag || release.prerelease !== true)
  )
    throw Error("Existing release has a different channel");
  const notes = await readFile(join(directory, "LIMITATIONS.md"), "utf8");
  if (!release)
    release = await request(`${api}/releases`, {
      method: "POST",
      body: {
        tag_name: manifest.tag,
        target_commitish: sourceCommit,
        name: `Lapis Notes Preview ${manifest.version}`,
        draft: true,
        prerelease: true,
        make_latest: "false",
        body: `Preview for Apple Silicon macOS 15+ (ad-hoc signed, unnotarized) and Ubuntu 24.04 ARM64/x64 (WebKitGTK 4.1, GTK 3 and Ayatana AppIndicator required).\n\nSource: ${sourceCommit}\nCI: ${metadata.sourceCI.ciUrl}\n\nInstall using the verified Homebrew preview cask after its update PR merges.\n\n${notes}`,
      },
    });
  const local = new Map(
    await Promise.all(
      files.map(async (file) => [file, await readFile(join(directory, file))]),
    ),
  );
  const names = new Map(files.map((file) => [file, file]));
  if (files.some((file) => file.includes("/")))
    throw Error("Release assets must have flat filenames");
  if (names.size !== files.length) throw Error("Candidate asset names collide");
  async function verifyAssets(current, complete) {
    const seen = new Set();
    for (const asset of current.assets) {
      const file = names.get(asset.name);
      if (!file || seen.has(asset.name))
        throw Error("Unexpected or duplicate release asset");
      seen.add(asset.name);
      const expected = local.get(file);
      if (
        asset.size !== expected.length ||
        hash(await assetBytes(asset, current.draft, manifest.tag)) !==
          hash(expected)
      )
        throw Error(`Existing release bytes differ: ${asset.name}`);
    }
    if (complete && seen.size !== files.length)
      throw Error("Release is missing qualified assets");
    return seen;
  }
  const present = await verifyAssets(release, !release.draft);
  if (release.draft) {
    for (const [name, file] of names)
      if (!present.has(name))
        await upload(manifest.tag, join(directory, file), name);
    release = await request(`${api}/releases/${release.id}`);
    await verifyAssets(release, true);
    release = await request(`${api}/releases/${release.id}`, {
      method: "PATCH",
      body: { draft: false, prerelease: true, make_latest: "false" },
    });
  }
  await verifyAssets(release, true);
  return { tag: manifest.tag, url: release.html_url };
}
async function main() {
  hostedMain();
  if (process.env.LAPIS_DESKTOP_PUBLISH_APPROVED !== "1")
    throw Error("Publication requires the protected release environment");
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  const result = await publishCandidate(
    resolve(".local/release/candidate"),
    process.env.GITHUB_SHA,
    {
      request: github(token),
      upload: async (tag, file, name) =>
        execFileSync(
          "gh",
          ["release", "upload", tag, file, "--repo", repository],
          { stdio: "inherit" },
        ),
      assetBytes: async (asset, draft, tag) => {
        const publicUrl = `https://github.com/${repository}/releases/download/${tag}/${asset.name}`;
        if (!draft && asset.browser_download_url !== publicUrl)
          throw Error("Unexpected public release URL");
        if (!Number.isSafeInteger(asset.id) || asset.id <= 0)
          throw Error("Invalid release asset ID");
        const url = draft
          ? `https://api.github.com/repos/${repository}/releases/assets/${asset.id}`
          : publicUrl;
        const response = await fetch(
          url,
          draft
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/octet-stream",
                },
              }
            : {},
        );
        if (!response.ok)
          throw Error(`Release asset verification failed: ${response.status}`);
        return Buffer.from(await response.arrayBuffer());
      },
    },
  );
  console.log(`Published and verified ${result.url}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
