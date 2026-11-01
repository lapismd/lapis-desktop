import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import {
  archiveName,
  createArtifact,
  hash,
  hostedMain,
  identifier,
  productName,
  readIdentity,
} from "./contract.mjs";
import {
  buildMetadata,
  prepareRuntime,
  requireSourceCI,
  run,
  writePart,
} from "./build-common.mjs";
import { bundleFiles } from "./ordinary.mjs";
import {
  linuxBinary,
  linuxDesktop,
  linuxFolder,
  linuxRuntime,
  verifyLinuxBundle,
} from "./verify-linux.mjs";

hostedMain();
if (process.platform !== "linux" || !["arm64", "x64"].includes(process.arch))
  throw Error("Linux packaging requires a native ARM64 or x64 Linux runner");
const target =
  process.arch === "arm64"
    ? "aarch64-unknown-linux-gnu"
    : "x86_64-unknown-linux-gnu";
if (process.env.RELEASE_TARGET !== target)
  throw Error("Linux runner and release target disagree");
const identity = readIdentity();
await requireSourceCI(identity);
await prepareRuntime();
run("pnpm", [
  "exec",
  "tauri",
  "build",
  "--ci",
  "--target",
  target,
  "--no-bundle",
  "--config",
  "src-tauri/tauri.preview.conf.json",
  "--",
  "--locked",
]);
const stage = resolve(`.local/release/linux-stage-${target}`);
const app = join(stage, linuxFolder);
await rm(stage, { recursive: true, force: true });
await mkdir(join(app, "bin"), { recursive: true });
await mkdir(join(app, "lib", productName), { recursive: true });
await mkdir(join(app, "share/applications"), { recursive: true });
await cp(
  `src-tauri/target/${target}/release/lapis-desktop`,
  join(app, linuxBinary),
);
await cp("src-tauri/resources/lapis-ai", join(app, linuxRuntime), {
  recursive: true,
});
await cp(
  "src-tauri/icons/icon.png",
  join(app, "share/lapis-notes-preview.png"),
);
await writeFile(
  join(app, linuxDesktop),
  [
    "[Desktop Entry]",
    "Version=1.0",
    "Type=Application",
    `Name=${productName}`,
    "Comment=Preview desktop workspace for Markdown notes",
    "Exec=lapis-notes-preview %U",
    "Icon=lapis-notes-preview",
    "Terminal=false",
    "Categories=Office;",
    `StartupWMClass=${identifier}`,
    `X-Lapis-Identifier=${identifier}`,
    `X-Lapis-Version=${identity.version}`,
    "",
  ].join("\n"),
);
const runtimeManifest = join(app, linuxRuntime, "runtime-manifest.toml");
const files = await Promise.all(
  bundleFiles(app).map(async (file) => {
    const bytes = await readFile(file);
    return {
      path: relative(app, file),
      size: bytes.length,
      sha256: hash(bytes),
    };
  }),
);
await writeFile(
  join(app, "release-identity.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      ...identity,
      identifier,
      productName,
      target,
      helperProfile: "release",
      minimumUbuntu: "24.04",
      minimumGlibc: "2.39",
      runtimeManifestSha256: hash(await readFile(runtimeManifest)),
      files,
    },
    null,
    2,
  ) + "\n",
);
const report = verifyLinuxBundle(app, identity, target);
run("desktop-file-validate", [join(app, linuxDesktop)]);
const output = resolve(`.local/release/parts/${target}`);
await mkdir(output, { recursive: true });
const archive = join(output, archiveName(identity.version, target));
run("tar", ["-czf", archive, "-C", stage, linuxFolder]);
const artifact = createArtifact(identity, await readFile(archive), target);
const metadata = await buildMetadata(identity, target, runtimeManifest, {
  signing: "not-applicable",
  minimumUbuntu: "24.04",
  minimumGlibc: "2.39",
});
await writePart(output, artifact, metadata, {
  ...report,
  result: "pass",
  architectures: process.arch,
  normalAutomationMarkers: 0,
});
console.log(
  `Built complete Linux preview ${target}; Homebrew qualification remains required.`,
);
