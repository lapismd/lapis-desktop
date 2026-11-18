import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const legacy = read("../../config/dependency-audit.json");
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
    expiresAt: "2026-11-19T00:00:00.000Z",
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
test("source policy remains unapproved and actual complete audit still blocks HIGH", () => {
  assert.equal(legacy.developmentHigh, undefined);
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
    (d) => (d.decision.expiresAt = "2026-11-19T00:00:00.001Z"),
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

test("the source-specific proposal remains disabled and grants no active authority", () => {
  const proposal = read(
    "../../.github/dependency-automation/development-high-proposal.json",
  );
  assert.equal(proposal.status, "disabled");
  assert.equal(proposal.authority, null);
  assert.equal(proposal.approvedAt, null);
  assert.equal(proposal.expiresAt, "2026-11-19T00:00:00.000Z");
  assert.deepEqual(proposal.finding, desktopHighIdentity);
  assert.equal(legacy.developmentHigh, undefined);
});
