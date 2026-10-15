# Governance

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-GOV-001 | Canonical requirements MUST have unique LD IDs and exactly one verification row, remain navigable in mdBook, and stay within 400 physical lines and 32,768 UTF-8 bytes per authored specification page.                                            |
| LD-GOV-002 | Protected behavior and tooling changes MUST update their mapped canonical chapters in the same Jujutsu change. Unmapped protected paths MUST fail closed.                                                                                          |
| LD-GOV-003 | Every protected implementation slice MUST add fresh evidence with actual commands, results, failure counts, versions, affected paths, gaps and an explicit milestone review. Committed evidence MUST remain immutable.                             |
| LD-GOV-004 | Task pages MUST be the sole completion authority. Done MUST require completed dependencies and passing evidence selected for the original task gate; bookkeeping and substituted tests MUST NOT qualify product behavior.                          |
| LD-GOV-005 | Production and script files MUST stay within 300 counted lines, stories within 400 and standalone tests within 500. Production MUST NOT import test fixtures or use ambient App state, Tailwind utilities, or dependency-internal style selectors. |
| LD-GOV-006 | The desktop MUST use released registry packages, pinned toolchains and portable lockfiles. Normal builds, checks and native launch MUST work without Deno or a bundled Node runtime.                                                               |
| LD-GOV-007 | Verification MUST start at the exact affected boundary and expand according to the workspace policy. Native lifecycle changes MUST retain cold process acceptance, and visual baselines MUST require explicit human approval.                      |

Counted lines exclude blank lines and comments. Inline tests count toward their
containing production file. Generated lockfiles, icons and build output are not
authored source. No initial file-size exceptions exist.

Evidence uses a JSON metadata block inside readable Markdown. Record independent
runs and all failed attempts. An appended record may resolve an older failure;
it cannot rewrite that result. Use `enclosing-change` for evidence in the change
being verified rather than inventing a future commit hash.

## Change map

| Protected area                                                                                                                 | Required chapter |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `src/`, `src-tauri/`, `tests/desktop/`, `index.html`, Vite and Svelte configuration                                            | `desktop.md`     |
| `scripts/`, `tests/governance/`, toolchain, formatting, CI, manifests and lockfiles, `AGENTS.md`, spec-validator configuration | `governance.md`  |
| `PLAN.md`, `MIGRATION.md`, migration inventory and milestone task pages                                                        | `migration.md`   |

The executable configuration is `spec-validator.config.mjs`. Its source and
progress plugins are also normal check entry points. `spec:first` compares the
actual Jujutsu change; CI checks the complete pull-request revision range.
