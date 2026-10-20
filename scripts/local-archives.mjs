import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import semver from "semver";
import { verifyArchiveResolution } from "./archive-resolution.mjs";
export { verifyArchiveResolution } from "./archive-resolution.mjs";

const require = createRequire(import.meta.url);
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
export function archiveHookSource(entries, localProjects = []) {
  const packages = entries.map(({ name, version, tarball }) => [
    name,
    { version, tarball },
  ]);
  return `const semver = require(${JSON.stringify(require.resolve("semver"))});
const archives = new Map(${JSON.stringify(packages)});
const localProjects = new Set(${JSON.stringify(localProjects)});
module.exports = { hooks: { readPackage(pkg) {
  const fields = ["dependencies", "optionalDependencies", "peerDependencies"];
  if (localProjects.has(pkg.name)) fields.push("devDependencies");
  for (const field of fields) {
    for (const [name, entry] of archives) {
      const range = pkg[field]?.[name];
      if (!range) continue;
      const target = "file:" + entry.tarball;
      if (field !== "peerDependencies" && range === target) continue;
      if (!semver.satisfies(entry.version, range, { includePrerelease: true }))
        throw new Error(name + " archive " + entry.version + " does not satisfy " + range);
      if (field === "peerDependencies") {
        // Give peer-only workspace consumers the same verified package identity.
        pkg.dependencies ??= {};
        pkg.dependencies[name] = target;
      } else pkg[field][name] = target;
    }
  }
  return pkg;
} } };\n`;
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
