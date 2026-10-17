// One chapter list keeps spec-first, document roles and task coverage aligned.
const chapters = [
  "desktop",
  "files",
  "navigation",
  "integration",
  "windows",
  "plugins",
  "ai",
  "repository",
  "governance",
  "migration",
];
export function canonicalContractPattern(prefix = "") {
  return `^${prefix}current/(?:${chapters.join("|")})\\.md$`;
}
export const canonicalContractPath = new RegExp(
  canonicalContractPattern("spec/src/"),
  "u",
);
