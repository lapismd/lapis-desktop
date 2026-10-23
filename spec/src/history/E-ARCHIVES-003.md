# Isolated shared-screen dependency intake

```json
{
  "id": "E-ARCHIVES-003",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.5"],
  "requirements": ["LD-MIG-002", "LD-CAT-001"],
  "versions": {
    "baseline": "52516ae9",
    "sharedUi": "d26c12a2",
    "notesApi": "e159faad",
    "pnpm": "10.34.5"
  },
  "contractReview": "Explicit isolated source roots feed built public archives. The ignored install hook routes transitive linked native dependencies to the same built package. Portable manifest ranges and tracked registry lockfiles remain unchanged by installation. No source aliases, package patches or published releases are introduced.",
  "milestoneReview": "M8.5 remains Done at its original gate. This is verified development intake tooling, not completion of shared-screen, native provider or distribution qualification. Baseline checkout and Storybook remain untouched.",
  "runs": [
    {
      "name": "linked-before",
      "command": "node --test --test-name-pattern='local built dependencies' tests/governance/local-archives.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The original hook leaves a transitive unpublished JJ History range pointed at the registry."
    },
    {
      "name": "tools-after",
      "command": "node --test tests/governance/local-archives.test.mjs tests/governance/local-dependency-sources.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "12 tests pass, retaining version checks, exact root links and tamper rejection."
    },
    {
      "name": "cohort",
      "command": "pnpm local:refresh; pnpm local:install; pnpm local:status",
      "result": "pass",
      "failures": 0,
      "note": "23 package inputs and 70 import routes verified. Notes memory correction subsequently rebuilt and reinstalled as verified public archives. Initial installs failed before fixing missing isolated package tools and transitive links; no registry fallback accepted."
    },
    {
      "name": "format",
      "command": "pnpm exec prettier --check scripts/local-archives.mjs scripts/local-dependency-sources.mjs tests/governance/local-archives.test.mjs tests/governance/local-dependency-sources.test.mjs docs/shared-ui-migration.md spec/src/current/local-dependencies.md",
      "result": "pass",
      "failures": 0,
      "note": "Tooling and review instructions use repository formatting."
    }
  ],
  "files": [
    "scripts/local-archives.mjs",
    "scripts/local-dependency-sources.mjs",
    "tests/governance/local-archives.test.mjs",
    "tests/governance/local-dependency-sources.test.mjs",
    "docs/shared-ui-migration.md",
    "spec/src/current/local-dependencies.md"
  ],
  "remaining": []
}
```
