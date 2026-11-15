import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import semver from "semver";
import { archiveHookSource } from "./archive-hook.mjs";
import { verifyArchiveResolution } from "./archive-resolution.mjs";
export { verifyArchiveResolution } from "./archive-resolution.mjs";

export function readArchiveManifest(manifestPath) {
  const path = resolve(manifestPath);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(manifest.version, 1, "Unsupported archive manifest version");
  assert.ok(Array.isArray(manifest.packages) && manifest.packages.length > 0);
  const names = new Set();
  return manifest.packages.map((entry) => {
    assert.match(entry.name, /^@(?:lapis-notes|lapismd)\/[a-z0-9][a-z0-9-]*$/u);
    assert.ok(!names.has(entry.name), `Duplicate archive: ${entry.name}`);
    names.add(entry.name);
    assert.ok(semver.valid(entry.version), `Invalid version: ${entry.name}`);
    assert.ok(
      entry.source?.repository,
      `Missing source repository: ${entry.name}`,
    );
    assert.match(entry.source?.revision ?? "", /^[a-f0-9]{40}$/u);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/u);
    const tarball = resolve(dirname(path), entry.tarball);
    const sha256 = createHash("sha256")
      .update(readFileSync(tarball))
      .digest("hex");
    assert.equal(
      sha256,
      entry.sha256,
      `Archive checksum mismatch: ${entry.name}`,
    );
    const packed = JSON.parse(
      execFileSync("tar", ["-xOf", tarball, "package/package.json"], {
        encoding: "utf8",
      }),
    );
    assert.equal(
      packed.name,
      entry.name,
      "Packed package name differs from manifest",
    );
    assert.equal(
      packed.version,
      entry.version,
      "Packed package version differs from manifest",
    );
    return { ...entry, tarball, sha256 };
  });
}
export async function preserveDependencyFiles(root, install) {
  const paths = ["package.json", "pnpm-lock.yaml"].map((file) =>
    join(root, file),
  );
  const before = paths.map((file) => readFileSync(file));
  try {
    return await install();
  } finally {
    paths.forEach((file, index) => writeFileSync(file, before[index]));
  }
}
function runPnpm(root, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn("pnpm", args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      code === 0
        ? resolveRun()
        : reject(new Error(`pnpm install failed (${signal ?? code})`)),
    );
  });
}
export async function installLocalArchives(root, manifestPath) {
  const entries = readArchiveManifest(manifestPath);
  const rootManifest = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  );
  const declared = {
    ...rootManifest.dependencies,
    ...rootManifest.devDependencies,
    ...rootManifest.optionalDependencies,
  };
  for (const entry of entries)
    assert.ok(
      declared[entry.name],
      `Declare ${entry.name} explicitly before installing its archive; peers retain normal ranges.`,
    );
  const directory = join(root, ".local/archives");
  mkdirSync(directory, { recursive: true });
  const hookPath = join(directory, "install.pnpmfile.cjs");
  const localProjects = JSON.parse(
    execFileSync("pnpm", ["list", "--recursive", "--depth", "-1", "--json"], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  writeFileSync(
    hookPath,
    archiveHookSource(
      entries,
      localProjects.map((project) => project.name),
      Object.entries(declared)
        .filter(([, value]) => value.startsWith("link:"))
        .map(([name, declared]) => {
          const directory = resolve(root, declared.slice(5));
          const manifest = JSON.parse(
            readFileSync(join(directory, "package.json"), "utf8"),
          );
          assert.equal(manifest.name, name, "Local build identity mismatch");
          return {
            name,
            version: manifest.version,
            declared,
            target: "link:" + directory,
          };
        }),
    ),
  );
  await preserveDependencyFiles(root, () =>
    runPnpm(root, [
      "install",
      "--no-frozen-lockfile",
      "--prefer-offline",
      "--force",
      `--config.pnpmfile=${hookPath}`,
    ]),
  );
  const projects = JSON.parse(
    execFileSync("pnpm", ["list", "--recursive", "--depth", "-1", "--json"], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  const checked = verifyArchiveResolution(
    root,
    entries,
    projects.map((project) => project.path),
  );
  for (const cache of ["node_modules/.vite", "node_modules/.cache/storybook"]) {
    rmSync(join(root, cache), { recursive: true, force: true });
  }
  writeFileSync(
    join(directory, "installed.json"),
    JSON.stringify({ packages: entries }, null, 2) + "\n",
  );
  console.log(
    `Installed ${entries.length} verified local archives across ${checked} import routes; tracked dependency files preserved.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifest = process.argv[2] ?? ".local/archives/manifest.json";
  await installLocalArchives(process.cwd(), manifest);
}
