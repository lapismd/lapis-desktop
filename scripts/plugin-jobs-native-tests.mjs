import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

if (
  process.platform !== "linux" ||
  process.env.LAPIS_DESKTOP_VALIDATION_WORKER !== "1"
)
  throw Error(
    "Native job qualification requires the explicit Linux Docker worker",
  );

const selectors = process.argv.slice(2);
if (
  selectors.length > 1 ||
  selectors.some((value) => !value.startsWith("--test-name-pattern="))
)
  throw Error(
    "Choose one explicit --test-name-pattern selector or the full lane",
  );
const tests = [
  "tests/desktop/metadata-owner.test.mjs",
  "tests/desktop/navigation-metadata.test.mjs",
  "tests/desktop/background-jobs.test.mjs",
  "tests/desktop/tasks-owner.test.mjs",
  "tests/desktop/editing-recovery.test.mjs",
];
const run = (program, args, env = process.env) =>
  execFileSync(program, args, { stdio: "inherit", env });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
run(process.execPath, ["scripts/prepare-bundled-skills.mjs"]);
run(
  "pnpm",
  [
    "exec",
    "vite",
    "build",
    "--mode",
    "native-jobs-test",
    "--outDir",
    ".local/native-test/ui",
  ],
  { ...process.env, NODE_OPTIONS: "--max-old-space-size=6144" },
);
const configuration = JSON.parse(
  await readFile("src-tauri/tauri.e2e.conf.json", "utf8"),
);
// These feature families use no external AI/CLI provider; their unavailable state
// is real. The production bootstrap, native services and WebView remain unchanged.
configuration.bundle.resources = [];
const environment = {
  ...process.env,
  TAURI_CONFIG: JSON.stringify(configuration),
};
run(
  "cargo",
  [
    "build",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--bin",
    "lapis-desktop",
    "--features",
    "e2e,tauri/custom-protocol",
    "--locked",
  ],
  environment,
);
const binary = resolve("src-tauri/target/debug/lapis-desktop");
await mkdir(".local/native-test", { recursive: true });
const root = await mkdtemp(resolve(".local/native-test/plugin-jobs-linux-"));
await mkdir(join(root, "home"), { recursive: true });
await mkdir(".release/ci-results", { recursive: true });
const report = {
  source: process.env.LAPIS_DESKTOP_HEAD,
  platform: process.platform,
  architecture: process.arch,
  executableSha256: hash(await readFile(binary)),
  lockSha256: hash(await readFile("pnpm-lock.yaml")),
  nativeLockSha256: hash(await readFile("src-tauri/Cargo.lock")),
  configurationSha256: hash(JSON.stringify(configuration)),
  tests,
  selectors,
  status: "running",
};
const output = ".release/ci-results/plugin-jobs-native.json";
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
const child = spawn(
  "dbus-run-session",
  [
    "--",
    "xvfb-run",
    "-a",
    "-s",
    "-screen 0 1600x1000x24",
    "sh",
    "-c",
    'openbox >/dev/null 2>&1 & exec "$@"',
    "native-jobs",
    process.execPath,
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    ...selectors,
    ...tests,
  ],
  {
    stdio: "inherit",
    env: {
      ...environment,
      HOME: join(root, "home"),
      XDG_CONFIG_HOME: join(root, "xdg-config"),
      XDG_CACHE_HOME: join(root, "xdg-cache"),
      XDG_DATA_HOME: join(root, "xdg-data"),
      LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
      LAPIS_DESKTOP_ACCEPTANCE_BINARY: binary,
      // WebKit's namespace sandbox cannot nest in the capability-dropped worker.
      // This setting exists only for this disposable test process tree.
      WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS: "1",
    },
  },
);
const stop = () => child.kill("SIGTERM");
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
try {
  const code = await new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("close", (code) => accept(code));
  });
  if (code !== 0) throw Error(`Native job qualification exited ${code}`);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  process.off("SIGTERM", stop);
  process.off("SIGINT", stop);
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
}
