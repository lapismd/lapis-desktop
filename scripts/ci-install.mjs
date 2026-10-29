#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Unpublished packages stay registry ranges in the tracked manifest. */
export const unpublishedRanges = {
  "@lapismd/agent-ui": "../agent-ui/packages/agent-ui",
  "@lapismd/repository-ui": "../agent-ui/packages/repository-ui",
  "@lapis-notes/app-profile": "../lapis-notes/packages/app-profile",
};

const localRange = /^(?:file:|link:|workspace:|git|https?:|[/.])/u;

export function projectUnpublished(manifest, present = () => true) {
  const projected = structuredClone(manifest);
  for (const [name, relative] of Object.entries(unpublishedRanges)) {
    const declared = projected.dependencies?.[name];
    if (typeof declared !== "string" || localRange.test(declared))
      throw Error(`${name} must stay a tracked registry range`);
    if (!present(relative))
      throw Error(`Missing unpublished package at ${relative}`);
    projected.dependencies[name] = `link:${relative}`;
  }
  return projected;
}

function installProjected() {
  const pkgPath = resolve("package.json");
  const lockPath = resolve("pnpm-lock.yaml");
  const originalPkg = readFileSync(pkgPath);
  const originalLock = readFileSync(lockPath);
  const projected = projectUnpublished(
    JSON.parse(originalPkg.toString("utf8")),
    (relative) => existsSync(resolve(relative, "package.json")),
  );
  writeFileSync(pkgPath, JSON.stringify(projected, null, 2) + "\n");
  let status = 1;
  try {
    status =
      spawnSync("pnpm", ["install", "--no-frozen-lockfile"], {
        stdio: "inherit",
      }).status ?? 1;
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
