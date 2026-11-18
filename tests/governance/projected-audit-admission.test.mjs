import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import {
  admitProjectedDevelopmentHigh,
  desktopHighIdentity,
} from "../../scripts/dependency-automation/projected-audit-admission.mjs";
import { auditFindings } from "../../scripts/ci-audit.mjs";
const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const full = read("../fixtures/desktop-audit-full.json");
const production = read("../fixtures/desktop-audit-production.json");
const sourcePolicy = read("../../config/dependency-audit.json");
const legacy = { exceptions: sourcePolicy.exceptions };
const now = "2026-11-18T02:00:00.000Z";
function fixture() {
  const projection = {
    platform: "linux-x64",
    manifestSha256: "a".repeat(64),
    lockSha256: "b".repeat(64),
    archivesSha256: "c".repeat(64),
  };
  const bound = {
    sourceInputsSha256: "d".repeat(64),
    portableManifestSha256: "e".repeat(64),
    portableLockSha256: "f".repeat(64),
    workspaceSha256: "1".repeat(64),
    sourceInventorySha256: "2".repeat(64),
  };
  const decision = {
    schemaVersion: 1,
    repository: "lapismd/lapis-desktop",
    authority: "explicit-user",
    approvedAt: "2026-11-18T01:00:00.000Z",
    expiresAt: "2026-11-20T00:00:00.000Z",
    sourceSha: "3".repeat(40),
    bindings: { ...bound, projections: [projection] },
    finding: structuredClone(desktopHighIdentity),
    record: "spec/src/history/E-DEPENDENCIES-999.md",
  };
  const context = {
    sourceSha: decision.sourceSha,
    ...bound,
    projection,
    projectedManifest: {
      name: "@lapismd/lapis-desktop",
      devDependencies: {
        "@storybook/addon-docs": "10.6.5",
        "@wdio/mocha-framework": "9.32.0",
      },
    },
    recordPresent: true,
    officialVersions: ["2.3.2", "4.0.7"],
    now,
  };
  return {
    all: structuredClone(full),
    production: structuredClone(production),
    decision,
    context,
  };
}
const assess = (d) =>
  admitProjectedDevelopmentHigh(
    d.all,
    d.production,
    d.decision,
    d.context,
    d.context.now,
  );
test("complete legacy audit retains the HIGH block without a separate decision", () => {
  const errors = auditFindings(full, production, legacy, "2026-11-18");
  assert.deepEqual(errors, [
    "Blocking advisory: GHSA-fc5q-39xc-vjpf (picomatch)",
  ]);
});
test("synthetic explicit decision control accepts only exact two-version source/projected scope", () => {
  const d = fixture();
  assert.equal(assess(d), true);
  assert.deepEqual(
    auditFindings(
      d.all,
      d.production,
      { ...legacy, developmentHigh: d.decision },
      "2026-11-18",
      d.context,
    ),
    [],
  );
});
for (const [name, mutate] of [
  ["missing decision", (d) => (d.decision = undefined)],
  ["delegated authority", (d) => (d.decision.authority = "delegated-operator")],
  ["disabled proposal", (d) => (d.decision.status = "disabled")],
  ["extra policy field", (d) => (d.decision.ignoreAll = true)],
  ["foreign repository", (d) => (d.decision.repository = "lapismd/other")],
  [
    "future approval",
    (d) => (d.decision.approvedAt = "2026-11-18T03:00:00.000Z"),
  ],
  ["expired boundary", (d) => (d.context.now = d.decision.expiresAt)],
  [
    "duration over48h",
    (d) => (d.decision.approvedAt = "2026-11-16T23:00:00.000Z"),
  ],
  [
    "deadline extension",
    (d) => (d.decision.expiresAt = "2026-11-20T00:00:00.001Z"),
  ],
  ["source change", (d) => (d.context.sourceSha = "4".repeat(40))],
  [
    "source byte change",
    (d) => (d.context.sourceInputsSha256 = "4".repeat(64)),
  ],
  [
    "portable manifest change",
    (d) => (d.context.portableManifestSha256 = "4".repeat(64)),
  ],
  [
    "portable lock change",
    (d) => (d.context.portableLockSha256 = "4".repeat(64)),
  ],
  ["workspace change", (d) => (d.context.workspaceSha256 = "4".repeat(64))],
  [
    "source inventory change",
    (d) => (d.context.sourceInventorySha256 = "4".repeat(64)),
  ],
  [
    "installed lock change",
    (d) =>
      (d.context.projection = {
        ...d.context.projection,
        lockSha256: "4".repeat(64),
      }),
  ],
  [
    "archive change",
    (d) =>
      (d.context.projection = {
        ...d.context.projection,
        archivesSha256: "4".repeat(64),
      }),
  ],
  [
    "installed manifest change",
    (d) =>
      (d.context.projection = {
        ...d.context.projection,
        manifestSha256: "4".repeat(64),
      }),
  ],
  [
    "unqualified platform",
    (d) =>
      (d.context.projection = {
        ...d.context.projection,
        platform: "darwin-arm64",
      }),
  ],
  [
    "duplicate projection",
    (d) =>
      d.decision.bindings.projections.push(d.decision.bindings.projections[0]),
  ],
  ["missing record", (d) => (d.context.recordPresent = false)],
  [
    "unknown registry evidence",
    (d) => (d.context.officialVersions = undefined),
  ],
  [
    "available stable successor",
    (d) => d.context.officialVersions.push("4.0.8"),
  ],
  [
    "runtime first hop",
    (d) =>
      (d.context.projectedManifest.dependencies = {
        "@storybook/addon-docs": "10.6.5",
      }),
  ],
  [
    "runtime affected package",
    (d) => (d.context.projectedManifest.peerDependencies = { picomatch: "*" }),
  ],
  [
    "extra severity count",
    (d) => (d.all.metadata.vulnerabilities.critical = 1),
  ],
  ["missing muted evidence", (d) => delete d.all.muted],
  ["malformed production evidence", (d) => (d.production.advisories = [])],
  ["muted evidence", (d) => (d.all.muted = ["advisory"])],
  ["production finding", (d) => (d.production.advisories = d.all.advisories)],
  ["production count", (d) => (d.production.metadata.vulnerabilities.high = 1)],
  [
    "missing approved path",
    (d) =>
      Object.values(d.all.advisories)
        .find((a) => a.severity === "high")
        .findings.pop(),
  ],
  [
    "changed advisory range",
    (d) =>
      (Object.values(d.all.advisories).find(
        (a) => a.severity === "high",
      ).vulnerable_versions = "<=4.0.8"),
  ],
  [
    "known patch",
    (d) =>
      (Object.values(d.all.advisories).find(
        (a) => a.severity === "high",
      ).patched_versions = ">=4.0.8"),
  ],
  [
    "changed version",
    (d) =>
      (Object.values(d.all.advisories).find(
        (a) => a.severity === "high",
      ).findings[0].version = "4.0.6"),
  ],
  [
    "extra path",
    (d) =>
      Object.values(d.all.advisories)
        .find((a) => a.severity === "high")
        .findings[0].paths.push(".>other>picomatch"),
  ],
])
  test("rejects " + name + " without mutating raw evidence", () => {
    const d = fixture();
    mutate(d);
    const saved = structuredClone(d);
    assert.equal(assess(d), false);
    assert.deepEqual(d, saved);
  });
test("legacy MODERATE decisions and unrelated findings remain blocking", () => {
  const d = fixture();
  d.all.advisories.extra = {
    github_advisory_id: "GHSA-extra",
    module_name: "other",
    severity: "moderate",
    findings: [{ version: "1.0.0", paths: [".>tool>other"] }],
  };
  assert.ok(
    auditFindings(
      d.all,
      d.production,
      { ...legacy, developmentHigh: d.decision },
      "2026-11-18",
      d.context,
    ).some((e) => e.includes("GHSA-extra")),
  );
  const clean = {
    advisories: {},
    muted: [],
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
    },
  };
  assert.ok(
    auditFindings(
      clean,
      clean,
      { exceptions: [], developmentHigh: d.decision },
      "2026-11-18",
      d.context,
    ).some((e) => e.includes("stale")),
  );
});

test("legacy severity entries cannot bypass the separately bound HIGH decision", () => {
  const high = {
    ...desktopHighIdentity,
    status: "approved",
    expires: "2026-11-30",
  };
  const errors = auditFindings(
    full,
    production,
    { exceptions: [...legacy.exceptions, high] },
    "2026-11-18",
  );
  assert.ok(
    errors.some((e) => e.includes("Blocking advisory: GHSA-fc5q-39xc-vjpf")),
  );
});

test("a disabled proposal grants no authority; a separate exact source decision is required", () => {
  const proposal = read(
    "../../.github/dependency-automation/development-high-proposal.json",
  );
  assert.equal(proposal.status, "disabled");
  assert.equal(proposal.authority, null);
  assert.equal(proposal.approvedAt, null);
  assert.equal(proposal.expiresAt, "2026-11-20T00:00:00.000Z");
  assert.deepEqual(proposal.finding, desktopHighIdentity);
  const decision = sourcePolicy.developmentHigh;
  if (!decision) assert.equal(decision, undefined);
  else {
    assert.equal(decision.authority, "explicit-user");
    assert.equal(decision.repository, "lapismd/lapis-desktop");
    assert.deepEqual(decision.finding, proposal.finding);
    assert.match(decision.sourceSha, /^[a-f0-9]{40}$/u);
    assert.equal(decision.sourceSha, proposal.sourceSha);
    assert.deepEqual(decision.bindings, proposal.bindings);
    assert.ok(decision.bindings.projections.length > 0);
    assert.equal(decision.expiresAt, proposal.expiresAt);
    const duration =
      Date.parse(decision.expiresAt) - Date.parse(decision.approvedAt);
    assert.ok(duration > 0 && duration <= 48 * 60 * 60 * 1000);
    assert.equal(decision.record, proposal.record);
    assert.match(decision.record, /^spec\/src\/history\/E-[A-Z]+-\d{3}\.md$/u);
    assert.equal(
      existsSync(new URL("../../" + decision.record, import.meta.url)),
      true,
    );
  }
});
