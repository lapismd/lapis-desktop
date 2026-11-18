import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  projectedAuditContext,
  projectedAuditSourceInputs,
} from "../../scripts/dependency-automation/projected-audit-context.mjs";
function source() {
  const root = mkdtempSync(join(tmpdir(), "desktop-audit-context-"));
  const committed = new Map(
    projectedAuditSourceInputs.map((path) => [path, "source " + path]),
  );
  const portableManifest = Buffer.from('{"name":"@lapismd/lapis-desktop"}\n');
  const portableLock = Buffer.from("portable lock\n");
  committed.set("package.json", portableManifest.toString());
  committed.set("pnpm-lock.yaml", portableLock.toString());
  const record = "spec/src/history/E-DEPENDENCIES-999.md";
  committed.set(record, "Synthetic admission test record\n");
  for (const [path, bytes] of committed) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  }
  writeFileSync(
    join(root, "package.json"),
    '{"name":"@lapismd/lapis-desktop","dependencies":{"private":"file:verified.tgz"}}\n',
  );
  writeFileSync(join(root, "pnpm-lock.yaml"), "actual projected lock\n");
  const calls = [];
  const git = (command, args) => {
    calls.push([command, args]);
    assert.equal(command, "git");
    if (args[0] === "show") {
      const path = args[1].slice("HEAD:".length);
      assert.ok(committed.has(path));
      return committed.get(path);
    }
    assert.equal(args[0], "log");
    return "a".repeat(40) + "\n";
  };
  const args = {
    root,
    portableManifest,
    portableLock,
    decision: { record },
    git,
    archives: [
      {
        name: "private",
        version: "1.0.0",
        sourceRepository: "lapismd/source",
        sourceCommit: "b".repeat(40),
        size: 17,
        sha256: "c".repeat(64),
      },
    ],
  };
  return { root, committed, calls, args };
}
test("projected binding independently fingerprints committed portable inputs and actual installed archives", () => {
  const d = source();
  try {
    const first = projectedAuditContext(d.args);
    assert.equal(first.sourceSha, "a".repeat(40));
    assert.equal(first.recordPresent, true);
    assert.notEqual(
      first.portableManifestSha256,
      first.projection.manifestSha256,
    );
    assert.notEqual(first.portableLockSha256, first.projection.lockSha256);
    assert.match(first.projection.archivesSha256, /^[a-f0-9]{64}$/u);
    assert.deepEqual(first, projectedAuditContext(d.args));
    writeFileSync(join(d.root, "pnpm-lock.yaml"), "changed installed lock");
    assert.notEqual(
      projectedAuditContext(d.args).projection.lockSha256,
      first.projection.lockSha256,
    );
    assert.ok(d.calls.every(([, args]) => ["show", "log"].includes(args[0])));
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});
for (const path of [
  "pnpm-workspace.yaml",
  "scripts/ci-sources.json",
  "scripts/ci-audit.mjs",
  "scripts/dependency-automation/projected-audit-admission.mjs",
  "spec/src/history/E-DEPENDENCIES-999.md",
])
  test("rejects changed committed admission input " + path, () => {
    const d = source();
    try {
      writeFileSync(join(d.root, path), "changed");
      assert.throws(() => projectedAuditContext(d.args));
    } finally {
      rmSync(d.root, { recursive: true, force: true });
    }
  });
test("rejects symlinked admission inputs before reading them", () => {
  const d = source();
  try {
    const p = join(d.root, "pnpm-workspace.yaml");
    rmSync(p);
    symlinkSync(join(d.root, "scripts/ci-sources.json"), p);
    assert.throws(() => projectedAuditContext(d.args));
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});
