import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  copyFile,
  chmod,
  writeFile,
  stat,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const targets = {
  "darwin-arm64": "aarch64-apple-darwin",
  "linux-arm64": "aarch64-unknown-linux-gnu",
  "linux-x64": "x86_64-unknown-linux-gnu",
};
const target =
  process.env.RELEASE_TARGET ?? targets[`${process.platform}-${process.arch}`];
if (!Object.values(targets).includes(target))
  throw Error("Unsupported CLI bundle target");
const manifest = await readFile("src-tauri/Cargo.toml", "utf8");
const revision = manifest.match(/lapis-cli = .*rev = "([a-f0-9]{40})"/)?.[1];
if (!revision) throw Error("A pinned server revision is required");
const destination = resolve("src-tauri/resources/lapis-cli");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (process.argv.includes("--reuse")) {
  try {
    const metadata = JSON.parse(
      await readFile(join(destination, "manifest.json"), "utf8"),
    );
    const bytes = await readFile(join(destination, "lapis"));
    if (
      metadata.buildSchema === 1 &&
      metadata.sourceRevision === revision &&
      metadata.target === target &&
      metadata.profile === "release" &&
      metadata.sha256 === digest(bytes) &&
      (await stat(join(destination, "lapis"))).mode & 0o111
    ) {
      console.log("Verified bundled Lapis CLI");
      process.exit(0);
    }
    throw Error(
      "Staged CLI does not match the pinned source, target or checksum; run pnpm cli:prepare",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const metadata = JSON.parse(
  execFileSync(
    "cargo",
    [
      "metadata",
      "--manifest-path",
      "src-tauri/Cargo.toml",
      "--locked",
      "--features",
      "cli-tooling",
      "--format-version",
      "1",
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  ),
);
const core = metadata.packages.find(
  (pkg) => pkg.name === "lapis-cli" && pkg.source?.endsWith(`#${revision}`),
);
if (!core) throw Error("Pinned CLI source was not resolved by Cargo");
const source = resolve(dirname(core.manifest_path), "../..");
const output = resolve(".local/cli-target", revision);
execFileSync(
  "cargo",
  [
    "build",
    "--manifest-path",
    join(source, "crates/lapis-cli/Cargo.toml"),
    "--locked",
    "--release",
    "--target",
    target,
    "--target-dir",
    output,
  ],
  { stdio: "inherit" },
);
await mkdir(destination, { recursive: true });
const binary = join(destination, "lapis");
await copyFile(join(output, target, "release/lapis"), binary);
await chmod(binary, 0o755);
if (process.platform === "darwin")
  execFileSync("/usr/bin/codesign", ["--force", "--sign", "-", binary], {
    stdio: "inherit",
  });
const cliPackage = await readFile(
  join(source, "crates/lapis-cli/Cargo.toml"),
  "utf8",
);
const version = cliPackage.match(/^version = "([^"]+)"/m)?.[1];
await writeFile(
  join(destination, "manifest.json"),
  JSON.stringify(
    {
      buildSchema: 1,
      sourceRevision: revision,
      target,
      profile: "release",
      version,
      sha256: digest(await readFile(binary)),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Bundled Lapis CLI ${version} from ${revision}`);
