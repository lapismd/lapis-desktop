import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { admitProjectedDevelopmentHigh } from "./dependency-automation/projected-audit-admission.mjs";
import { projectedAuditContext } from "./dependency-automation/projected-audit-context.mjs";

function samePaths(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((path, index) => path === expected[index])
  );
}

export function auditFindings(
  all,
  production,
  policy,
  date = new Date().toISOString().slice(0, 10),
  context,
) {
  const errors = [];
  for (const report of [all, production])
    if (
      report.error ||
      !report.metadata?.vulnerabilities ||
      !report.advisories ||
      typeof report.advisories !== "object"
    )
      return ["Audit did not return a complete dependency report"];
  const productionIds = new Set(
    Object.values(production.advisories).map(
      (entry) => entry.github_advisory_id,
    ),
  );
  for (const entry of Object.values(production.advisories))
    errors.push(
      `Production advisory: ${entry.github_advisory_id} (${entry.module_name})`,
    );
  const highAccepted = admitProjectedDevelopmentHigh(
    all,
    production,
    policy.developmentHigh,
    context,
    context?.now,
  );
  const accepted = new Set();
  for (const entry of Object.values(all.advisories)) {
    if (highAccepted && entry.github_advisory_id === "GHSA-fc5q-39xc-vjpf")
      continue;
    const exception = policy.exceptions.find(
      (candidate) => candidate.advisory === entry.github_advisory_id,
    );
    const matches =
      entry.severity !== "high" &&
      exception?.status === "approved" &&
      /^\d{4}-\d{2}-\d{2}$/u.test(exception.expires) &&
      date <= exception.expires &&
      !productionIds.has(entry.github_advisory_id) &&
      entry.severity === (exception.severity ?? "low") &&
      entry.module_name === exception.package &&
      entry.findings?.length > 0 &&
      (exception.findings
        ? entry.findings.length === exception.findings.length &&
          entry.findings.every((finding) =>
            exception.findings.some(
              (expected) =>
                finding.version === expected.version &&
                samePaths(finding.paths, expected.paths),
            ),
          )
        : entry.findings.every(
            (finding) =>
              finding.version === exception.version &&
              finding.paths?.length > 0 &&
              finding.paths.every((path) => path === exception.path),
          ));
    if (matches) accepted.add(exception.advisory);
    else
      errors.push(
        `Blocking advisory: ${entry.github_advisory_id} (${entry.module_name})`,
      );
  }
  for (const exception of policy.exceptions)
    if (!accepted.has(exception.advisory))
      errors.push(
        `Remove or review stale audit exception: ${exception.advisory}`,
      );
  if (policy.developmentHigh && !highAccepted)
    errors.push("Unqualified or stale exact projected HIGH decision");
  return errors;
}

export function runAudit(projection) {
  const policyBytes = readFileSync("config/dependency-audit.json", "utf8");
  const policy = JSON.parse(policyBytes);
  let context, contextError;
  const readContext = () =>
    projectedAuditContext({ ...projection, decision: policy.developmentHigh });
  if (policy.developmentHigh) {
    try {
      context = readContext();
    } catch {
      contextError = "Projected HIGH source binding is unavailable";
    }
  }
  const reports = [];
  for (const args of [
    ["audit", "--json"],
    ["audit", "--prod", "--json"],
  ]) {
    const result = spawnSync("pnpm", args, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    console.log(`Full pnpm ${args.join(" ")} report:`);
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (result.error || ![0, 1].includes(result.status)) return 1;
    try {
      reports.push(JSON.parse(result.stdout));
    } catch {
      return 1;
    }
  }
  if (context) {
    const versions = spawnSync(
      "pnpm",
      [
        "view",
        "picomatch",
        "versions",
        "--json",
        "--registry=https://registry.npmjs.org",
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 },
    );
    try {
      if (
        versions.status !== 0 ||
        versions.error ||
        !isDeepStrictEqual(context, readContext()) ||
        readFileSync("config/dependency-audit.json", "utf8") !== policyBytes
      )
        throw Error("binding changed");
      context.officialVersions = JSON.parse(versions.stdout);
      context.now = new Date().toISOString();
    } catch {
      contextError =
        "Projected HIGH registry or final binding verification failed";
      context = undefined;
    }
  }
  const errors = auditFindings(
    reports[0],
    reports[1],
    policy,
    undefined,
    context,
  );
  if (contextError) errors.push(contextError);
  mkdirSync(".local/projected-dependency-audit", { recursive: true });
  for (const [name, report] of [
    ["all", reports[0]],
    ["production", reports[1]],
  ])
    writeFileSync(
      `.local/projected-dependency-audit/${name}.json`,
      JSON.stringify(report, null, 2),
    );
  writeFileSync(
    ".local/projected-dependency-audit/decision.json",
    JSON.stringify(
      {
        allowed: errors.length === 0,
        errors,
        highAccepted: Boolean(
          context &&
            admitProjectedDevelopmentHigh(
              reports[0],
              reports[1],
              policy.developmentHigh,
              context,
              context.now,
            ),
        ),
        sourceSha: context?.sourceSha ?? null,
        projection: context?.projection ?? null,
      },
      null,
      2,
    ),
  );
  for (const error of errors) console.error(error);
  if (!errors.length)
    console.log(
      "Audit gate passed; the exact approved development-only exception is retained above.",
    );
  return errors.length ? 1 : 0;
}
