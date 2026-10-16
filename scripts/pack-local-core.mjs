import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const args = process.argv.slice(2);
const notesRoot = args.shift();
assert.ok(
  notesRoot && !notesRoot.startsWith("--"),
  "Pass the verified Notes workspace first",
);
const sources = [
  {
    root: resolve(notesRoot),
    prefix: "@lapis-notes/",
    names: ["ui", "api", "language-service", "file-explorer", "workspace"],
  },
];
let alreadyBuilt = false;
const selected = new Set();
while (args.length) {
  const option = args.shift();
  assert.ok(!selected.has(option), `Duplicate pack option: ${option}`);
  selected.add(option);
  if (option === "--already-built") {
    alreadyBuilt = true;
    continue;
  }
  assert.ok(
    ["--mira", "--plugins"].includes(option),
    `Unexpected pack argument: ${option}`,
  );
  const root = args.shift();
  assert.ok(
    root && !root.startsWith("--"),
    `Missing source workspace for ${option}`,
  );
  sources.push({
    root: resolve(root),
    prefix: option === "--mira" ? "@lapismd/" : "@lapis-notes/",
    names:
      option === "--mira"
        ? ["mira", "mira-editor", "mira-plugin-ai", "mira-plugin-mermaid"]
        : ["markdown"],
  });
}
function jj(sourceRoot, ...args) {
  return execFileSync("jj", ["--no-pager", ...args], {
    cwd: sourceRoot,
    encoding: "utf8",
  }).trim();
}
const directory = resolve(".local/archives/packed");
mkdirSync(directory, { recursive: true });
const packages = [];
for (const source of sources) await packSource(source);
writeFileSync(
  resolve(".local/archives/manifest.json"),
  JSON.stringify({ version: 1, packages }, null, 2) + "\n",
);
console.log(
  `Packed ${packages.length} source-owned archives; no packages published.`,
);

async function packSource({ root: sourceRoot, prefix, names }) {
  const sourceRevision = jj(sourceRoot, "diff", "--name-only") ? "@" : "@-";
  const revision = jj(
    sourceRoot,
    "log",
    "-r",
    sourceRevision,
    "--no-graph",
    "-T",
    "commit_id",
  );
  assert.match(revision, /^[a-f0-9]{40}$/u);
  for (const name of names)
    await packPackage(sourceRoot, name, prefix, revision);
  assert.equal(
    jj(sourceRoot, "diff", "--from", revision, "--to", "@", "--name-only"),
    "",
    "Packing changed tracked source; verify generated changes, then repack.",
  );
}

async function packPackage(sourceRoot, name, prefix, revision) {
  const packageRoot = join(sourceRoot, "packages", name);
  const manifest = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  assert.equal(
    manifest.name,
    `${prefix}${name}`,
    "Unexpected source-owned package identity",
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
