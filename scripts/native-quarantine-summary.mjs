import { appendFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = ".local/native-test";
const reports = existsSync(root)
  ? readdirSync(root).flatMap((name) => {
      const path = join(root, name, "quarantine-results.json");
      return existsSync(path) ? [path] : [];
    })
  : [];
let summary =
  "## Quarantine diagnostics\n\nSeparate diagnostic evidence; never full source qualification.\n\n";
let included = 0;
for (const path of reports) {
  const report = JSON.parse(readFileSync(path, "utf8"));
  const attemptPath = join(path, "..", "quarantine-attempt.json");
  const attempt = JSON.parse(readFileSync(attemptPath, "utf8"));
  if (
    process.env.GITHUB_RUN_ID &&
    (attempt.runId !== process.env.GITHUB_RUN_ID ||
      attempt.runAttempt !== process.env.GITHUB_RUN_ATTEMPT)
  )
    continue;
  included += 1;
  summary += `Source: ${attempt.source}; attempt ${attempt.runId ?? "local"}/${attempt.runAttempt ?? "local"}; artifact: ${attempt.artifact}.\n\n`;
  summary += `Report: ${path}\n\n| Case | Outcome |\n| --- | --- |\n`;
  for (const entry of report.cases)
    summary += `| ${entry.id} | ${entry.status} |\n`;
  summary += `\n${report.executed} executed, ${report.passed} passed, ${report.failed} failed. Original assertions and default quarantine remain.\n\n`;
}
if (included === 0)
  summary +=
    "No diagnostic result report was produced; intended cases are not proven executed.\n";
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
