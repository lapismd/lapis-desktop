import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
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
  git: `git version ${manifest.versions.git}`,
  mdbook: `mdbook v${manifest.versions.mdbook}`,
  jj: `jj ${manifest.versions.jj}`,
  rustc: `rustc ${manifest.versions.rust}`,
};
for (const [name, version] of Object.entries(expected)) {
  const actual = command(name, ["--version"]);
  if (!actual.startsWith(version))
    throw Error(`${name} version mismatch: ${actual}`);
}
const compatibilityRoot = await mkdtemp(
  path.join(tmpdir(), "lapis-desktop-ci-git-"),
);
try {
  const remote = path.join(compatibilityRoot, "remote.git"),
    checkout = path.join(compatibilityRoot, "checkout"),
    environment = { ...process.env, HOME: compatibilityRoot };
  execFileSync("git", ["init", "--bare", remote], { stdio: "pipe" });
  execFileSync("git", ["init", checkout], { stdio: "pipe" });
  execFileSync("git", ["-C", checkout, "remote", "add", "origin", remote], {
    stdio: "pipe",
  });
  execFileSync("jj", ["git", "init", "--colocate", "."], {
    cwd: checkout,
    env: environment,
    stdio: "pipe",
  });
  execFileSync("jj", ["--no-pager", "git", "fetch"], {
    cwd: checkout,
    env: environment,
    stdio: "pipe",
  });
} finally {
  await rm(compatibilityRoot, { recursive: true, force: true });
}
const root = "/opt/lapis-desktop-ci/tools";
const tools = JSON.parse(await readFile(path.join(root, "manifest.json")));
if (tools.schemaVersion !== 2) throw Error("Invalid CI tool bundle schema");
for (const platform of ["linux-x64", "linux-arm64", "darwin-arm64"]) {
  for (const executable of ["jj", "mdbook"]) {
    const file = path.join(root, platform, executable);
    await access(file);
    const digest = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    if (tools.platforms?.[platform]?.executables?.[executable] !== digest)
      throw Error(`Invalid ${platform} ${executable} digest`);
  }
  const archives = Object.entries(tools.platforms?.[platform]?.archives ?? {});
  if (archives.length !== 1)
    throw Error(`Invalid ${platform} archive inventory`);
  const [[name, expectedDigest]] = archives;
  const archive = path.join(root, platform, name);
  await access(archive);
  const actualDigest = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  if (actualDigest !== expectedDigest)
    throw Error(`Invalid ${platform} Vectorscan archive digest`);
}
console.log(
  JSON.stringify({ image: manifest.image, tag: manifest.tag, expected }),
);
