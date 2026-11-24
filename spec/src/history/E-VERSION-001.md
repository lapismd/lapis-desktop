# Preview version intent preserves prior qualification

```json
{
  "id": "E-VERSION-001",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REL-001", "LD-REL-004"],
  "files": [
    "scripts/release/version-evidence.mjs",
    "tests/governance/release-version-evidence.test.mjs",
    "tests/governance/release-version.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-VERSION-001.md"
  ],
  "versions": {
    "base": "1575dd0211964ee321b29704bbb713827c01f98e",
    "generatedVersionPr": "62",
    "previousVersion": "2026.31.6-rc.2",
    "plannedVersion": "2026.31.6-rc.3"
  },
  "contractReview": "Version intent cannot transfer qualification from earlier source. Review of generated PR62 shows global previous-version replacement relabeling an rc.2 qualification sentence as rc.3 while retaining E-CLI-007. Preserve historical prose and links, change one dedicated version-intent anchor, and reference the generated pending receipt. Missing or duplicate anchors fail closed. Publication, source identity, SDK context and platform gates remain unchanged.",
  "acceptanceReview": "The exact owner regression fails twice before the repair: earlier qualification is relabeled, and a missing anchor does not reject. Both controls pass after the repair, including a second future rc transition. The real Changesets bootstrap fixture additionally retains its old-version qualification sentence. Generated PR62 must be refreshed by its source-owned workflow after this repair merges, then independently qualify source, artifacts and publication. No manually edited bot version branch or waiver.",
  "runs": [
    {
      "name": "Version history regression before",
      "command": "node --test tests/governance/release-version-evidence.test.mjs",
      "result": "fail",
      "failures": 2,
      "passed": 0
    },
    {
      "name": "Version history regression after",
      "command": "node --test tests/governance/release-version-evidence.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 2
    },
    {
      "name": "Affected release tooling",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "passed": 41,
      "failures": 0
    },
    {
      "name": "First formatted real-source comparison",
      "command": "node /tmp/lapis-desktop-api0614-version-smoke.mjs; compare formatted generated Desktop prose with source outside the intent marker",
      "result": "fail",
      "failures": 1,
      "detail": "Prettier joined the initial intent marker and historical sentence in one paragraph, so the marker consumed old-version text. Give the marker its own paragraph and admit only the exact initial/generated marker forms. Add rejection for joined historical text."
    },
    {
      "name": "Corrected real-source version generation and history comparison",
      "command": "node /tmp/lapis-desktop-api0614-version-smoke.mjs; compare formatted generated Desktop prose with source outside the intent marker",
      "result": "pass",
      "failures": 0,
      "detail": "Both real Changesets notes generate rc.3 with synchronized identities and renewed context; all Desktop prose and historical links outside the intent marker remain byte-identical after formatting. Generated governance stays400 lines/32749 bytes. No public candidate or publication claimed."
    },
    {
      "name": "Second formatted version transition",
      "command": "versionEvidence(previousVersion=rc.3, version=rc.4); source-owned Prettier; compare Desktop prose outside the dedicated intent marker",
      "result": "pass",
      "failures": 0,
      "detail": "An isolated copy of the actual formatted rc.3 output generates one rc.4 pending intent linked to its new receipt. All other Desktop prose and historical qualification links remain byte-identical."
    },
    {
      "name": "Full portable application test surface",
      "command": "LAPIS_DESKTOP_BASE=1575dd0211964ee321b29704bbb713827c01f98e LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test",
      "result": "pass",
      "passed": 2013,
      "failures": 0,
      "detail": "971 governance/renderer,749 AI and293 Rust cases pass; two existing Rust ignores remain. No assertion, skip, baseline or production fixture is loosened."
    },
    {
      "name": "Portable application build",
      "command": "LAPIS_DESKTOP_BASE=1575dd0211964ee321b29704bbb713827c01f98e LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "The ordinary renderer builds successfully; existing large-chunk advisories remain warnings."
    },
    {
      "name": "Full portable specification",
      "command": "LAPIS_DESKTOP_BASE=1575dd0211964ee321b29704bbb713827c01f98e LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All five lanes pass, including source/parity/evidence validation, canonical intake, Rust formatting, mdbook and spec-first."
    },
    {
      "name": "Final portable source check",
      "command": "LAPIS_DESKTOP_BASE=1575dd0211964ee321b29704bbb713827c01f98e LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Canonical intake, all117 story families with zero composition findings, source/spec validation, zero type errors/warnings, strict normal/e2e Clippy and repository formatting pass on the final helper/marker shape."
    }
  ],
  "remaining": [
    "Exact-head CI and regenerated version PR",
    "Candidate publication and public Homebrew delivery"
  ]
}
```
