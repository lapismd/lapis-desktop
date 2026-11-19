import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  readdirSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function safePath(root, path) {
  assert.ok(typeof path === "string" && path && !isAbsolute(path));
  const result = resolve(root, path);
  const rel = relative(resolve(root), result);
  assert.ok(
    rel && rel !== ".." && !rel.startsWith(".." + sep),
    "Artifact path escapes its root",
  );
  return result;
}
export function inventory(root, path = "") {
  return readdirSync(join(root, path), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const name = path ? `${path}/${entry.name}` : entry.name;
      const file = join(root, name),
        stat = lstatSync(file);
      if (stat.isDirectory()) return inventory(root, name);
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(file);
        safePath(root, relative(root, resolve(root, path, target)));
        return [{ path: name, link: target }];
      }
      assert.ok(stat.isFile(), "Unsupported artifact file type");
      return [
        {
          path: name,
          size: stat.size,
          mode: stat.mode & 0o777,
          sha256: digest(readFileSync(file)),
        },
      ];
    });
}
export function verifyFiles(root, files) {
  assert.deepEqual(
    inventory(root),
    files,
    "Artifact files, permissions or digests changed",
  );
}

function sourceIdentity(root, run) {
  if (existsSync(join(root, ".git"))) {
    const sourceCommit = run("git", ["rev-parse", "HEAD"]);
    return {
      sourceCommit,
      sourceTree: run("git", ["rev-parse", "HEAD^{tree}"]),
      files: run("git", ["ls-files", "-z"]).split("\0").filter(Boolean),
    };
  }
  const workspaceRepository = join(root, ".jj/repo");
  if (!existsSync(workspaceRepository))
    throw Error("Artifact identity requires a Git or Jujutsu checkout");
  const repository = resolve(
    dirname(workspaceRepository),
    readFileSync(workspaceRepository, "utf8").trim(),
  );
  const store = join(repository, "store");
  const gitDirectory = resolve(
    store,
    readFileSync(join(store, "git_target"), "utf8").trim(),
  );
  const sourceCommit = run("jj", [
    "--no-pager",
    "log",
    "-r",
    "@",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
  return {
    sourceCommit,
    sourceTree: run("git", [
      `--git-dir=${gitDirectory}`,
      "rev-parse",
      `${sourceCommit}^{tree}`,
    ]),
    files: run("jj", ["file", "list", "-T", 'path ++ "\\0"'])
      .split("\0")
      .filter(Boolean),
  };
}

export function buildIdentity(root = process.cwd(), kind = "dependencies") {
  const run = (command, args) =>
    execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  const inputs = [
    "scripts/ci-sources.json",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".node-version",
    "scripts/ci-install.mjs",
    "scripts/ci-prepare-links.mjs",
    "scripts/ci-tasks-fixture.mjs",
    "scripts/ci-dependency-artifact.mjs",
    "scripts/ci-artifact-identity.mjs",
    "scripts/ci-artifact-provenance.mjs",
    "scripts/package-archive-exports.mjs",
  ];
  if (kind === "acceptance")
    inputs.push(
      "rust-toolchain.toml",
      "src-tauri/Cargo.toml",
      "src-tauri/Cargo.lock",
      "src-tauri/tauri.conf.json",
      "src-tauri/tauri.e2e.conf.json",
    );
  const identity = {
    kind,
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    packageManager: JSON.parse(readFileSync(join(root, "package.json")))
      .packageManager,
    inputs: Object.fromEntries(
      inputs.map((file) => [file, digest(readFileSync(join(root, file)))]),
    ),
  };
  if (kind === "acceptance") {
    identity.variant = "debug-e2e";
    identity.rust = run("rustc", ["--version"]);
    if (process.platform === "darwin")
      identity.appleTools = {
        xcode: run("xcodebuild", ["-version"]),
        sdk: run("xcrun", ["--sdk", "macosx", "--show-sdk-version"]),
      };
    identity.deploymentTarget = JSON.parse(
      readFileSync(join(root, "src-tauri/tauri.conf.json")),
    ).bundle.macOS.minimumSystemVersion;
    const source = sourceIdentity(root, run);
    identity.sourceCommit = source.sourceCommit;
    identity.sourceTree = source.sourceTree;
    const files = source.files.sort();
    identity.checkoutDigest = digest(
      Buffer.concat(
        files.flatMap((file) => [
          Buffer.from(file + "\0"),
          readFileSync(join(root, file)),
        ]),
      ),
    );
  }
  return identity;
}
export function verifyIdentity(actual, expected) {
  assert.deepEqual(
    actual,
    expected,
    "Artifact build identity does not match this checkout/toolchain",
  );
}
