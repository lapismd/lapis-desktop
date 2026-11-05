import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { hash, helpers } from "./contract.mjs";

export const root = process.cwd();
export const ai = resolve("../lapis-ai");
export const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });

export async function requireSourceCI(identity) {
  if (process.env.LAPIS_DESKTOP_TRIAL === "1") {
    if (process.env.GITHUB_WORKFLOW !== "Desktop trial build")
      throw Error("Trial builds require the hosted trial workflow");
    return {
      sourceCommit: identity.sourceCommit,
      ciResult: "trial",
      qualification: "untested-trial",
    };
  }
  const sourceCI = JSON.parse(
    await readFile(".local/release/source-ci.json", "utf8"),
  );
  if (
    sourceCI.sourceCommit !== identity.sourceCommit ||
    sourceCI.ciResult !== "success"
  )
    throw Error("Missing exact-source CI qualification");
  return sourceCI;
}

export async function prepareRuntime({ sign = false } = {}) {
  run(
    "pnpm",
    [
      "dev:cargo",
      "--",
      "build",
      "--release",
      "--locked",
      ...helpers.flatMap((name) => ["-p", name]),
    ],
    ai,
  );
  if (sign)
    for (const name of helpers)
      run("/usr/bin/codesign", [
        "--force",
        "--sign",
        "-",
        join(ai, "target/release", name),
      ]);
  const runtime = join(
    ai,
    "dist",
    `desktop-release-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`,
  );
  run(
    "pnpm",
    ["package:stage", "--", "--profile", "release", "--destination", runtime],
    ai,
  );
  run("pnpm", ["ai:prepare", "--", "--bundle", runtime]);
  return runtime;
}

export async function buildMetadata(
  identity,
  target,
  runtimeManifest,
  extra = {},
) {
  const sourceCI = await requireSourceCI(identity);
  return {
    schemaVersion: 1,
    ...identity,
    target,
    sourceCI,
    configuration: "src-tauri/tauri.preview.conf.json",
    sources: JSON.parse(await readFile("scripts/ci-sources.json", "utf8")),
    privateArchives: JSON.parse(
      await readFile(".local/ci-install/archives.json", "utf8"),
    ),
    registryLockSha256: hash(await readFile("pnpm-lock.yaml")),
    cargoLockSha256: hash(await readFile("src-tauri/Cargo.lock")),
    tools: {
      node: process.version,
      pnpm: execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim(),
      rust: execFileSync("rustc", ["-V"], { encoding: "utf8" }).trim(),
    },
    helperProfile: "release",
    runtimeManifestSha256: hash(await readFile(runtimeManifest)),
    ...extra,
  };
}

export async function writePart(directory, artifact, metadata, bundle) {
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "part.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        artifact,
        metadata: { ...metadata, artifactSha256: artifact.sha256 },
        bundle: {
          ...bundle,
          artifactSha256: artifact.sha256,
          target: artifact.target,
        },
      },
      null,
      2,
    ) + "\n",
  );
}
