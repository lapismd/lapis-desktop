#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { verifyArchiveResolution } from "./archive-resolution.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runAudit } from "./ci-audit.mjs";
import { verifyDependencies } from "./ci-dependency-artifact.mjs";

/** Packages awaiting qualified registry releases keep tracked semver ranges. */
export const unpublishedRanges = {
  "@lapis-notes/app-profile": "../lapis-notes/packages/app-profile",
  "@lapismd/ai": "../lapis-ai/packages/ai",
};

const localRange = /^(?:file:|link:|workspace:|git|https?:|[/.])/u;

export function projectUnpublished(
  manifest,
  present = () => true,
  archive = (name) =>
    `.local/ci-packages/${name.replaceAll(/[@/]/gu, "-")}/package.tgz`,
) {
  const projected = structuredClone(manifest);
  for (const [name, relative] of Object.entries(unpublishedRanges)) {
    const section = projected.dependencies?.[name]
      ? "dependencies"
      : "devDependencies";
    const declared = projected[section]?.[name];
    if (typeof declared !== "string" || localRange.test(declared))
      throw Error(`${name} must stay a tracked registry range`);
    if (!present(relative))
      throw Error(`Missing unpublished package at ${relative}`);
    projected[section][name] = `file:${archive(name, relative)}`;
  }
  return projected;
}

function installProjected() {
  const pkgPath = resolve("package.json");
  const lockPath = resolve("pnpm-lock.yaml");
  const originalPkg = readFileSync(pkgPath);
  const originalLock = readFileSync(lockPath);
  const reused = process.env.LAPIS_DESKTOP_CI_DEPENDENCY_ARTIFACT
    ? verifyDependencies(process.env.LAPIS_DESKTOP_CI_DEPENDENCY_ARTIFACT)
    : null;
  const archives = {};
  const projected = projectUnpublished(
    JSON.parse(originalPkg.toString("utf8")),
    (relative) =>
      Boolean(reused) || existsSync(resolve(relative, "package.json")),
    (name, relative) => {
      const target = `.local/ci-packages/${name.replaceAll(/[@/]/gu, "-")}/package.tgz`;
      const directory = resolve(target, "..");
      if (reused) {
        const entry = reused.find((entry) => entry.name === name);
        if (!entry) throw Error(`Missing reusable private artifact: ${name}`);
        mkdirSync(directory, { recursive: true });
        copyFileSync(entry.path, target);
        archives[name] = { path: target, version: entry.version };
        return target;
      }
      rmSync(directory, { recursive: true, force: true });
      mkdirSync(directory, { recursive: true });
      execFileSync(
        "pnpm",
        [
          "--config.ignore-scripts=true",
          "pack",
          "--pack-destination",
          directory,
        ],
        { cwd: resolve(relative), stdio: "pipe" },
      );
      const tarballs = readdirSync(directory).filter((file) =>
        file.endsWith(".tgz"),
      );
      if (tarballs.length !== 1)
        throw Error(`Expected one public archive for ${name}`);
      renameSync(`${directory}/${tarballs[0]}`, resolve(target));
      archives[name] = {
        path: target,
        version: JSON.parse(
          readFileSync(resolve(relative, "package.json"), "utf8"),
        ).version,
      };
      return target;
    },
  );
  const hook = resolve(".local/ci-packages/pnpmfile.cjs");
  mkdirSync(resolve(".local/ci-packages"), { recursive: true });
  const tools = resolve(".local/ci-package-tools");
  mkdirSync(tools, { recursive: true });
  writeFileSync(
    resolve(tools, "package.json"),
    JSON.stringify({ private: true, dependencies: { semver: "7.8.5" } }),
  );
  execFileSync(
    "pnpm",
    [
      "install",
      "--ignore-workspace",
      "--ignore-scripts",
      "--no-frozen-lockfile",
    ],
    { cwd: tools, stdio: "inherit" },
  );
  writeFileSync(
    hook,
    `const semver = require("../ci-package-tools/node_modules/semver");
const { resolve } = require("node:path");
const archives = ${JSON.stringify(archives)};
module.exports = { hooks: { readPackage(pkg) {
  for (const section of ["dependencies", "optionalDependencies"])
    for (const [name, range] of Object.entries(pkg[section] || {})) {
      const artifact = archives[name];
      if (!artifact || range === "file:" + artifact.path) continue;
      const target = "file:" + resolve(__dirname, "../..", artifact.path);
      if (range === target) continue;
      if (!semver.satisfies(artifact.version, range)) throw Error("Incompatible private artifact: " + name + " " + range);
      pkg[section][name] = target;
    }
  return pkg;
} } };
`,
  );
  const projectedText = JSON.stringify(projected, null, 2) + "\n";
  if (reused && reused.projectedPackage !== projectedText)
    throw Error("Reusable dependency projection does not match this manifest");
  writeFileSync(pkgPath, projectedText);
  let status = 1;
  try {
    if (reused) writeFileSync(lockPath, reused.projectedLock);
    status =
      spawnSync(
        "pnpm",
        [
          "install",
          reused ? "--frozen-lockfile" : "--no-frozen-lockfile",
          `--pnpmfile=${hook}`,
        ],
        {
          stdio: "inherit",
        },
      ).status ?? 1;
    if (status === 0) {
      verifyArchiveResolution(
        process.cwd(),
        Object.entries(archives).map(([name, entry]) => ({
          name,
          version: entry.version,
          tarball: entry.path,
        })),
      );
      mkdirSync(resolve(".local/ci-install"), { recursive: true });
      writeFileSync(
        resolve(".local/ci-install/package.json"),
        readFileSync(pkgPath),
      );
      writeFileSync(
        resolve(".local/ci-install/pnpm-lock.yaml"),
        readFileSync(lockPath),
      );
      const sources = JSON.parse(
        readFileSync("scripts/ci-sources.json", "utf8"),
      );
      const receipt = Object.entries(archives).map(([name, entry]) => {
        const bytes = readFileSync(entry.path);
        const source = sources.find(
          (source) => source.name === unpublishedRanges[name].split("/")[1],
        );
        if (!source) throw Error(`Missing pinned source identity for ${name}`);
        return {
          name,
          version: entry.version,
          sourceRepository: source.repository,
          sourceCommit: source.revision,
          size: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      });
      writeFileSync(
        resolve(".local/ci-install/archives.json"),
        JSON.stringify(receipt, null, 2) + "\n",
      );
      if (process.argv.includes("--audit")) {
        status = runAudit();
      }
    }
  } finally {
    writeFileSync(pkgPath, originalPkg);
    writeFileSync(lockPath, originalLock);
  }
  if (status !== 0) process.exit(status);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  installProjected();
