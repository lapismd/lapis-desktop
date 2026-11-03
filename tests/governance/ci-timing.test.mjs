import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { nativeBuildEnvironment } from "../../scripts/native-build-environment.mjs";

test("macOS build environment rejects a deployment override and uses configured minimum", () => {
  assert.equal(
    nativeBuildEnvironment({}, "darwin").MACOSX_DEPLOYMENT_TARGET,
    "13.0",
  );
  assert.throws(
    () =>
      nativeBuildEnvironment({ MACOSX_DEPLOYMENT_TARGET: "15.0" }, "darwin"),
    /configured minimum/,
  );
  assert.deepEqual(nativeBuildEnvironment({ SENTINEL: "retained" }, "linux"), {
    SENTINEL: "retained",
  });
});
test("timing wrapper preserves a failed command exit and retains failure evidence", () => {
  const root = mkdtempSync(join(tmpdir(), "ci-timing-"));
  try {
    const result = spawnSync(
      process.execPath,
      [
        resolve("scripts/ci/timing.mjs"),
        "run",
        "intentional-failure",
        "--",
        process.execPath,
        "-e",
        "process.exit(23)",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 23);
    const record = JSON.parse(
      readFileSync(join(root, ".local/ci-timing/events.jsonl"), "utf8"),
    );
    assert.equal(record.result, "failure");
    assert.ok(record.durationMs >= 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("optional timing write failure preserves command success and original failure status", () => {
  const root = mkdtempSync(join(tmpdir(), "ci-timing-unavailable-"));
  try {
    writeFileSync(join(root, ".local"), "blocked timing directory");
    for (const code of [0, 23]) {
      const result = spawnSync(
        process.execPath,
        [
          resolve("scripts/ci/timing.mjs"),
          "run",
          "io-failure",
          "--",
          process.execPath,
          "-e",
          `process.exit(${code})`,
        ],
        { cwd: root, encoding: "utf8" },
      );
      assert.equal(result.status, code);
      assert.match(result.stderr, /CI timing unavailable/);
    }
    for (const operation of ["start", "finish"]) {
      const result = spawnSync(
        process.execPath,
        [resolve("scripts/ci/timing.mjs"), operation, "rust-cache"],
        { cwd: root, encoding: "utf8" },
      );
      assert.equal(result.status, 0);
      assert.match(result.stderr, /CI timing unavailable/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("full and nightly Turbo execution cannot restore cached test success", () => {
  const root = mkdtempSync(join(tmpdir(), "ci-fresh-"));
  try {
    const executable = join(root, "pnpm");
    writeFileSync(
      executable,
      `#!${process.execPath}\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)) + "\\n");\n`,
    );
    chmodSync(executable, 0o755);
    for (const [event, profile, fresh] of [
      ["pull_request", "ordinary", false],
      ["schedule", "full", true],
      ["workflow_dispatch", "full", true],
    ]) {
      const result = spawnSync(
        process.execPath,
        [resolve("scripts/run-turbo.mjs"), "ci:unit"],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: root + ":" + process.env.PATH,
            GITHUB_EVENT_NAME: event,
            LAPIS_CI_PROFILE: profile,
          },
        },
      );
      assert.equal(result.status, 0, result.stderr);
      const arguments_ = JSON.parse(result.stdout.trim().split("\n").at(-1));
      assert.equal(arguments_.includes("--force"), fresh);
      assert.ok(arguments_.includes("ci:unit"));
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
