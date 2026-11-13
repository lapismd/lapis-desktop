import { readFile } from "node:fs/promises";
import path from "node:path";

export const imageManifestPath = ".ci/desktop-ci.json";

export async function loadImageManifest(root = process.cwd()) {
  return JSON.parse(await readFile(path.join(root, imageManifestPath), "utf8"));
}

export function validateImageManifest(
  manifest,
  { requireDigest = false } = {},
) {
  if (manifest?.schemaVersion !== 1)
    throw Error("Desktop CI image schemaVersion must be 1");
  if (manifest.image !== "ghcr.io/lapismd/lapis-desktop-ci")
    throw Error("Desktop CI image repository is invalid");
  if (!/^20\d{2}\.\d{1,2}\.\d+$/u.test(manifest.tag ?? ""))
    throw Error("Desktop CI image tag must be immutable");
  if (manifest.digest !== null || requireDigest) {
    if (!/^sha256:[a-f0-9]{64}$/u.test(manifest.digest ?? ""))
      throw Error("Desktop CI image digest must be a SHA-256 value");
  }
  for (const [name, version] of Object.entries({
    node: "24.15.0",
    pnpm: "10.34.5",
    playwright: "1.61.1",
    git: "2.56.1",
    mdbook: "0.5.4",
    jj: "0.45.1",
    rust: "1.99.0",
  }))
    if (manifest.versions?.[name] !== version)
      throw Error(`Desktop CI image ${name} version is invalid`);
  for (const value of [manifest.baseImage, manifest.rustImage])
    if (!/@sha256:[a-f0-9]{64}$/u.test(value ?? ""))
      throw Error("Desktop CI image bases must use immutable digests");
  return manifest;
}

export function imageReference(manifest) {
  validateImageManifest(manifest, { requireDigest: true });
  return `${manifest.image}@${manifest.digest}`;
}
