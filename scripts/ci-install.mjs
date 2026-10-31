#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { verifyArchiveResolution } from "./archive-resolution.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runAudit } from "./ci-audit.mjs";

/** Packages awaiting qualified registry releases keep tracked semver ranges. */
export const unpublishedRanges = {
  "@lapis-notes/app-profile": "../lapis-notes/packages/app-profile",
  "@lapismd/ai": "../lapis-ai/packages/ai",
  "@lapismd/jj-conversations": "../jj-store/packages/jj-conversations",
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
  const archives = {};
  const projected = projectUnpublished(
    JSON.parse(originalPkg.toString("utf8")),
    (relative) => existsSync(resolve(relative, "package.json")),
    (name, relative) => {
      const directory = resolve(
        ".local/ci-packages",
        name.replaceAll(/[@/]/gu, "-"),
      );
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
      const path = `${directory}/${tarballs[0]}`;
      archives[name] = {
        path,
        version: JSON.parse(
          readFileSync(resolve(relative, "package.json"), "utf8"),
        ).version,
      };
      return path;
    },
  );
  const hook = resolve(".local/ci-packages/pnpmfile.cjs");
  const semver = createRequire(resolve("../lapis-notes/package.json")).resolve(
    "semver",
  );
  writeFileSync(
    hook,
    `const semver = require(${JSON.stringify(semver)});
const archives = ${JSON.stringify(archives)};
module.exports = { hooks: { readPackage(pkg) {
  for (const section of ["dependencies", "optionalDependencies"])
    for (const [name, range] of Object.entries(pkg[section] || {})) {
      const artifact = archives[name];
      if (!artifact || range === "file:" + artifact.path) continue;
      if (!semver.satisfies(artifact.version, range)) throw Error("Incompatible private artifact: " + name + " " + range);
      pkg[section][name] = "file:" + artifact.path;
    }
  return pkg;
} } };
`,
  );
  writeFileSync(pkgPath, JSON.stringify(projected, null, 2) + "\n");
  let status = 1;
  try {
    status =
      spawnSync(
        "pnpm",
        ["install", "--no-frozen-lockfile", `--pnpmfile=${hook}`],
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
