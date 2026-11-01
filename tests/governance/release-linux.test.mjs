import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  hash,
  helpers,
  identifier,
  productName,
} from "../../scripts/release/contract.mjs";
import { bundleFiles } from "../../scripts/release/ordinary.mjs";
import {
  linuxBinary,
  linuxDesktop,
  linuxRuntime,
  verifyElf,
  verifyLinuxBundle,
} from "../../scripts/release/verify-linux.mjs";

const target = "aarch64-unknown-linux-gnu";
const identity = {
  version: "2026.31.6-rc.1",
  tag: "desktop-v2026.31.6-rc.1",
  sourceCommit: "a".repeat(40),
};
function elf(machine = 183) {
  const bytes = Buffer.alloc(64);
  bytes.set([127, 69, 76, 70, 2, 1]);
  bytes.writeUInt16LE(machine, 18);
  return bytes;
}
async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "lapis-preview-linux-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  for (const file of [
    linuxBinary,
    ...helpers.map((name) => `${linuxRuntime}/${name}`),
  ]) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), elf(), { mode: 0o755 });
  }
  await mkdir(dirname(join(root, linuxDesktop)), { recursive: true });
  await writeFile(
    join(root, linuxDesktop),
    `[Desktop Entry]\nExec=lapis-notes-preview %U\nX-Lapis-Identifier=${identifier}\nX-Lapis-Version=${identity.version}\n`,
  );
  await writeFile(join(root, "share/lapis-notes-preview.png"), "fixture icon");
  const runtime = join(root, linuxRuntime, "runtime-manifest.toml");
  await writeFile(runtime, 'profile = "release"\n');
  const metadata = {
    schemaVersion: 1,
    ...identity,
    identifier,
    productName,
    target,
    helperProfile: "release",
    minimumUbuntu: "24.04",
    minimumGlibc: "2.39",
    runtimeManifestSha256: hash(await readFile(runtime)),
    files: await Promise.all(
      bundleFiles(root).map(async (file) => {
        const bytes = await readFile(file);
        return {
          path: relative(root, file),
          size: bytes.length,
          sha256: hash(bytes),
        };
      }),
    ),
  };
  await writeFile(
    join(root, "release-identity.json"),
    JSON.stringify(metadata),
  );
  return { root, metadata };
}
test("Linux verifier checks ELF architecture rather than trusting names", () => {
  verifyElf(elf(), target);
  verifyElf(elf(62), "x86_64-unknown-linux-gnu");
  assert.throws(() => verifyElf(elf(62), target), /architecture/);
  const invalid = elf();
  invalid[4] = 1;
  assert.throws(() => verifyElf(invalid, target), /64-bit/);
  assert.throws(
    () => verifyElf(Buffer.from("not an executable"), target),
    /ELF/,
  );
});
test("Linux package verification requires immutable resources, executable helpers and exact identity", async (context) => {
  const { root } = await fixture(context);
  assert.equal(
    verifyLinuxBundle(root, identity, target).ordinaryBundle,
    "verified",
  );
  await writeFile(join(root, linuxRuntime, "lapis-agent"), "corrupt helper");
  assert.throws(() => verifyLinuxBundle(root, identity, target));
  const other = await fixture(context);
  await chmod(join(other.root, linuxRuntime, "lapis-agent"), 0o644);
  assert.throws(
    () => verifyLinuxBundle(other.root, identity, target),
    /permission/,
  );
  assert.throws(
    () =>
      verifyLinuxBundle(
        other.root,
        { ...identity, sourceCommit: "b".repeat(40) },
        target,
      ),
    /identity/,
  );
});
test("Linux inventory rejects extra files, missing resources, changed profile and stable URL handlers", async (context) => {
  for (const mutation of [
    async (root) => writeFile(join(root, "node"), "unexpected runtime"),
    async (root) => rm(join(root, linuxRuntime, "runtime-manifest.toml")),
    async (root, m) => {
      m.helperProfile = "debug";
      await writeFile(join(root, "release-identity.json"), JSON.stringify(m));
    },
    async (root) =>
      writeFile(
        join(root, linuxDesktop),
        "MimeType=x-scheme-handler/lapis-notes;\n",
      ),
    async (root) =>
      writeFile(
        join(root, linuxBinary),
        Buffer.concat([elf(), Buffer.from("TAURI_WEBDRIVER_PORT")]),
      ),
  ]) {
    const { root, metadata } = await fixture(context);
    await mutation(root, metadata);
    assert.throws(() => verifyLinuxBundle(root, identity, target));
  }
});
