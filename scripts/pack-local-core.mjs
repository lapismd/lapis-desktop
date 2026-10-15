import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const args = process.argv.slice(2);
const alreadyBuilt = args.includes("--already-built");
const sourceArgument = args.find((value) => !value.startsWith("--"));
assert.ok(
  args.every(
    (value) => value === sourceArgument || value === "--already-built",
  ),
  "Unexpected pack argument",
);
const sourceRoot = sourceArgument && resolve(sourceArgument);
assert.ok(
  sourceRoot,
  "Usage: pnpm local:pack /path/to/verified/lapis-notes-workspace",
);
function jj(...args) {
  return execFileSync("jj", ["--no-pager", ...args], {
    cwd: sourceRoot,
    encoding: "utf8",
  }).trim();
}
const sourceRevision = jj("diff", "--name-only") ? "@" : "@-";
const revision = jj(
  "log",
  "-r",
  sourceRevision,
  "--no-graph",
  "-T",
  "commit_id",
);
assert.match(revision, /^[a-f0-9]{40}$/u);
const directory = resolve(".local/archives/packed");
mkdirSync(directory, { recursive: true });
const packages = [];
for (const name of [
  "ui",
  "api",
  "language-service",
  "file-explorer",
  "workspace",
]) {
  const packageRoot = join(sourceRoot, "packages", name);
  const manifest = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  await new Promise((resolvePack, reject) => {
    const packArgs = [
      "pack",
      ...(alreadyBuilt ? ["--config.ignore-scripts=true"] : []),
      "--pack-destination",
      directory,
    ];
    const child = spawn("pnpm", packArgs, {
      cwd: packageRoot,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      code === 0
        ? resolvePack()
        : reject(
            new Error(`Packing ${manifest.name} failed (${signal ?? code})`),
          ),
    );
  });
  const filename = `${manifest.name.replace(/^@/u, "").replaceAll("/", "-")}-${manifest.version}.tgz`;
  const tarball = join(directory, filename);
  packages.push({
    name: manifest.name,
    version: manifest.version,
    tarball: `packed/${basename(tarball)}`,
    sha256: createHash("sha256").update(readFileSync(tarball)).digest("hex"),
    source: {
      repository: manifest.repository.url,
      revision,
      packageDirectory: `packages/${name}`,
    },
  });
}
assert.equal(
  jj("diff", "--from", revision, "--to", "@", "--name-only"),
  "",
  "Packing changed tracked source; verify generated changes, then repack.",
);
writeFileSync(
  resolve(".local/archives/manifest.json"),
  JSON.stringify({ version: 1, packages }, null, 2) + "\n",
);
console.log(
  `Packed ${packages.length} source-owned archives at ${revision}; no packages published.`,
);
