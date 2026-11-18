import { isDeepStrictEqual as equal } from "node:util";
const identity = {
  advisory: "GHSA-fc5q-39xc-vjpf",
  package: "picomatch",
  severity: "high",
  findings: [
    { version: "4.0.7", paths: [".>@storybook/addon-docs>unplugin>picomatch"] },
    {
      version: "2.3.2",
      paths: [".>@wdio/mocha-framework>mocha>chokidar>anymatch>picomatch"],
    },
  ],
};
export const desktopHighIdentity = identity;
const keys = (value, expected) =>
  value &&
  !Array.isArray(value) &&
  equal(Object.keys(value).sort(), [...expected].sort());
const digest = (s) => /^[a-f0-9]{64}$/u.test(s ?? "");
const counts = { info: 0, low: 0, moderate: 3, high: 2, critical: 0 };
const clean = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
export function admitProjectedDevelopmentHigh(
  all,
  production,
  decision,
  context,
  now = new Date().toISOString(),
) {
  if (
    !decision ||
    !context ||
    !keys(decision, [
      "schemaVersion",
      "repository",
      "authority",
      "approvedAt",
      "expiresAt",
      "sourceSha",
      "bindings",
      "finding",
      "record",
    ]) ||
    decision.schemaVersion !== 1 ||
    decision.repository !== "lapismd/lapis-desktop" ||
    decision.authority !== "explicit-user" ||
    !equal(decision.finding, identity)
  )
    return false;
  const start = Date.parse(decision.approvedAt),
    end = Date.parse(decision.expiresAt),
    time = Date.parse(now);
  if (
    ![start, end, time].every(Number.isFinite) ||
    start > time ||
    time >= end ||
    end <= start ||
    end - start > 48 * 60 * 60 * 1000 ||
    end > Date.parse("2026-11-20T00:00:00.000Z")
  )
    return false;
  if (
    !/^[a-f0-9]{40}$/u.test(decision.sourceSha ?? "") ||
    decision.sourceSha !== context.sourceSha ||
    !/^spec\/src\/history\/E-[A-Z]+-\d{3}\.md$/u.test(decision.record ?? "") ||
    context.recordPresent !== true
  )
    return false;
  const fields = [
    "sourceInputsSha256",
    "portableManifestSha256",
    "portableLockSha256",
    "workspaceSha256",
    "sourceInventorySha256",
  ];
  const projectionFields = [
    "platform",
    "manifestSha256",
    "lockSha256",
    "archivesSha256",
  ];
  const bindings = decision.bindings;
  if (
    !keys(bindings, [...fields, "projections"]) ||
    fields.some(
      (key) => !digest(bindings[key]) || bindings[key] !== context[key],
    ) ||
    !Array.isArray(bindings.projections) ||
    !bindings.projections.length ||
    bindings.projections.length > 3 ||
    new Set(bindings.projections.map((p) => p.platform)).size !==
      bindings.projections.length ||
    bindings.projections.some(
      (p) =>
        !keys(p, projectionFields) ||
        !/^(linux-x64|darwin-arm64|darwin-x64)$/u.test(p.platform) ||
        projectionFields.slice(1).some((k) => !digest(p[k])),
    ) ||
    !bindings.projections.some((p) => equal(p, context.projection))
  )
    return false;
  if (
    !equal(all.metadata?.vulnerabilities, counts) ||
    !equal(production.metadata?.vulnerabilities, clean) ||
    !equal(all.muted, []) ||
    !equal(production.muted, []) ||
    Object.keys(production.advisories ?? {}).length
  )
    return false;
  if (
    !all.advisories ||
    !production.advisories ||
    Array.isArray(all.advisories) ||
    Array.isArray(production.advisories)
  )
    return false;
  const high = Object.values(all.advisories ?? {}).filter(
    (a) => a.severity === "high",
  );
  if (high.length !== 1) return false;
  const entry = high[0];
  if (
    entry.github_advisory_id !== identity.advisory ||
    entry.module_name !== identity.package ||
    entry.vulnerable_versions !== "<=4.0.7" ||
    entry.patched_versions !== "<0.0.0" ||
    !equal(entry.findings, identity.findings)
  )
    return false;
  const manifest = context.projectedManifest;
  if (
    manifest?.name !== "@lapismd/lapis-desktop" ||
    !manifest?.devDependencies?.["@storybook/addon-docs"] ||
    !manifest.devDependencies["@wdio/mocha-framework"] ||
    ["dependencies", "optionalDependencies", "peerDependencies"].some(
      (section) =>
        ["picomatch", "@storybook/addon-docs", "@wdio/mocha-framework"].some(
          (name) => manifest[section]?.[name],
        ),
    )
  )
    return false;
  const versions = context.officialVersions;
  if (
    !Array.isArray(versions) ||
    !versions.includes("2.3.2") ||
    !versions.includes("4.0.7") ||
    versions.some((v) => {
      if (!/^\d+\.\d+\.\d+$/u.test(v)) return false;
      const [a, b, c] = v.split(".").map(Number);
      return a > 4 || (a === 4 && (b > 0 || c > 7));
    })
  )
    return false;
  return true;
}
