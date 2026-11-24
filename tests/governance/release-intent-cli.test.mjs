import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

test("hosted Changesets intent entry point admits real notes and rejects missing intent", (t) => {
  const root = mkdtempSync(join(tmpdir(), "desktop-intent-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const p of [".changeset", "src", "scripts"]) mkdirSync(join(root, p));
  symlinkSync(resolve("scripts/release"), join(root, "scripts/release"), "dir");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "@lapismd/lapis-desktop",
      version: "2026.31.6-rc.2",
      private: true,
    }),
  );
  writeFileSync(
    join(root, ".changeset/config.json"),
    readFileSync(".changeset/config.json"),
  );
  execFileSync("jj", ["git", "init", "--colocate", "."], {
    cwd: root,
    stdio: "pipe",
  });
  const jj = (...args) =>
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
      { cwd: root, encoding: "utf8", stdio: "pipe" },
    ).trim();
  jj("commit", "-m", "Base intent fixture");
  const base = jj("log", "-r", "@-", "--no-graph", "-T", "commit_id");
  const gate = (event) => {
    const path = join(root, "event.json");
    writeFileSync(path, JSON.stringify(event));
    return spawnSync(
      process.execPath,
      [resolve("scripts/release/check-intent.mjs")],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GITHUB_EVENT_PATH: path },
      },
    );
  };
  const event = () => ({
    pull_request: {
      base: { sha: base },
      head: { sha: jj("log", "-r", "@-", "--no-graph", "-T", "commit_id") },
    },
  });
  writeFileSync(
    join(root, ".changeset/lapis-dependencies-012345abcdef.md"),
    "---\n---\n\nMaintain SDK.\n",
  );
  jj("commit", "-m", "Independent SDK maintenance intent");
  const maintenance = gate(event());
  assert.equal(maintenance.status, 0, maintenance.stdout + maintenance.stderr);
  writeFileSync(join(root, "src/product.ts"), "export const product = true;\n");
  jj("commit", "-m", "Product missing release intent");
  const missing = gate(event());
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /new Changeset/);
  writeFileSync(
    join(root, ".changeset/feature.md"),
    '---\n"@lapismd/lapis-desktop": patch\n---\n\nShip product change.\n',
  );
  jj("commit", "-m", "Add actual release intent");
  const admitted = gate(event());
  assert.equal(admitted.status, 0, admitted.stdout + admitted.stderr);
  const notPR = gate({});
  assert.equal(notPR.status, 0, notPR.stderr);
});
