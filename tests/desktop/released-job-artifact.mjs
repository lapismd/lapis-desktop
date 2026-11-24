import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  artifactPaths,
  assertTaskHostModules,
} from "./tasks-installed-assets.mjs";
import { pluginImportMap } from "../../scripts/plugin-host-modules.ts";

// Filled only after the release publisher verifies the signed, uploaded bytes.
export const releasedTasks = {
  version: "0.4.0",
  url: "https://github.com/lapismd/lapis-plugin-tasks/releases/download/%40lapis-notes/lapis-plugin-tasks%400.4.0/tasks-0.4.0.lapis-plugin",
  sha256: "04953bda8012f50263ac2224a649a64d0892a43b0a70cd6d92132985af2eee3b",
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Deploy unchanged released bytes; installation-signature acceptance is separate. */
export async function installReleasedTasks(root, vault) {
  assert.match(releasedTasks.sha256, /^[a-f0-9]{64}$/);
  const response = await fetch(releasedTasks.url, {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.ok, true, `Release download: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(digest(bytes), releasedTasks.sha256);
  const archive = join(root, "released-tasks.lapis-plugin");
  writeFileSync(archive, bytes);
  const target = join(vault, ".lapis/plugins/tasks");
  mkdirSync(target, { recursive: true });
  execFileSync("python3", [
    "-c",
    "import pathlib,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert all(not pathlib.PurePosixPath(n).is_absolute() and '..' not in pathlib.PurePosixPath(n).parts and '\\\\' not in n for n in z.namelist()); z.extractall(sys.argv[2])",
    archive,
    target,
  ]);
  const manifest = JSON.parse(
    readFileSync(join(target, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.id, "tasks");
  assert.equal(manifest.version, releasedTasks.version);
  assertTaskHostModules(
    manifest.lapis.runtime.entries.workspace.sharedDependencies,
    pluginImportMap.imports,
  );
  assert.equal(
    digest(readFileSync(join(target, "jobs/overdue-digest.js"))),
    "fa4157da9fbabe9c55fd7d34860bb6de4da085fa9c236441fe54a370429b0c27",
  );
  const files = artifactPaths(target).map((path) => {
    const bytes = readFileSync(join(target, path));
    return { path, size: bytes.length, sha256: digest(bytes) };
  });
  writeFileSync(
    join(vault, ".lapis/installed-plugins.json"),
    JSON.stringify({
      schemaVersion: 1,
      plugins: {
        tasks: {
          pluginId: "tasks",
          installedVersion: releasedTasks.version,
          provenance: "development",
          files,
        },
      },
    }),
  );
  writeFileSync(join(vault, ".lapis/community-plugins.json"), '["tasks"]');
}
