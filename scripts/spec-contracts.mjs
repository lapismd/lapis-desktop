// One chapter list keeps spec-first, document roles and task coverage aligned.
const chapters = [
  "desktop",
  "tasks",
  "background",
  "files",
  "navigation",
  "integration",
  "windows",
  "plugins",
  "ai",
  "ai-queue",
  "ai-presentation",
  "repository",
  "repository-navigation",
  "markdown-review",
  "vault-backup",
  "governance",
  "local-dependencies",
  "migration",
];
export function canonicalContractPattern(prefix = "") {
  return `^${prefix}current/(?:${chapters.join("|")})\\.md$`;
}
export const canonicalContractPath = new RegExp(
  canonicalContractPattern("spec/src/"),
  "u",
);
