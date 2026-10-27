import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

export const taskPackageName = "@lapis-notes/lapis-plugin-tasks";
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

export function assertTaskHostModules(shared, imports) {
  for (const id of shared)
    assert.ok(Object.hasOwn(imports, id), `Unavailable host module ${id}`);
  assert.ok(
    shared.includes("@lapis-notes/api/native-tasks"),
    "Tasks artifact must use the public native port",
  );
}

export function artifactPaths(directory, base = directory) {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    assert.equal(
      entry.isSymbolicLink(),
      false,
      `Symbolic artifact resource ${path}`,
    );
    if (entry.isDirectory()) paths.push(...artifactPaths(path, base));
    else {
      assert.ok(entry.isFile(), `Unexpected artifact resource ${path}`);
      paths.push(path.slice(base.length + 1));
    }
  }
  return paths.sort();
}

/** The existing signed-distribution fixture consumes these unchanged bytes. */
export function readTasksArtifact(directory) {
  const receipt = JSON.parse(
    readFileSync(join(dirname(directory), "provenance.json"), "utf8"),
  );
  assert.equal(receipt.schema, 1);
  assert.equal(receipt.package.name, taskPackageName);
  assert.match(receipt.package.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    artifactPaths(directory),
    receipt.files.map((file) => file.path).sort(),
    "Unexpected or missing artifact resource",
  );
  const files = {};
  for (const file of receipt.files) {
    assert.ok(
      !/^[\\/]|[:\0]/.test(file.path) &&
        file.path
          .split(/[\\/]/)
          .every((part) => part && part !== "." && part !== ".."),
      "Invalid artifact resource path",
    );
    const path = join(directory, file.path);
    assert.ok(lstatSync(path).isFile(), "Expected a regular artifact resource");
    const bytes = readFileSync(path);
    assert.equal(
      bytes.length,
      file.size,
      `Changed resource size: ${file.path}`,
    );
    assert.equal(
      digest(bytes),
      file.sha256,
      `Changed resource hash: ${file.path}`,
    );
    files[file.path] = bytes;
  }
  for (const name of ["main.mjs", "styles.css", "manifest.json"])
    assert.ok(files[name]?.length, `Missing Task resource ${name}`);
  const manifest = JSON.parse(files["manifest.json"]);
  assert.equal(manifest.id, "tasks");
  assert.equal(manifest.version, receipt.package.version);
  const workspace = manifest.lapis.runtime.entries.workspace;
  assert.equal(workspace.path, "main.mjs");
  assert.equal(workspace.format, "esm");
  assert.ok(
    workspace.sharedDependencies.includes("@lapis-notes/api/native-tasks"),
  );
  return { version: manifest.version, files, source: receipt.package };
}
