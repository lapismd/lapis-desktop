import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  chmodSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { nativeBuildEnvironment } from "./native-build-environment.mjs";
const source = resolve("../lapis-ai");
const buildEnvironment = nativeBuildEnvironment();
const revision = execFileSync(
  "jj",
  ["--no-pager", "log", "-r", "@-", "--no-graph", "-T", "commit_id"],
  { cwd: source, encoding: "utf8" },
).trim();
if (
  execFileSync("jj", ["--no-pager", "diff", "--name-only"], {
    cwd: source,
    encoding: "utf8",
  }).trim()
)
  throw Error("ACP acceptance requires a clean verified source checkout");
const desktopRevision = execFileSync(
  "jj",
  ["--no-pager", "log", "-r", "@", "--no-graph", "-T", "commit_id"],
  { encoding: "utf8" },
).trim();
execFileSync(
  "cargo",
  [
    "build",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--features",
    "e2e,tauri/custom-protocol",
    "--bin",
    "lapis-acp-native-fixture",
    "--bin",
    "lapis-sync-custody-probe",
    "--locked",
  ],
  { stdio: "inherit", env: buildEnvironment },
);
if (
  execFileSync(
    "jj",
    ["--no-pager", "log", "-r", "@", "--no-graph", "-T", "commit_id"],
    { encoding: "utf8" },
  ).trim() !== desktopRevision
)
  throw Error("Desktop source changed during native fixture preparation");
const destination = resolve(".local/acp/native");
mkdirSync(destination, { recursive: true });
const artifacts = [];
for (const [name, path] of [
  ["lapis-acp", join(source, "target/debug/lapis-acp")],
  [
    "lapis-sync-custody-probe",
    resolve("src-tauri/target/debug/lapis-sync-custody-probe"),
  ],
  [
    "lapis-acp-native-fixture",
    resolve("src-tauri/target/debug/lapis-acp-native-fixture"),
  ],
]) {
  const target = join(destination, name);
  copyFileSync(path, target);
  chmodSync(target, 0o755);
  artifacts.push({
    name,
    source: path,
    sha256: createHash("sha256").update(readFileSync(target)).digest("hex"),
  });
}
writeFileSync(
  resolve(".local/acp/resources.json"),
  JSON.stringify({ revision, desktopRevision, artifacts }, null, 2) + "\n",
);
console.log(`Prepared isolated ACP resources from ${revision}`);
