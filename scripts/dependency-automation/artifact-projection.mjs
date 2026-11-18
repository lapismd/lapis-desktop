import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parseDocument } from "yaml";

// Independently qualified against this reviewed shared data contract; never imported at runtime.
export const reviewedProjectionSource =
  "c4b54f932cd4239d9a8f0b3e1fb327f28b63dfb2";
export const projectionSourceInputs = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "scripts/ci-sources.json",
  ".github/ci-docs/package.json",
];
const descriptorPath = ".github/dependency-automation/artifact-projection.json";
const sdk = "@lapismd/spec-validator",
  selected = "<selected>";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = () => {
  throw Error(
    "Desktop SDK projection: immutable source shape or descriptor mismatch",
  );
};
const keys = (value, expected) =>
  value &&
  !Array.isArray(value) &&
  isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort());
const ordered = (value) =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, ordered(value[key])]),
        )
      : value;
const yaml = (text) => {
  const document = parseDocument(text);
  if (document.errors.length || document.warnings.length) fail();
  return document.toJS();
};
export function verifyArtifactProjection({ files, descriptorBytes }) {
  if (
    typeof descriptorBytes !== "string" ||
    Buffer.byteLength(descriptorBytes) > 8192
  )
    fail();
  yaml(descriptorBytes);
  const descriptor = JSON.parse(descriptorBytes);
  if (
    !keys(descriptor, [
      "schemaVersion",
      "kind",
      "repository",
      "dependency",
      "immutableShapeSha256",
    ]) ||
    descriptor.schemaVersion !== 1 ||
    descriptor.kind !== "seeded-sdk-development-lock" ||
    descriptor.repository !== "lapismd/lapis-desktop" ||
    descriptor.dependency !== sdk ||
    !/^[a-f0-9]{64}$/.test(descriptor.immutableShapeSha256)
  )
    fail();
  for (const path of projectionSourceInputs)
    if (
      typeof files[path] !== "string" ||
      Buffer.byteLength(files[path]) > 2 * 1024 * 1024
    )
      fail();
  yaml(files["package.json"]);
  const manifest = JSON.parse(files["package.json"]),
    workspace = yaml(files["pnpm-workspace.yaml"]),
    lock = yaml(files["pnpm-lock.yaml"]);
  const version = manifest.devDependencies?.[sdk],
    entry = lock.importers?.["."]?.devDependencies?.[sdk];
  const identity = `${sdk}@${version}`,
    definition = lock.packages?.[identity],
    snapshot = lock.snapshots?.[identity];
  if (
    manifest.name !== "@lapismd/lapis-desktop" ||
    manifest.private !== true ||
    manifest.packageManager !== "pnpm@10.34.5" ||
    !/^0\.2\.\d+$/.test(version ?? "") ||
    !keys(entry, ["specifier", "version"]) ||
    entry.specifier !== version ||
    entry.version !== version ||
    workspace.overrides?.[sdk] !== version ||
    lock.overrides?.[sdk] !== version ||
    ["dependencies", "peerDependencies", "optionalDependencies"].some((type) =>
      Object.hasOwn(manifest[type] ?? {}, sdk),
    ) ||
    !keys(definition?.resolution, ["integrity"]) ||
    !/^sha512-[A-Za-z0-9+/]{86}==$/.test(definition.resolution.integrity) ||
    !keys(snapshot, ["dependencies"]) ||
    !keys(snapshot.dependencies, ["jiti", "typescript"])
  )
    fail();
  if (
    Object.keys(lock.packages).filter((key) => key.startsWith(sdk + "@"))
      .length !== 1 ||
    Object.keys(lock.snapshots).filter((key) => key.startsWith(sdk + "@"))
      .length !== 1
  )
    fail();
  manifest.devDependencies[sdk] = selected;
  workspace.overrides[sdk] = selected;
  lock.overrides[sdk] = selected;
  lock.importers["."].devDependencies[sdk] = {
    specifier: selected,
    version: selected,
  };
  const frozenKey = `${sdk}@${selected}`;
  lock.packages[frozenKey] = definition;
  delete lock.packages[identity];
  definition.resolution.integrity = selected;
  lock.snapshots[frozenKey] = snapshot;
  delete lock.snapshots[identity];
  const shapeSha256 = hash(
    JSON.stringify(
      ordered({
        manifest,
        workspace,
        lock,
        privateInventorySha256: hash(files["scripts/ci-sources.json"]),
        ciDocsManifestSha256: hash(files[".github/ci-docs/package.json"]),
      }),
    ),
  );
  if (shapeSha256 !== descriptor.immutableShapeSha256) fail();
  return {
    shapeSha256,
    descriptorSha256: hash(descriptorBytes),
    reviewedSource: reviewedProjectionSource,
  };
}
export function checkArtifactProjection(root = process.cwd()) {
  const read = (path) => {
    const target = resolve(root, path),
      stat = lstatSync(target);
    if (
      !stat.isFile() ||
      realpathSync(target) !== target ||
      stat.size > (path === descriptorPath ? 8192 : 2 * 1024 * 1024)
    )
      fail();
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      readFileSync(target),
    );
  };
  return verifyArtifactProjection({
    files: Object.fromEntries(
      projectionSourceInputs.map((path) => [path, read(path)]),
    ),
    descriptorBytes: read(descriptorPath),
  });
}
