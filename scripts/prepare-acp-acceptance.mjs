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
const source = resolve("../lapis-ai");
const configuration = JSON.parse(
  readFileSync("src-tauri/tauri.conf.json", "utf8"),
);
const buildEnvironment = { ...process.env };
if (process.platform === "darwin") {
  buildEnvironment.MACOSX_DEPLOYMENT_TARGET =
    configuration.bundle.macOS.minimumSystemVersion;
}
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
    "--locked",
  ],
  { stdio: "inherit", env: buildEnvironment },
);
const destination = resolve(".local/acp/native");
mkdirSync(destination, { recursive: true });
const artifacts = [];
for (const [name, path] of [
  ["lapis-acp", join(source, "target/debug/lapis-acp")],
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
  JSON.stringify({ revision, artifacts }, null, 2) + "\n",
);
console.log(`Prepared isolated ACP resources from ${revision}`);
