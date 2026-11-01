import { sourceFindings } from "./source-audit.mjs";
import { evidenceFindings } from "./evidence.mjs";
import { validate as storybookParity } from "./spec-validation/storybook-parity.mjs";

export const name = "desktop-governance";
export function validate(context) {
  const root = context.model.repoRoot;
  try {
    return [
      ...sourceFindings(root),
      ...storybookParity(context),
      ...evidenceFindings(root).errors.map((message) => ({
        code: "LD-EVIDENCE",
        rule: "LD-GOV-004",
        file: "spec/src/current/governance.md",
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
