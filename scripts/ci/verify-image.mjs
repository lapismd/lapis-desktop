import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2];
if (!manifestPath) throw Error("Usage: verify-image <desktop-ci.json>");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const command = (name, args) =>
  execFileSync(name, args, { encoding: "utf8" }).trim();
const expected = {
  node: `v${manifest.versions.node}`,
  pnpm: manifest.versions.pnpm,
  playwright: `Version ${manifest.versions.playwright}`,
  mdbook: `mdbook v${manifest.versions.mdbook}`,
  jj: `jj ${manifest.versions.jj}`,
  rustc: `rustc ${manifest.versions.rust}`,
};
for (const [name, version] of Object.entries(expected)) {
  const actual = command(name, ["--version"]);
  if (!actual.startsWith(version))
    throw Error(`${name} version mismatch: ${actual}`);
}
const root = "/opt/lapis-desktop-ci/tools";
const tools = JSON.parse(await readFile(path.join(root, "manifest.json")));
for (const platform of ["linux-x64", "linux-arm64", "darwin-arm64"]) {
  for (const executable of ["jj", "mdbook"]) {
    const file = path.join(root, platform, executable);
    await access(file);
    const digest = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    if (tools.platforms?.[platform]?.[executable] !== digest)
      throw Error(`Invalid ${platform} ${executable} digest`);
  }
}
console.log(
  JSON.stringify({ image: manifest.image, tag: manifest.tag, expected }),
);
