# Repaired signed Bases bundle native adoption

```json
{
  "id": "E-DEPENDENCY-003",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.3"],
  "requirements": ["LD-GOV-006", "LD-GOV-008", "LD-PLUG-003"],
  "contractReview": "Qualify the separately test-signed Bases bundle through the existing actual native plugin loader and App-owned database/write/watch facade. The 26-package UI catalog cohort does not load this installed bundle and cannot substitute for its native persistence/restart check. No fixture helper, plugin, package manifest, signing policy or product source is changed.",
  "milestoneReview": "The repaired Bases bundle native adoption boundary passes. Existing M8.3 completion is retained; this focused receipt does not complete the aggregate dependency/catalog intake, M10/M15, Rust indexing, plugin installation transactions, default cutover, publication or distribution.",
  "versions": {
    "desktopSource": "c83736e9f828ecdb2350de7a4a61075f310c65c1",
    "nativeBinarySha256": "7386432b00de597ffdcf38382b62091611352986a64faeb2b200de6ccf2d9a10",
    "basesSignedSource": "5b6a1e56dce89380daa2b30de7249ee33e25bfe4",
    "basesCommittedEquivalent": "1faa35a130e35fc18ead748f17e21c93d85d951a",
    "csvPrerequisite": "aa71d8fc",
    "basesVersion": "0.1.4",
    "signedArchiveSha256": "826f5c0aad07675effbf3abc43b144ae936ec0e8f73e584ef23acd5d22132eb7",
    "npmArchiveSha256": "02b2392b2e9bb06f6a66c782c65369117a1729958183dea91884472d5c9df877",
    "fixtureManifestSha256": "d255f9b3397c5d055d70618acf04c05c804216c7784b186b8fe7bfbb3d0af021",
    "renderer": "svelte/renderer/5.56.10"
  },
  "runs": [
    {
      "name": "signed-source-equivalence",
      "command": "jj diff --from 5b6a1e56dce89380daa2b30de7249ee33e25bfe4 --to 1faa35a1 --summary",
      "result": "pass",
      "failures": 0,
      "note": "Only three source-owned specification/evidence files differ; no plugin code, package input or compiled artifact is rebuilt or re-signed. Signed source identity is retained rather than rewritten to a later documentation commit."
    },
    {
      "name": "actual-native-installed-bases",
      "command": "LAPIS_DESKTOP_PORTABLE_FIXTURES=<qualified-bases-manifest> LAPIS_DESKTOP_ACCEPTANCE_ROOT=<new-isolated-root> node --test --test-concurrency=1 --test-name-pattern=\"portable Bases queries native metadata\" tests/desktop/portable-database.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "One exact existing native case passes in 9.505 seconds, zero skips. The unchanged harness verifies archive SHA, Ed25519 signature, signed source identity and every installed payload byte before app launch. The real Bases table queries native metadata, edits owner via its public combobox, persists frontmatter, reflects an external edit and cold-reopens with the changed owner while Projects.base stays byte-identical. Both app processes close normally. Receipt .local/native-test/current-bases-8R2NQP/receipt.json and bases-native-current.log are retained. No other plugin/native case is claimed."
    },
    {
      "name": "authoring-validation-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "A temporary top-level node_modules symlink was treated as a tracked file because the existing ignore rule covers directories. Removed that symlink and used a real ignored node_modules directory for documentation tools; no production import, installed package bytes or ignore policy was changed. The fresh source snapshot must contain no node_modules entry."
    },
    {
      "name": "authoring-progress-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The concurrent first authoring check sees the same temporary tracked node_modules symlink. Its failed output is retained; the source now contains only the seven intended documentation paths and a normal ignored tooling directory."
    },
    {
      "name": "authoring-validation-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Six validators, 342 chapters and 108 requirements pass after removing the temporary source-snapshot artifact. This is documentation validation only; native product acceptance is the separate existing one-case command above."
    },
    {
      "name": "authoring-progress-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "51 tasks and 300 evidence records pass; only intended documentation paths are tracked."
    },
    {
      "name": "authoring-specification-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Validation, Rust formatting and mdBook pass; spec-first requires the mapped migration chapter for the changed local dependency contract. Fold the new bounded Bases reference into the existing two-line current-intake paragraph; preserve its 400-line limit."
    },
    {
      "name": "authoring-specification-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four canonical lanes pass: validate, Rust formatting, mdBook and mapped spec-first. This evidence-only refresh deliberately uses the installed pinned documentation tools; it neither runs nor substitutes portable product suites. The actual macOS Bases case above independently qualifies installed-bundle persistence."
    }
  ],
  "files": [
    "MIGRATION.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/E-DEPENDENCY-003.md",
    "spec/src/current/migration.md"
  ],
  "remaining": []
}
```

This is a separate dynamic installed-plugin acceptance receipt. It does not
qualify all nine Select triggers in the native app; their complete source
interaction/accessibility gate remains in the owning Bases source evidence. The
existing owner combobox, persistence and cold restart are exercised here. The
selected test key and fixture vault are disposable; no installed user app,
profile, release artifact or registry state is replaced.
