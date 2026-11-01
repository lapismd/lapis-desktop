// One chapter list keeps spec-first, document roles and evidence coverage aligned.
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
  "vault-backup",
  "governance",
  "local-dependencies",
  "migration",
];
export function canonicalContractPattern(prefix = "") {
  return `^${prefix}(?:current/(?:${chapters.join("|")})|backlog/markdown-review-contract)\\.md$`;
}
export const canonicalContractPath = new RegExp(
  canonicalContractPattern("spec/src/"),
  "u",
);
