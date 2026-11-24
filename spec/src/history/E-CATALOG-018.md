# Measured repository Snapshot tag acceptance

```json
{
  "id": "E-CATALOG-018",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REPO-004", "LD-CAT-002"],
  "files": [
    "catalog/plugins/repository/Operations.stories.ts",
    "spec/src/current/plugins.md",
    "spec/src/current/repository-review.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-CATALOG-018.md"
  ],
  "versions": {
    "base": "ababda93b774a0773c4b00f8f8eb4928e884f6e7",
    "history": "0.5.1",
    "designCore": "0.13.5",
    "specValidator": "0.2.1"
  },
  "contractReview": "History maps is_snapshot to the Snapshot operation tag. Published Design Core TagList intentionally renders inert aria-hidden measurement copies, then exposes measured chips as accessible list items. The Desktop story must await that presentation in the marked operation row, retaining exact Snapshot text and visibility. No product override or shared component fix is justified by the text-query race.",
  "acceptanceReview": "The previous findAllByText(...)[0] can return an intentionally invisible measuring copy before the first measured frame. Hosted shard1 has one Snapshot assertion failure and133 passing desktop/light cases. Query the semantic Operation graph, marked row and Operation tags list, then await its exact visible list item. Keep all other operation interactions and real application fixtures unchanged; no timing sleep, extended timeout, skip or baseline changes.",
  "runs": [
    {
      "name": "Original hosted Snapshot regression",
      "command": "LAPIS_DESKTOP_CATALOG_SHARD=1 LAPIS_DESKTOP_CATALOG_PROFILE=full pnpm ci:storybook-interaction; catalog/plugins/repository/Operations.stories.ts > Snapshot",
      "result": "fail",
      "passed": 133,
      "failures": 1,
      "detail": "Run45318913949 job138194390091, desktop/light: selected tag-label span is not visible. The failing report is retained locally from artifact14887525930."
    },
    {
      "name": "Unmodified exact local reproduction",
      "command": "LAPIS_DESKTOP_BASE=ababda93b774a0773c4b00f8f8eb4928e884f6e7 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook -- catalog/plugins/repository/Operations.stories.ts -t Snapshot",
      "result": "pass",
      "passed": 4,
      "failures": 0,
      "detail": "The old assertion passes in four cold viewport/theme variants locally; the hosted failure remains recorded; the cold local run does not reproduce it. Nine nonmatching cases per variant are caller-filtered, not new source skips."
    },
    {
      "name": "Catalog parity regression controls",
      "command": "node --test tests/governance/storybook-parity.test.mjs",
      "result": "pass",
      "passed": 32,
      "failures": 0
    },
    {
      "name": "Repaired exact Snapshot cold run",
      "command": "LAPIS_DESKTOP_BASE=ababda93b774a0773c4b00f8f8eb4928e884f6e7 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook -- catalog/plugins/repository/Operations.stories.ts -t Snapshot",
      "result": "pass",
      "passed": 4,
      "failures": 0,
      "detail": "The exact visible tag on the marked operation row passes in desktop/light, narrow/light, desktop/dark and narrow/dark. Nine nonmatching cases per variant are caller-filtered. All existing assertions outside this case are unchanged."
    },
    {
      "name": "Complete affected operation-log catalog",
      "command": "LAPIS_DESKTOP_BASE=ababda93b774a0773c4b00f8f8eb4928e884f6e7 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook -- catalog/plugins/repository/Operations.stories.ts",
      "result": "pass",
      "passed": 40,
      "failures": 0,
      "detail": "All ten operation-log stories pass in each of four viewport/theme variants, including graph/changes, root, merge-parent choice, retained pins, both failure/recovery paths, multiple heads, empty, Snapshot and parent-metadata recovery. Cold Docker rune04e4a3c-63e6-4757-9682-6714f8c3e389; no source skips or fixture changes."
    },
    {
      "name": "Portable type gate",
      "command": "LAPIS_DESKTOP_BASE=ababda93b774a0773c4b00f8f8eb4928e884f6e7 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Svelte check reports zero errors and zero warnings."
    },
    {
      "name": "Full portable specification and governance",
      "command": "LAPIS_DESKTOP_BASE=ababda93b774a0773c4b00f8f8eb4928e884f6e7 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All five lanes pass: validation including source/parity/evidence, canonical dependency intake, Rust formatting, mdbook and spec-first."
    }
  ],
  "remaining": ["Exact-head full hosted CI and separate release/Homebrew gates"]
}
```
