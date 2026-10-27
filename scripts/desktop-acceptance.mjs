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
import { prepareDistributionFixtures } from "../tests/desktop/distribution-fixtures.mjs";

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
  prepareDistributionFixtures();
  mkdirSync(".local/native-test", { recursive: true });
  const directory = mkdtempSync(resolve(".local/native-test/run-"));
  const vault = join(directory, "vault-笔记 café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# A native vault\n");
  copyFileSync("src-tauri/icons/icon.png", join(vault, "café.png"));
  await run(process.execPath, ["scripts/prepare-acp-acceptance.mjs"]);
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
      "tests/desktop/terminal-lifecycle.test.mjs",
      "tests/desktop/acp-transport.test.mjs",
      "tests/desktop/ai-user-commands.test.mjs",
      "tests/desktop/ai-admission.test.mjs",
      "tests/desktop/ai-native-queue-admission.test.mjs",
      "tests/desktop/ai-native-queue-owner.test.mjs",
      "tests/desktop/ai-native-queue-screen.test.mjs",
      "tests/desktop/ai-notes-binding.test.mjs",
      "tests/desktop/ai-transcript-backup.test.mjs",
      "tests/desktop/plugin-assets.test.mjs",
      "tests/desktop/plugin-distribution.test.mjs",
      "tests/desktop/plugin-distribution-recovery.test.mjs",
      "tests/desktop/portable-plugins.test.mjs",
      "tests/desktop/portable-workers.test.mjs",
      "tests/desktop/portable-database.test.mjs",
      "tests/desktop/notes-conflicts.test.mjs",
      "tests/desktop/tasks-installed.test.mjs",
      "tests/desktop/editing-recovery.test.mjs",
      "tests/desktop/preview-conflicts.test.mjs",
      "tests/desktop/window-chrome.test.mjs",
      "tests/desktop/popout-host.test.mjs",
      "tests/desktop/vault-return.test.mjs",
      "tests/desktop/properties-persistence.test.mjs",
      "tests/desktop/properties-preflight.test.mjs",
      "tests/desktop/settings-persistence.test.mjs",
      "tests/desktop/repository-working-copy.test.mjs",
      "tests/desktop/plugin-persistence.test.mjs",
      "tests/desktop/startup-recovery.test.mjs",
      "tests/desktop/file-operations.test.mjs",
      "tests/desktop/file-watch.test.mjs",
      "tests/desktop/file-deletion.test.mjs",
      "tests/desktop/file-creation.test.mjs",
      "tests/desktop/file-reconciliation.test.mjs",
      "tests/desktop/system-file-actions.test.mjs",
      "tests/desktop/file-ui-mutations.test.mjs",
      "tests/desktop/file-import.test.mjs",
      "tests/desktop/navigation-search.test.mjs",
      "tests/desktop/navigation-search-settings.test.mjs",
      "tests/desktop/search-owner.test.mjs",
      "tests/desktop/search-recovery.test.mjs",
      "tests/desktop/navigation-metadata.test.mjs",
      "tests/desktop/metadata-owner.test.mjs",
      "tests/desktop/navigation-graph.test.mjs",
      "tests/desktop/integration-ports.test.mjs",
      "tests/desktop/integration-urls.test.mjs",
    ],
    environment,
  );
  await run(
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      "tests/desktop/file-http-representation.test.mjs",
    ],
    // The harness builds a development fixture with Cargo. nativeSession still
    // starts both actual app processes with only /usr/bin:/bin on PATH.
    { ...environment, PATH: process.env.PATH },
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
