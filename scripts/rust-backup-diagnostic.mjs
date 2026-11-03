import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const rustBackupDiagnosticOptIn = "LAPIS_DESKTOP_RUST_BACKUP_DIAGNOSTIC";
export const rustBackupCase =
  "original_and_managed_reads_share_one_client_without_initializing_original_history";

const manifest = "src-tauri/Cargo.toml";
const binary = "repository_original";
const base = [
  "test",
  "--manifest-path",
  manifest,
  "--locked",
  "--test",
  binary,
];

export function ignoredTestNames(output) {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(": test"))
    .map((line) => line.slice(0, -": test".length));
}

export function rustBackupDiagnosticPlan() {
  return {
    inventory: [...base, "--", "--ignored", "--list", "--format=terse"],
    stages: [
      {
        id: "isolated",
        args: [
          ...base,
          rustBackupCase,
          "--",
          "--ignored",
          "--exact",
          "--nocapture",
        ],
      },
      {
        id: "scoped-group",
        args: [...base, "--", "--include-ignored", "--nocapture"],
      },
    ],
  };
}

export function rustBackupDiagnosticGate(
  environment = process.env,
  platform = process.platform,
  arch = process.arch,
) {
  if (environment[rustBackupDiagnosticOptIn] !== "1")
    return {
      ok: false,
      reason: "Rust backup diagnostics need explicit opt-in",
    };
  if (platform !== "darwin" || arch !== "arm64")
    return { ok: false, reason: "Rust backup diagnostics require macOS ARM64" };
  return { ok: true, reason: null };
}

function run(command, args, environment) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) accept();
      else reject(new Error(`${command} exited ${signal ?? code}`));
    });
  });
}

export async function runRustBackupDiagnostic({
  environment = process.env,
  platform = process.platform,
  arch = process.arch,
  inventory = (command, args, options) => execFileSync(command, args, options),
  execute = run,
  output = resolve(".local/native-test/rust-backup-diagnostic.json"),
} = {}) {
  const gate = rustBackupDiagnosticGate(environment, platform, arch);
  if (!gate.ok) throw new Error(gate.reason);
  const plan = rustBackupDiagnosticPlan();
  const cargo = environment.CARGO || "cargo";
  const sources = JSON.parse(readFileSync("scripts/ci-sources.json", "utf8"));
  const core = sources.find((entry) => entry.name === "lapis-server");
  assert.match(core?.revision ?? "", /^[0-9a-f]{40}$/u);
  mkdirSync(resolve(output, ".."), { recursive: true });
  const report = {
    schema: 1,
    ok: false,
    qualification: false,
    automaticRetry: false,
    platform: `${platform}-${arch}`,
    source: environment.GITHUB_SHA ?? null,
    core: core.revision,
    case: rustBackupCase,
    ignoredInventory: null,
    inventoryStatus: "running",
    stages: plan.stages.map(({ id }) => ({ id, status: "not-executed" })),
  };
  const save = () =>
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  save();
  try {
    const listed = inventory(cargo, plan.inventory, {
      encoding: "utf8",
      env: environment,
    });
    report.ignoredInventory = ignoredTestNames(listed);
    assert.deepEqual(
      report.ignoredInventory,
      [rustBackupCase],
      "repository_original ignored inventory changed",
    );
    report.inventoryStatus = "passed";
  } catch (error) {
    report.inventoryStatus = "failed";
    report.inventoryFailure = error.message;
    save();
    throw error;
  }
  save();
  const diagnosticEnvironment = {
    ...environment,
    LAPIS_APP_BACKUP_DIAGNOSTICS: "1",
  };
  for (const [index, stage] of plan.stages.entries()) {
    report.stages[index].status = "running";
    save();
    try {
      await execute(cargo, stage.args, diagnosticEnvironment);
      report.stages[index].status = "passed";
    } catch (error) {
      report.stages[index].status = "failed";
      report.stages[index].failure = error.message;
      save();
      throw error;
    }
    save();
  }
  report.ok = true;
  save();
  return report;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runRustBackupDiagnostic().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
