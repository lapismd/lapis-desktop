import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
export const repository = "lapismd/lapis-desktop";
export const identifier = "com.lapismd.lapis-desktop.preview";
export const productName = "Lapis Notes Preview";
export const target = "aarch64-apple-darwin";
export const releaseTargets = [
  {
    target,
    platform: "macos",
    architecture: "arm64",
    extension: "zip",
    label: "macos-arm64",
  },
  {
    target: "aarch64-unknown-linux-gnu",
    platform: "linux",
    architecture: "arm64",
    extension: "tar.gz",
    label: "linux-arm64",
  },
  {
    target: "x86_64-unknown-linux-gnu",
    platform: "linux",
    architecture: "x64",
    extension: "tar.gz",
    label: "linux-x64",
  },
];
export function targetInfo(value) {
  const item = releaseTargets.find((entry) => entry.target === value);
  if (!item) throw Error("Unsupported preview target");
  return item;
}
export const helpers = [
  "lapis-acp",
  "lapis-agent",
  "lapis-agent-tools",
  "lapis-compute",
];
export const versionPattern =
  /^(20\d{2})\.(0|[1-9]\d*)\.(0|[1-9]\d*)-rc\.([1-9]\d*)$/;
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function archiveName(version, value = target) {
  const item = targetInfo(value);
  return `Lapis-Notes-Preview-${version}-${item.platform}-${item.architecture}.${item.extension}`;
}
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
export function validateArtifact(a, version, tag) {
  const info = targetInfo(a?.target);
  if (
    a.platform !== info.platform ||
    a.architecture !== info.architecture ||
    a.file !== archiveName(version, info.target) ||
    a.url !==
      `https://github.com/${repository}/releases/download/${tag}/${a.file}` ||
    !/^[a-f0-9]{64}$/.test(a.sha256) ||
    /^0+$/.test(a.sha256) ||
    !Number.isSafeInteger(a.size) ||
    a.size <= 0
  )
    throw Error("Invalid preview release artifact");
  return a;
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
    !Array.isArray(m.artifacts) ||
    ![1, 3].includes(m.artifacts.length)
  )
    throw Error("Invalid preview release manifest");
  const seen = new Set();
  for (const a of m.artifacts) {
    validateArtifact(a, m.version, m.tag);
    if (seen.has(a.target)) throw Error("Duplicate preview target");
    seen.add(a.target);
  }
  if (!seen.has(target))
    throw Error("Preview requires its macOS ARM64 artifact");
  return m;
}
export function createArtifact(identity, bytes, value = target) {
  const info = targetInfo(value),
    file = archiveName(identity.version, value);
  return validateArtifact(
    {
      target: value,
      platform: info.platform,
      architecture: info.architecture,
      file,
      url: `https://github.com/${repository}/releases/download/${identity.tag}/${file}`,
      size: bytes.length,
      sha256: hash(bytes),
    },
    identity.version,
    identity.tag,
  );
}
export function createManifest(identity, bytesOrArtifacts) {
  return validateManifest({
    schemaVersion: 2,
    runtime: "tauri",
    channel: "preview",
    repository,
    ...identity,
    artifacts: Array.isArray(bytesOrArtifacts)
      ? bytesOrArtifacts
      : [createArtifact(identity, bytesOrArtifacts)],
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
  const hosted =
    env.GITHUB_ACTIONS === "true" &&
    env.GITHUB_REPOSITORY === repository &&
    /^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? "");
  if (env.LAPIS_DESKTOP_TRIAL === "1") {
    if (!hosted || env.GITHUB_WORKFLOW !== "Desktop trial build")
      throw Error("Trial builds require the hosted trial workflow");
    return;
  }
  if (!hosted || env.GITHUB_REF !== "refs/heads/main")
    throw Error("Desktop release operations require the hosted main workflow");
}
