import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { digest } from "./ci-artifact-identity.mjs";

export const tasksPackage = "@lapis-notes/lapis-plugin-tasks";
/** This pin is an installed-plugin fixture, never a replacement for the app's registry dependency. */
export function packTasksFixture(directory, root = process.cwd()) {
  directory = resolve(directory);
  const source = JSON.parse(
    readFileSync(join(root, "scripts/ci-sources.json")),
  ).find((entry) => entry.name === "lapis-plugin-tasks");
  assert.ok(source, "Missing pinned Tasks fixture source");
  const workspace = resolve(root, "../lapis-plugin-tasks");
  assert.deepEqual(
    JSON.parse(readFileSync(join(workspace, ".desktop-ci-source.json"))),
    source,
    "Tasks fixture source is not the prepared pin",
  );
  assert.ok(
    existsSync(join(workspace, "dist/index.js")),
    "Build the pinned Tasks public exports before exporting native fixtures",
  );
  const pkg = JSON.parse(readFileSync(join(workspace, "package.json")));
  assert.equal(pkg.name, tasksPackage);
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, "native-tasks.tgz");
  assert.ok(
    !existsSync(destination),
    "Refusing to replace a retained Tasks fixture archive",
  );
  execFileSync(
    "pnpm",
    ["--config.ignore-scripts=true", "pack", "--pack-destination", directory],
    { cwd: workspace, stdio: "pipe" },
  );
  const packed = readdirSync(directory).filter(
    (name) =>
      name.endsWith(".tgz") &&
      name.startsWith("lapis-notes-lapis-plugin-tasks-"),
  );
  assert.equal(
    packed.length,
    1,
    "Expected exactly one pinned Tasks public archive",
  );
  renameSync(join(directory, packed[0]), destination);
  assertTasksExports(destination);
  const bytes = readFileSync(destination);
  return {
    role: "native-fixture",
    name: pkg.name,
    version: pkg.version,
    path: "native-tasks.tgz",
    sourceRepository: source.repository,
    sourceCommit: source.revision,
    size: bytes.length,
    sha256: digest(bytes),
  };
}
export function assertTasksExports(archive) {
  const files = execFileSync("tar", ["-tzf", archive], {
    encoding: "utf8",
  }).split("\n");
  assert.ok(
    files.includes("package/dist/index.js"),
    "Pinned Tasks fixture archive is missing built public exports",
  );
}
export function selectTasksFixture(entries, root = process.cwd()) {
  const entry = entries.find(
    (entry) => entry.name === tasksPackage && entry.role === "native-fixture",
  );
  assert.ok(
    entry,
    "Verified package artifact is missing the pinned Tasks fixture",
  );
  assertTasksExports(entry.path);
  const source = JSON.parse(
    readFileSync(join(root, "scripts/ci-sources.json")),
  ).find((source) => source.name === "lapis-plugin-tasks");
  assert.equal(entry.sourceCommit, source?.revision);
  return {
    name: entry.name,
    version: entry.version,
    path: entry.path,
    sha256: entry.sha256,
    source,
  };
}
