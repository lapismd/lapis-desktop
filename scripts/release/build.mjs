import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  archiveName,
  createManifest,
  hash,
  helpers,
  hostedMain,
  productName,
  readIdentity,
  target,
} from "./contract.mjs";
import { verifyInstalled } from "./verify-installed.mjs";
hostedMain();
if (process.platform !== "darwin" || process.arch !== "arm64")
  throw Error("Preview packaging requires macOS ARM64");
for (const key of [
  "APPLE_SIGNING_IDENTITY",
  "TAURI_SIGNING_IDENTITY",
  "TAURI_APPLE_SIGNING_IDENTITY",
])
  if (process.env[key] && process.env[key] !== "-")
    throw Error("Preview packaging requires ad-hoc signing");
const identity = readIdentity(),
  root = process.cwd(),
  ai = resolve("../lapis-ai");
const output = resolve(".local/release/candidate");
const sourceCI = JSON.parse(
  await readFile(".local/release/source-ci.json", "utf8"),
);
if (
  sourceCI.sourceCommit !== identity.sourceCommit ||
  sourceCI.ciResult !== "success"
)
  throw Error("Missing exact-source CI qualification");
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });
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
run("pnpm", [
  "exec",
  "tauri",
  "build",
  "--ci",
  "--no-sign",
  "--target",
  target,
  "--bundles",
  "app",
  "--config",
  "src-tauri/tauri.preview.conf.json",
  "--",
  "--locked",
]);
const app = resolve(
  `src-tauri/target/${target}/release/bundle/macos/${productName}.app`,
);
const { verifyBundle } = await import(
  pathToFileURL(join(ai, "scripts/bundle.mjs"))
);
await verifyBundle(join(app, "Contents/Resources/lapis-ai"));
// Nested helper bytes and their inventory are final. Sign only the outer app.
run("/usr/bin/codesign", ["--force", "--sign", "-", app]);
await verifyBundle(join(app, "Contents/Resources/lapis-ai"));
run(process.execPath, ["scripts/check-bundle.mjs", app]);
await mkdir(output, { recursive: true });
const archive = join(output, archiveName(identity.version));
run("/usr/bin/ditto", [
  "-c",
  "-k",
  "--sequesterRsrc",
  "--keepParent",
  app,
  archive,
]);
const manifest = createManifest(identity, await readFile(archive));
verifyInstalled(app, manifest);
await writeFile(
  join(output, "desktop-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
const backlog = await readFile("spec/src/backlog/distribution.md", "utf8");
const limitations = backlog
  .split("## Hosted ARM64 case quarantine")[1]
  ?.split("\n## ")[0]
  ?.trim();
if (!limitations)
  throw Error("Release requires the recorded native RC limitations");
await writeFile(
  join(output, "LIMITATIONS.md"),
  "# Preview qualification limitations\n\n" +
    limitations +
    "\n\nThese cases remain unqualified; enabled exact-source CI gates passed.\n",
);
const metadata = {
  schemaVersion: 1,
  ...identity,
  target,
  configuration: "src-tauri/tauri.preview.conf.json",
  signing: "ad-hoc",
  notarization: "not-performed",
  sourceCI,
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
  runtimeManifestSha256: hash(
    await readFile(
      join(app, "Contents/Resources/lapis-ai/runtime-manifest.toml"),
    ),
  ),
};
await writeFile(
  join(output, "build-metadata.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
await cp(".local/bundle-check.json", join(output, "bundle-check.json"));
console.log(
  `Prepared ${manifest.tag}; install qualification and publication approval remain required.`,
);
