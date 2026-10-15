import { sourceFindings } from "./source-audit.mjs";
import { progressFindings } from "./progress.mjs";

export const name = "desktop-governance";
export function validate(context) {
  const root = context.model.repoRoot;
  try {
    return [
      ...sourceFindings(root),
      ...progressFindings(root).errors.map((message) => ({
        code: "LD-PROGRESS",
        rule: "LD-GOV-004",
        file: "spec/src/current/progress/milestones.md",
        line: 1,
        message,
      })),
    ];
  } catch (error) {
    return [
      {
        code: "LD-GOVERNANCE-INVALID",
        rule: "LD-GOV-003",
        file: "spec/src/current/governance.md",
        line: 1,
        message: error.message,
      },
    ];
  }
}
