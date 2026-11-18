import { createHash } from "node:crypto";
import { readFileSync, realpathSync, lstatSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const projectedAuditSourceInputs = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts/ci-sources.json",
  "scripts/validation/native-sources.mjs",
  "scripts/ci-install.mjs",
  "scripts/ci-audit.mjs",
  "scripts/archive-resolution.mjs",
  "scripts/archive-hook.mjs",
  "scripts/ci-dependency-artifact.mjs",
  "scripts/ci-artifact-identity.mjs",
  "scripts/ci-artifact-provenance.mjs",
  "scripts/dependency-automation/projected-audit-context.mjs",
  "scripts/dependency-automation/projected-audit-admission.mjs",
  ".github/dependency-automation/artifact-projection.json",
  ".github/ci-docs/package.json",
  "scripts/dependency-automation/artifact-projection.mjs",
  "scripts/dependency-automation/check-canonical-intake.mjs",
  "scripts/dependency-automation/source-intake-reader.mjs",
  "scripts/dependency-automation/maintenance-note.mjs",
];
export function projectedAuditContext({
  root = process.cwd(),
  portableManifest,
  portableLock,
  archives,
  decision,
  git = execFileSync,
}) {
  const run = (args) =>
    git("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
  const read = (path) => {
    const target = resolve(root, path);
    if (realpathSync(target) !== target || !lstatSync(target).isFile())
      throw Error("Unsafe projected audit source");
    return readFileSync(target);
  };
  const inputs = Object.fromEntries(
    projectedAuditSourceInputs.map((path) => {
      const bytes =
        path === "package.json"
          ? portableManifest
          : path === "pnpm-lock.yaml"
            ? portableLock
            : read(path);
      if (
        !Buffer.from(run(["show", "HEAD:" + path])).equals(Buffer.from(bytes))
      )
        throw Error("Uncommitted projected audit input: " + path);
      return [path, hash(bytes)];
    }),
  );
  const sourceSha = run([
    "log",
    "-1",
    "--format=%H",
    "--",
    ...projectedAuditSourceInputs,
  ]).trim();
  const projectedManifest = read("package.json"),
    projectedLock = read("pnpm-lock.yaml");
  const normalizedArchives = archives
    .map(({ name, version, sourceRepository, sourceCommit, sha256, size }) => ({
      name,
      version,
      sourceRepository,
      sourceCommit,
      sha256,
      size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const record = read(decision.record);
  if (!Buffer.from(run(["show", "HEAD:" + decision.record])).equals(record))
    throw Error("Uncommitted projected audit decision record");
  return {
    sourceSha,
    sourceInputsSha256: hash(JSON.stringify(inputs)),
    portableManifestSha256: hash(portableManifest),
    portableLockSha256: hash(portableLock),
    workspaceSha256: inputs["pnpm-workspace.yaml"],
    sourceInventorySha256: inputs["scripts/ci-sources.json"],
    projection: {
      platform: process.platform + "-" + process.arch,
      manifestSha256: hash(projectedManifest),
      lockSha256: hash(projectedLock),
      archivesSha256: hash(JSON.stringify(normalizedArchives)),
    },
    projectedManifest: JSON.parse(projectedManifest),
    recordPresent: Boolean(record.length),
    recordSha256: hash(record),
  };
}
