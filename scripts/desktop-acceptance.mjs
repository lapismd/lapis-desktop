import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export async function run(command, args, env = process.env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      if (code === 0) resolveRun();
      else reject(new Error(`${command} exited with ${signal ?? code}`));
    });
  });
}
async function acceptance() {
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("M0.1 native acceptance requires macOS ARM64.");
  mkdirSync(".local/native-test", { recursive: true });
  const directory = mkdtempSync(resolve(".local/native-test/run-"));
  const vault = join(directory, "vault-笔记 café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# A native vault\n");
  copyFileSync("src-tauri/icons/icon.png", join(vault, "café.png"));
  await run("pnpm", [
    "exec",
    "tauri",
    "build",
    "--debug",
    "--bundles",
    "app",
    "--features",
    "e2e",
    "--config",
    "src-tauri/tauri.e2e.conf.json",
  ]);
  const bin = join(directory, "bin");
  mkdirSync(bin);
  symlinkSync(process.execPath, join(bin, "node"));
  const environment = {
    ...process.env,
    PATH: `${bin}:/usr/bin:/bin`,
    LAPIS_DESKTOP_ACCEPTANCE_STATE: join(directory, "window-state.json"),
    LAPIS_DESKTOP_ACCEPTANCE_ROOT: directory,
  };
  await run(
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      "tests/desktop/startup-progress.test.mjs",
    ],
    environment,
  );
  await run(
    resolve("node_modules/.bin/wdio"),
    ["run", "tests/desktop/wdio.conf.mjs"],
    environment,
  );
  await run(
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      "tests/desktop/lifecycle.test.mjs",
      "tests/desktop/notes-lifecycle.test.mjs",
      "tests/desktop/notes-conflicts.test.mjs",
      "tests/desktop/preview-conflicts.test.mjs",
      "tests/desktop/window-chrome.test.mjs",
      "tests/desktop/vault-return.test.mjs",
      "tests/desktop/properties-persistence.test.mjs",
      "tests/desktop/settings-persistence.test.mjs",
      "tests/desktop/plugin-persistence.test.mjs",
      "tests/desktop/startup-recovery.test.mjs",
      "tests/desktop/file-operations.test.mjs",
      "tests/desktop/file-watch.test.mjs",
      "tests/desktop/file-deletion.test.mjs",
      "tests/desktop/file-creation.test.mjs",
    ],
    environment,
  );
  if (!existsSync(environment.LAPIS_DESKTOP_ACCEPTANCE_STATE))
    throw new Error("The native window-state plugin did not persist geometry.");
  console.log(
    "Cold native geometry and Notes lifecycle acceptance passed with isolated state and no Node/Deno on PATH.",
  );
  console.log(
    `Native state evidence: ${readFileSync(environment.LAPIS_DESKTOP_ACCEPTANCE_STATE, "utf8")}`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  acceptance().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
