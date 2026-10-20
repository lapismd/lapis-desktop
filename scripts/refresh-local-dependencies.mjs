import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  committedSource,
  dependencySources,
} from "./local-dependency-sources.mjs";
import { verifyArchiveResolution } from "./local-archives.mjs";

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}
function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
export function exportDigest(directory) {
  const hash = createHash("sha256");
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name).slice(directory.length + 1),
    )
    .sort();
  for (const name of files) {
    hash
      .update(JSON.stringify(name))
      .update(readFileSync(join(directory, name)));
  }
  return hash.digest("hex");
}
async function run(root, args) {
  await new Promise((accept, reject) => {
    const child = spawn("pnpm", args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? accept()
        : reject(
            new Error(`pnpm ${args.join(" ")} failed in ${root}: ${code}`),
          ),
    );
  });
}
export function freshness(groups, installed, links) {
  return groups.flatMap((group) =>
    group.packages.map((pkg) => {
      const receipt = (pkg.linked ? links : installed).find(
        (entry) => entry.name === pkg.name,
      );
      const revision = receipt?.source?.revision;
      const current =
        revision === group.revision &&
        (!pkg.linked ||
          (existsSync(join(pkg.root, "dist")) &&
            receipt.exports === exportDigest(join(pkg.root, "dist"))));
      return {
        name: pkg.name,
        source: group.revision,
        installed: revision ?? null,
        current,
      };
    }),
  );
}
export async function refreshLocalDependencies(root, check = false) {
  const groups = dependencySources(root);
  const directory = join(root, ".local/archives");
  if (check) {
    const installedPath = join(directory, "installed.json");
    const installed = readJson(installedPath, { packages: [] }).packages;
    const links = readJson(join(directory, "latest-linked.json"), []);
    const rows = freshness(groups, installed, links);
    for (const row of rows)
      console.log(
        `${row.current ? "current" : "STALE"} ${row.name}: ${row.installed?.slice(0, 12) ?? "unrecorded"} -> ${row.source.slice(0, 12)}`,
      );
    assert.ok(
      rows.every((row) => row.current),
      `${rows.filter((row) => !row.current).length} local dependencies need refreshing`,
    );
    // A matching revision string alone cannot bless stale or modified payloads.
    for (const entry of installed)
      assert.equal(
        digest(entry.tarball),
        entry.sha256,
        `Archive checksum mismatch: ${entry.name}`,
      );
    const scopes = installed.map((entry) =>
      dirname(
        dirname(dirname(realpathSync(join(root, "node_modules", entry.name)))),
      ),
    );
    const routes = verifyArchiveResolution(root, installed, scopes);
    for (const group of groups)
      for (const pkg of group.packages.filter((pkg) => pkg.linked))
        assert.equal(
          realpathSync(join(root, "node_modules", pkg.name)),
          realpathSync(pkg.root),
        );
    console.log(
      `All ${rows.length} local packages are current; ${routes} archive import routes verified.`,
    );
    return;
  }
  mkdirSync(directory, { recursive: true });
  const packages = [],
    links = [];
  for (const group of groups) {
    console.log(`Refresh ${group.repo} at ${group.revision}`);
    const output = join(directory, "latest", group.repo, group.revision);
    mkdirSync(output, { recursive: true });
    if (group.build) {
      const deno =
        group.repo === "spec-validator" &&
        group.packages[0].manifest.engines.deno;
      if (deno)
        assert.match(
          deno,
          /^\d+\.\d+\.\d+$/u,
          "Spec Validator must pin its build runtime",
        );
      await run(
        group.root,
        deno
          ? [`--package=deno@${deno}`, "dlx", "--shell-mode", "pnpm build:node"]
          : group.build,
      );
    }
    for (const pkg of group.packages) {
      if (!group.build && group.repo !== "design-core")
        await run(pkg.root, ["build"]);
      const source = {
        repository: pkg.manifest.repository?.url ?? group.repo,
        revision: group.revision,
        packageDirectory: pkg.directory,
      };
      if (pkg.linked) {
        links.push({
          name: pkg.name,
          source,
          exports: exportDigest(join(pkg.root, "dist")),
        });
        continue;
      }
      let tarball;
      if (group.repo === "design-core") {
        // Use the owner's prepared CSS/declaration packaging, never raw source CSS.
        const { packLocal } = await import(
          pathToFileURL(join(group.root, "scripts/pack-local.mjs"))
        );
        tarball = await packLocal(group.root, {
          outputDirectory: output,
          suffix: "-latest",
        });
      } else {
        await run(pkg.root, [
          "--config.ignore-scripts=true",
          "pack",
          "--pack-destination",
          output,
        ]);
        tarball = join(
          output,
          `${pkg.name.replace(/^@/u, "").replaceAll("/", "-")}-${pkg.version}.tgz`,
        );
      }
      packages.push({
        name: pkg.name,
        version: pkg.version,
        tarball,
        sha256: digest(tarball),
        source,
      });
    }
    assert.equal(
      committedSource(group.root, [...group.dirs, ...(group.inputs ?? [])]),
      group.revision,
      `Source moved while building ${group.repo}; rerun refresh`,
    );
  }
  for (const [filename, value] of [
    ["manifest.json", { version: 1, packages }],
    ["latest-linked.json", links],
  ]) {
    writeFileSync(
      join(directory, filename + ".pending"),
      JSON.stringify(value, null, 2) + "\n",
    );
    renameSync(
      join(directory, filename + ".pending"),
      join(directory, filename),
    );
  }
  console.log(
    `Prepared ${packages.length} archives and ${links.length} linked public builds. Quit the review app normally, run pnpm local:install, then rebuild/relaunch it and run pnpm local:status.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert.ok(
    process.argv.slice(2).every((arg) => arg === "--check"),
    "Only --check is supported",
  );
  await refreshLocalDependencies(
    resolve(import.meta.dirname, ".."),
    process.argv.includes("--check"),
  );
}
