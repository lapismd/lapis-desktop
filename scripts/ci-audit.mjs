import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export function auditFindings(
  all,
  production,
  policy,
  date = new Date().toISOString().slice(0, 10),
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
  const accepted = new Set();
  for (const entry of Object.values(all.advisories)) {
    const exception = policy.exceptions.find(
      (candidate) => candidate.advisory === entry.github_advisory_id,
    );
    const matches =
      exception?.status === "approved" &&
      /^\d{4}-\d{2}-\d{2}$/u.test(exception.expires) &&
      date <= exception.expires &&
      !productionIds.has(entry.github_advisory_id) &&
      entry.severity === "low" &&
      entry.module_name === exception.package &&
      entry.findings?.length > 0 &&
      entry.findings.every(
        (finding) =>
          finding.version === exception.version &&
          finding.paths?.length > 0 &&
          finding.paths.every((path) => path === exception.path),
      );
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
  return errors;
}

export function runAudit() {
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
  const policy = JSON.parse(
    readFileSync("config/dependency-audit.json", "utf8"),
  );
  const errors = auditFindings(reports[0], reports[1], policy);
  for (const error of errors) console.error(error);
  if (!errors.length)
    console.log(
      "Audit gate passed; the exact approved development-only exception is retained above.",
    );
  return errors.length ? 1 : 0;
}
