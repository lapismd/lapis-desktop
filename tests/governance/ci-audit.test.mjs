import assert from "node:assert/strict";
import test from "node:test";
import { auditFindings } from "../../scripts/ci-audit.mjs";

const advisory = {
  github_advisory_id: "GHSA-example",
  module_name: "deepmerge",
  severity: "low",
  findings: [{ version: "4.3.1", paths: [".>build>deepmerge"] }],
};
const policy = {
  exceptions: [
    {
      advisory: "GHSA-example",
      package: "deepmerge",
      version: "4.3.1",
      path: ".>build>deepmerge",
      status: "approved",
      expires: "2026-11-30",
    },
  ],
};
const report = (advisories) => ({
  advisories,
  metadata: { vulnerabilities: { low: Object.keys(advisories).length } },
});
const assess = (
  entry = advisory,
  prod = report({}),
  rules = policy,
  date = "2026-10-30",
) => auditFindings(report({ one: entry }), prod, rules, date);

test("only the exact approved development finding is accepted through its expiry", () => {
  assert.deepEqual(assess(), []);
  assert.deepEqual(assess(advisory, report({}), policy, "2026-11-30"), []);
  assert.ok(assess(advisory, report({}), policy, "2026-12-01").length);
  assert.ok(
    assess(advisory, report({}), {
      exceptions: [{ ...policy.exceptions[0], status: "proposed" }],
    }).length,
  );
});

test("production, new paths, changed versions and new advisories remain blocking", () => {
  assert.ok(
    assess(advisory, report({ one: advisory })).some((line) =>
      line.startsWith("Production"),
    ),
  );
  for (const change of [
    { github_advisory_id: "GHSA-new" },
    { module_name: "other" },
    { severity: "high" },
    { findings: [{ version: "4.3.2", paths: [".>build>deepmerge"] }] },
    {
      findings: [
        {
          version: "4.3.1",
          paths: [".>build>deepmerge", ".>runtime>deepmerge"],
        },
      ],
    },
  ])
    assert.ok(assess({ ...advisory, ...change }).length);
});

test("incomplete reports and obsolete exceptions fail closed", () => {
  assert.ok(auditFindings({ error: "network" }, report({}), policy).length);
  assert.ok(
    auditFindings(report({}), report({}), policy).some((line) =>
      line.includes("stale"),
    ),
  );
});
