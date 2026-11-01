#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { validateManifest } from "./contract.mjs";
import { verifyInstalled } from "./verify-installed.mjs";
if (
  process.platform !== "darwin" ||
  process.arch !== "arm64" ||
  process.env.GITHUB_ACTIONS !== "true" ||
  !homedir().startsWith("/Users/runner")
)
  throw Error(
    "Installed-app smoke requires an ephemeral macOS ARM64 GitHub runner",
  );
const { values } = parseArgs({
  options: {
    app: { type: "string" },
    manifest: { type: "string" },
    output: { type: "string" },
  },
});
if (!values.app || !values.manifest || !values.output)
  throw Error("Require --app, --manifest and --output");
const manifest = validateManifest(
  JSON.parse(await readFile(values.manifest, "utf8")),
);
const artifact = manifest.artifacts.find(
  (a) => a.target === "aarch64-apple-darwin",
);
const report = verifyInstalled(resolve(values.app), manifest);
const native = JSON.parse(
  execFileSync(
    "/usr/bin/swift",
    [
      fileURLToPath(new URL("window-probe.swift", import.meta.url)),
      resolve(values.app),
    ],
    {
      encoding: "utf8",
      timeout: 180000,
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    },
  ),
);
await mkdir(dirname(resolve(values.output)), { recursive: true });
await writeFile(
  values.output,
  JSON.stringify(
    {
      ok: true,
      sourceCommit: manifest.sourceCommit,
      target: artifact.target,
      artifactSha256: artifact.sha256,
      ...report,
      ...native,
      boundary:
        "Installed ordinary bundle launch/window/quit; full feature acceptance is the separate exact-source CI run",
    },
    null,
    2,
  ) + "\n",
);
