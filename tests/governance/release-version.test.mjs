import test, { before } from "node:test";
import assert from "node:assert/strict";
import { nextPreviewVersion } from "../../scripts/release/version.mjs";
before(() =>
  execFileSync(
    "pnpm",
    [
      "--dir",
      "scripts/release-tools",
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--ignore-workspace",
    ],
    { stdio: "pipe" },
  ),
);
test("Changesets intent advances the preview monotonically without a stable cutover", () => {
  assert.equal(nextPreviewVersion("2026.31.6-rc.2"), "2026.31.6-rc.3");
  assert.throws(() => nextPreviewVersion("2026.31.6"));
  assert.throws(() => nextPreviewVersion("0.1.0"));
});

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { versionEvidence } from "../../scripts/release/version-evidence.mjs";
import {
  parseEvidence,
  validateEvidence,
} from "../../scripts/evidence-model.mjs";
import { versionDesktop } from "../../scripts/release/version.mjs";
test("real Changesets consumes notes and synchronizes all native preview identities", (t) => {
  const root = mkdtempSync(join(tmpdir(), "desktop-version-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".changeset"));
  mkdirSync(join(root, "src-tauri"));
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "@lapismd/lapis-desktop",
      private: true,
      version: "2026.31.6-rc.2",
      packageManager: "pnpm@10.34.5",
      devDependencies: { prettier: "3.3.3" },
    }),
  );
  writeFileSync(
    join(root, ".changeset/config.json"),
    readFileSync(".changeset/config.json"),
  );
  writeFileSync(
    join(root, ".changeset/change.md"),
    '---\n"@lapismd/lapis-desktop": patch\n---\n\nEnable local MCP access.\n',
  );
  writeFileSync(
    join(root, "src-tauri/Cargo.toml"),
    '[package]\nname = "lapis-desktop"\nversion = "2026.31.6-rc.2"\n',
  );
  writeFileSync(
    join(root, "src-tauri/Cargo.lock"),
    '[[package]]\nname = "lapis-desktop"\nversion = "2026.31.6-rc.2"\n',
  );
  writeFileSync(
    join(root, "src-tauri/tauri.conf.json"),
    JSON.stringify({ version: "2026.31.6-rc.2" }),
  );
  writeFileSync(
    join(root, "src-tauri/tauri.preview.conf.json"),
    JSON.stringify({ bundle: { macOS: { bundleVersion: "2026.31.6" } } }),
  );
  // Match the version workflow: public docs tools supply the root formatter,
  // while Changesets itself stays in its separate public release graph.
  writeFileSync(
    join(root, ".prettierrc.json"),
    readFileSync(".prettierrc.json"),
  );
  mkdirSync(join(root, ".github/ci-docs"), { recursive: true });
  for (const file of ["package.json", "pnpm-lock.yaml"])
    writeFileSync(
      join(root, ".github/ci-docs", file),
      readFileSync(join(".github/ci-docs", file)),
    );
  const tools = mkdtempSync(join(tmpdir(), "desktop-version-public-tools-"));
  t.after(() => rmSync(tools, { recursive: true, force: true }));
  execFileSync(process.execPath, [resolve("scripts/ci/docs-setup.mjs")], {
    cwd: root,
    env: { ...process.env, RUNNER_TEMP: tools },
    stdio: "pipe",
  });
  execFileSync("jj", ["git", "init", "--colocate", "."], {
    cwd: root,
    stdio: "pipe",
  });
  const jj = (args) =>
    execFileSync(
      "jj",
      [
        "--config",
        'user.name="Fixture"',
        "--config",
        'user.email="fixture@example.invalid"',
        "--config",
        'signing.behavior="drop"',
        ...args,
      ],
      { cwd: root, stdio: "pipe" },
    );
  jj(["commit", "-m", "Version fixture"]);
  jj(["bookmark", "create", "main", "-r", "@-"]);
  const nativeLock = readFileSync(join(root, "src-tauri/Cargo.lock"), "utf8");
  writeFileSync(join(root, "src-tauri/Cargo.lock"), "invalid");
  assert.throws(() => versionDesktop(root), /native version preflight/);
  assert.equal(existsSync(join(root, ".changeset/change.md")), true);
  assert.equal(
    JSON.parse(readFileSync(join(root, "package.json"))).version,
    "2026.31.6-rc.2",
  );
  writeFileSync(join(root, "src-tauri/Cargo.lock"), nativeLock);
  const result = versionDesktop(root);
  assert.equal(result.version, "2026.31.6-rc.3");
  for (const p of ["history", "current", "navigation"])
    mkdirSync(join(root, "spec/src", p), { recursive: true });
  writeFileSync(
    join(root, "spec/src/current/desktop.md"),
    "Preview intent: awaiting its reviewed version PR.\n\nHistorical qualification remains 2026.31.6-rc.2.\n",
  );
  writeFileSync(
    join(root, "spec/src/current/governance.md"),
    "[Release](distribution.md).\n",
  );
  writeFileSync(join(root, "spec/src/navigation/history-01.md"), "");
  const files = versionEvidence(result, root);
  const receipt = files.find((f) => f.startsWith("spec/src/history/"));
  const record = parseEvidence(readFileSync(join(root, receipt), "utf8"));
  assert.equal(record.result, "pending");
  assert.deepEqual(
    validateEvidence([record], new Set(["LD-REL-001", "LD-REL-004"])),
    [],
  );
  assert.ok(files.includes(".changeset/change.md"));
  assert.match(
    readFileSync(join(root, "spec/src/current/desktop.md"), "utf8"),
    /rc\.3/,
  );
  assert.match(
    readFileSync(join(root, "spec/src/current/desktop.md"), "utf8"),
    /Historical qualification remains 2026\.31\.6-rc\.2\./,
  );
  assert.equal(
    JSON.parse(readFileSync(join(root, "package.json"))).version,
    "2026.31.6-rc.3",
  );
  assert.equal(
    JSON.parse(readFileSync(join(root, "src-tauri/tauri.conf.json"))).version,
    "2026.31.6-rc.3",
  );
  assert.match(
    readFileSync(join(root, "src-tauri/Cargo.toml"), "utf8"),
    /2026\.31\.6-rc\.3/,
  );
  assert.match(
    readFileSync(join(root, "src-tauri/Cargo.lock"), "utf8"),
    /2026\.31\.6-rc\.3/,
  );
  assert.match(
    readFileSync(join(root, "CHANGELOG.md"), "utf8"),
    /## 2026\.31\.6-rc\.3/,
  );
  assert.equal(existsSync(join(root, ".changeset/change.md")), false);
  assert.throws(() => versionDesktop(root), /No Changesets release intent/);
});
