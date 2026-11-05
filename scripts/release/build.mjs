import { readFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  archiveName,
  createManifest,
  hostedMain,
  productName,
  readIdentity,
  target,
} from "./contract.mjs";
import { verifyInstalled } from "./verify-installed.mjs";
import {
  ai,
  buildMetadata,
  prepareRuntime,
  requireSourceCI,
  run,
  writePart,
} from "./build-common.mjs";
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
const identity = readIdentity();
const output = resolve(`.local/release/parts/${target}`);
await requireSourceCI(identity);
await prepareRuntime({ sign: true });
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
// Deep ad-hoc signature covers nested frameworks so macOS can launch without a Developer ID.
run("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", app]);
await verifyBundle(join(app, "Contents/Resources/lapis-ai"));
// Outer signature last, without rewriting nested helper bytes.
run("/usr/bin/codesign", ["--force", "--sign", "-", app]);
await verifyBundle(join(app, "Contents/Resources/lapis-ai"));
run("/usr/bin/xattr", ["-cr", app]);
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
const metadata = await buildMetadata(
  identity,
  target,
  join(app, "Contents/Resources/lapis-ai/runtime-manifest.toml"),
  { signing: "ad-hoc", notarization: "not-performed" },
);
const bundle = JSON.parse(await readFile(".local/bundle-check.json", "utf8"));
await writePart(output, manifest.artifacts[0], metadata, bundle);
console.log(
  `Built macOS preview ${manifest.tag}; Homebrew qualification remains required.`,
);
