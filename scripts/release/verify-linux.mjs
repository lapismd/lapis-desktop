import assert from "node:assert/strict";
import { lstatSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  hash,
  helpers,
  identifier,
  productName,
  targetInfo,
} from "./contract.mjs";
import { verifyOrdinary } from "./ordinary.mjs";

export const linuxFolder = "lapis-notes-preview";
export const linuxBinary = "bin/lapis-notes-preview";
export const linuxDesktop = `share/applications/${identifier}.desktop`;
export const linuxRuntime = `lib/${productName}/lapis-ai`;

export function verifyElf(bytes, target) {
  const info = targetInfo(target);
  assert.equal(info.platform, "linux");
  assert.ok(
    bytes.length >= 20 &&
      bytes.subarray(0, 4).equals(Buffer.from([127, 69, 76, 70])),
    "Expected an ELF executable",
  );
  assert.equal(bytes[4], 2, "Linux requires a 64-bit executable");
  assert.equal(bytes[5], 1, "Linux requires little-endian ELF");
  assert.equal(
    bytes.readUInt16LE(18),
    info.architecture === "arm64" ? 183 : 62,
    "ELF architecture disagrees with its release target",
  );
}

export function verifyLinuxBundle(directory, identity, target) {
  assert.ok(
    lstatSync(directory).isDirectory() &&
      !lstatSync(directory).isSymbolicLink(),
  );
  const metadataPath = join(directory, "release-identity.json");
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  for (const [key, value] of Object.entries({
    schemaVersion: 1,
    identifier,
    productName,
    version: identity.version,
    tag: identity.tag,
    sourceCommit: identity.sourceCommit,
    target,
    helperProfile: "release",
    minimumUbuntu: "24.04",
    minimumGlibc: "2.39",
  }))
    assert.equal(
      metadata[key],
      value,
      `Linux package identity disagrees: ${key}`,
    );
  assert.ok(
    lstatSync(join(directory, "share/lapis-notes-preview.png")).isFile(),
    "Preview icon is required",
  );
  const executable = join(directory, linuxBinary);
  const files = verifyOrdinary(directory, executable).filter(
    (file) => file !== metadataPath,
  );
  assert.ok(Array.isArray(metadata.files));
  assert.deepEqual(
    metadata.files.map((entry) => entry.path).sort(),
    files.map((file) => relative(directory, file)).sort(),
    "Linux resource inventory is incomplete or duplicated",
  );
  for (const entry of metadata.files) {
    assert.ok(
      !entry.path.startsWith("/") &&
        !entry.path
          .split("/")
          .some((part) => !part || part === "." || part === ".."),
    );
    const bytes = readFileSync(join(directory, entry.path));
    assert.equal(bytes.length, entry.size);
    assert.equal(
      hash(bytes),
      entry.sha256,
      `Linux resource changed: ${entry.path}`,
    );
  }
  for (const file of [
    executable,
    ...helpers.map((name) => join(directory, linuxRuntime, name)),
  ]) {
    assert.ok(
      (lstatSync(file).mode & 0o111) !== 0,
      "Linux executable permission is required",
    );
    verifyElf(readFileSync(file), target);
  }
  assert.equal(
    hash(readFileSync(join(directory, linuxRuntime, "runtime-manifest.toml"))),
    metadata.runtimeManifestSha256,
  );
  const desktop = readFileSync(join(directory, linuxDesktop), "utf8");
  assert.ok(desktop.includes(`X-Lapis-Identifier=${identifier}\n`));
  assert.ok(desktop.includes(`X-Lapis-Version=${identity.version}\n`));
  assert.match(desktop, /^Exec=lapis-notes-preview %U$/m);
  assert.doesNotMatch(
    desktop,
    /^MimeType=/m,
    "Preview must not register stable URL schemes",
  );
  return {
    identifier,
    version: identity.version,
    target,
    architecture: targetInfo(target).architecture,
    minimumUbuntu: "24.04",
    minimumGlibc: "2.39",
    signature: "not-applicable",
    integrity: "verified",
    ordinaryBundle: "verified",
    bundledFiles: files.length + 1,
  };
}
