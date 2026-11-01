import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
export const repository = "lapismd/lapis-desktop";
export const identifier = "com.lapismd.lapis-desktop.preview";
export const productName = "Lapis Notes Preview";
export const target = "aarch64-apple-darwin";
export const helpers = [
  "lapis-acp",
  "lapis-agent",
  "lapis-agent-tools",
  "lapis-compute",
];
export const versionPattern =
  /^(20\d{2})\.(0|[1-9]\d*)\.(0|[1-9]\d*)-rc\.([1-9]\d*)$/;
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const archiveName = (version) =>
  `Lapis-Notes-Preview-${version}-macos-arm64.zip`;
export function readIdentity(root = process.cwd()) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const config = JSON.parse(
    readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf8"),
  );
  const overlay = JSON.parse(
    readFileSync(join(root, "src-tauri/tauri.preview.conf.json"), "utf8"),
  );
  const cargo = readFileSync(join(root, "src-tauri/Cargo.toml"), "utf8").match(
    /^version = "([^"]+)"/m,
  )?.[1];
  if (
    !versionPattern.test(pkg.version) ||
    config.version !== pkg.version ||
    cargo !== pkg.version
  )
    throw Error("Package, Tauri and Rust preview versions must agree");
  if (
    config.productName !== productName ||
    config.identifier !== identifier ||
    overlay.bundle?.macOS?.minimumSystemVersion !== "15.0" ||
    overlay.bundle?.macOS?.bundleVersion !== pkg.version.split("-rc.")[0] ||
    overlay.bundle?.macOS?.signingIdentity !== "-" ||
    overlay.plugins?.["deep-link"]?.desktop?.schemes?.length !== 0
  )
    throw Error("Invalid preview release identity, platform or URL handlers");
  return {
    version: pkg.version,
    tag: `desktop-v${pkg.version}`,
    sourceCommit: process.env.GITHUB_SHA,
  };
}
export function validateManifest(m) {
  if (
    m?.schemaVersion !== 2 ||
    m.runtime !== "tauri" ||
    m.channel !== "preview" ||
    m.repository !== repository ||
    !versionPattern.test(m.version) ||
    m.tag !== `desktop-v${m.version}` ||
    !/^[a-f0-9]{40}$/.test(m.sourceCommit) ||
    m.artifacts?.length !== 1
  )
    throw Error("Invalid preview release manifest");
  const a = m.artifacts[0];
  if (
    a.target !== target ||
    a.platform !== "macos" ||
    a.architecture !== "arm64" ||
    a.file !== archiveName(m.version) ||
    a.url !==
      `https://github.com/${repository}/releases/download/${m.tag}/${a.file}` ||
    !/^[a-f0-9]{64}$/.test(a.sha256) ||
    /^0+$/.test(a.sha256) ||
    !Number.isSafeInteger(a.size) ||
    a.size <= 0
  )
    throw Error("Invalid preview release artifact");
  return m;
}
export function createManifest(identity, bytes) {
  const file = archiveName(identity.version);
  return validateManifest({
    schemaVersion: 2,
    runtime: "tauri",
    channel: "preview",
    repository,
    ...identity,
    artifacts: [
      {
        target,
        platform: "macos",
        architecture: "arm64",
        file,
        url: `https://github.com/${repository}/releases/download/${identity.tag}/${file}`,
        size: bytes.length,
        sha256: hash(bytes),
      },
    ],
  });
}
export function compareCalendar(a, b) {
  const left = a.split("-")[0].split(".").map(BigInt),
    right = b.split("-")[0].split(".").map(BigInt);
  for (let i = 0; i < 3; i++)
    if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  return 0;
}
export function hostedMain(env = process.env) {
  if (
    env.GITHUB_ACTIONS !== "true" ||
    env.GITHUB_REPOSITORY !== repository ||
    env.GITHUB_REF !== "refs/heads/main" ||
    !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA)
  )
    throw Error("Desktop release operations require the hosted main workflow");
}
