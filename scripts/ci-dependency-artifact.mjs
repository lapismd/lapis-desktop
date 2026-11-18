import assert from "node:assert/strict";
import { verifyPackageArchive } from "./package-archive-exports.mjs";
import {
  artifactProvenance,
  verifyArtifactProvenance,
} from "./ci-artifact-provenance.mjs";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { packTasksFixture, tasksPackage } from "./ci-tasks-fixture.mjs";
import {
  buildIdentity,
  digest,
  safePath,
  verifyIdentity,
} from "./ci-artifact-identity.mjs";

export function exportDependencies(directory, root = process.cwd()) {
  directory = resolve(directory);
  assert.ok(
    !existsSync(join(directory, "manifest.json")),
    "Refusing to replace an existing artifact manifest",
  );
  mkdirSync(directory, { recursive: true });
  const receipts = JSON.parse(
    readFileSync(join(root, ".local/ci-install/archives.json")),
  );
  const entries = receipts.map((entry) => {
    const packageDirectory = join(
      root,
      ".local/ci-packages",
      entry.name.replaceAll(/[@/]/gu, "-"),
    );
    const archive = readdirSync(packageDirectory)
      .filter((file) => file.endsWith(".tgz"))
      .map((file) => join(packageDirectory, file));
    assert.equal(
      archive.length,
      1,
      "Expected one verified public package archive",
    );
    assert.equal(digest(readFileSync(archive[0])), entry.sha256);
    const path = `${entry.name.replaceAll(/[@/]/gu, "-")}.tgz`;
    copyFileSync(archive[0], join(directory, path));
    return { ...entry, role: "dependency", path };
  });
  assert.ok(entries.length, "No dependency archives were prepared");
  entries.push(packTasksFixture(directory, root));
  const projection = {};
  for (const [name, path] of [
    ["package", "projected-package.json"],
    ["lock", "projected-lock.yaml"],
  ]) {
    const source = join(
      root,
      ".local/ci-install",
      name === "package" ? "package.json" : "pnpm-lock.yaml",
    );
    const bytes = readFileSync(source);
    copyFileSync(source, join(directory, path));
    projection[name] = { path, sha256: digest(bytes) };
  }
  const manifest = {
    schema: 1,
    provenance: artifactProvenance(root),
    identity: buildIdentity(root),
    entries,
    projection,
  };
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
export function verifyDependencies(selected, root = process.cwd()) {
  const manifestPath = resolve(
    selected.endsWith(".json") ? selected : join(selected, "manifest.json"),
  );
  const manifest = JSON.parse(readFileSync(manifestPath));
  assert.equal(manifest.schema, 1);
  verifyArtifactProvenance(manifest.provenance, root);
  verifyIdentity(manifest.identity, buildIdentity(root));
  const sources = JSON.parse(
    readFileSync(join(root, "scripts/ci-sources.json")),
  );
  const seen = new Set();
  const entries = manifest.entries.map((entry) => {
    const role = entry.role === undefined ? "dependency" : entry.role;
    assert.ok(
      role === "dependency" ||
        (role === "native-fixture" && entry.name === tasksPackage),
      "Unsupported dependency artifact role",
    );
    const identity = JSON.stringify([role, entry.name]);
    assert.ok(!seen.has(identity), "Duplicate dependency artifact");
    seen.add(identity);
    const source = sources.find(
      (source) => source.repository === entry.sourceRepository,
    );
    assert.equal(
      source?.revision,
      entry.sourceCommit,
      "Dependency source revision changed",
    );
    const path = safePath(dirname(manifestPath), entry.path);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, entry.size);
    assert.equal(
      digest(bytes),
      entry.sha256,
      "Dependency artifact digest changed",
    );
    const pkg = verifyPackageArchive(path);
    assert.equal(pkg.name, entry.name);
    assert.equal(pkg.version, entry.version);
    return { ...entry, role, path };
  });
  assert.ok(entries.length, "Empty dependency artifact inventory");
  for (const name of ["package", "lock"]) {
    const projected = manifest.projection?.[name];
    assert.ok(projected, "Missing frozen dependency projection");
    const bytes = readFileSync(safePath(dirname(manifestPath), projected.path));
    assert.equal(
      digest(bytes),
      projected.sha256,
      "Dependency projection digest changed",
    );
    entries[name === "package" ? "projectedPackage" : "projectedLock"] =
      bytes.toString("utf8");
  }
  return entries;
}
/** Verified archives only; a fixture must never satisfy app dependency admission. */
export function selectDependencyArtifact(entries, name) {
  const matches = entries.filter(
    (entry) => entry.name === name && entry.role === "dependency",
  );
  assert.equal(
    matches.length,
    1,
    "Expected exactly one verified dependency artifact",
  );
  return matches[0];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [command, directory] = process.argv.slice(2);
  assert.ok(
    directory && ["export", "verify"].includes(command),
    "Use export|verify <artifact-directory>",
  );
  const result =
    command === "export"
      ? exportDependencies(directory)
      : verifyDependencies(directory);
  console.log(
    `Dependency artifact ${command} completed: ${directory} (${Array.isArray(result) ? result.length : result.entries.length} packages)`,
  );
}
