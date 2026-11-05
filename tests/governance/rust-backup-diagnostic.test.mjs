import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ignoredTestNames,
  runRustBackupDiagnostic,
  rustBackupCase,
  rustBackupDiagnosticGate,
  rustBackupDiagnosticOptIn,
  rustBackupDiagnosticPlan,
} from "../../scripts/rust-backup-diagnostic.mjs";

test("the ARM64 backup diagnostic keeps one exact ignored case and scoped group", () => {
  assert.deepEqual(
    ignoredTestNames(`other: benchmark\n${rustBackupCase}: test\n`),
    [rustBackupCase],
  );
  const plan = rustBackupDiagnosticPlan();
  assert.deepEqual(plan.inventory.slice(-4), [
    "--",
    "--ignored",
    "--list",
    "--format=terse",
  ]);
  assert.equal(plan.stages.length, 2);
  const isolated = plan.stages[0].args;
  assert.ok(isolated.includes(rustBackupCase));
  assert.ok(isolated.includes("--ignored"));
  assert.ok(isolated.includes("--exact"));
  const group = plan.stages[1].args;
  assert.ok(group.includes("--include-ignored"));
  assert.ok(!group.includes("--workspace"));
  for (const args of [isolated, group]) {
    assert.ok(args.includes("--test"));
    assert.ok(args.includes("repository_original"));
    assert.ok(args.includes("--locked"));
  }
});

test("the diagnostic refuses implicit or substituted platforms", () => {
  assert.equal(rustBackupDiagnosticGate({}, "darwin", "arm64").ok, false);
  const enabled = { [rustBackupDiagnosticOptIn]: "1" };
  assert.equal(rustBackupDiagnosticGate(enabled, "linux", "arm64").ok, false);
  assert.equal(rustBackupDiagnosticGate(enabled, "darwin", "x64").ok, false);
  assert.equal(rustBackupDiagnosticGate(enabled, "darwin", "arm64").ok, true);
});

test("isolated and scoped stages retain one attempt and cannot qualify", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rust-backup-diagnostic-"));
  try {
    const output = join(directory, "result.json");
    const calls = [];
    const environment = {
      [rustBackupDiagnosticOptIn]: "1",
      GITHUB_SHA: "a".repeat(40),
    };
    const report = await runRustBackupDiagnostic({
      environment,
      platform: "darwin",
      arch: "arm64",
      output,
      inventory(_command, args) {
        assert.deepEqual(args, rustBackupDiagnosticPlan().inventory);
        return `${rustBackupCase}: test\n`;
      },
      async execute(command, args, env) {
        calls.push({ command, args, env });
      },
    });
    assert.equal(report.ok, true);
    assert.equal(report.qualification, false);
    assert.equal(report.automaticRetry, false);
    assert.equal(report.inventoryStatus, "passed");
    assert.deepEqual(
      report.stages.map((stage) => stage.status),
      ["passed", "passed"],
    );
    assert.equal(calls.length, 2);
    assert.ok(
      calls.every((call) => call.env.LAPIS_APP_BACKUP_DIAGNOSTICS === "1"),
    );
    assert.deepEqual(JSON.parse(readFileSync(output)), report);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("changed ignored inventory fails before execution and retains a report", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rust-backup-inventory-"));
  try {
    const output = join(directory, "result.json");
    let executed = false;
    await assert.rejects(
      runRustBackupDiagnostic({
        environment: { [rustBackupDiagnosticOptIn]: "1" },
        platform: "darwin",
        arch: "arm64",
        output,
        inventory: () => `${rustBackupCase}: test\nunrelated: test\n`,
        execute: async () => {
          executed = true;
        },
      }),
      /ignored inventory changed/u,
    );
    assert.equal(executed, false);
    const report = JSON.parse(readFileSync(output));
    assert.equal(report.ok, false);
    assert.equal(report.inventoryStatus, "failed");
    assert.ok(report.stages.every((stage) => stage.status === "not-executed"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
