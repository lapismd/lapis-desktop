# Sibling install projection

```json
{
  "id": "E-VALIDATION-008",
  "date": "2026-10-29",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-GOV-010"],
  "contractReview": "Hosted CI cannot frozen-install the tracked lock. Agent UI, Repository UI and App Profile are unpublished, and Turbo is not in that lock. The workflow builds those sibling checkouts, projects the three registry ranges onto the checkouts for one install, then restores the tracked manifest and lockfile. macOS runners install the pinned Jujutsu archive because the hosted tool installer has no container image there. Published pins stay @lapismd/mira ~0.1.2, @lapismd/jj-history ~0.1.0, and lapis-ai git tag v0.2.0.",
  "milestoneReview": "M8 keeps its original Done gate. This record qualifies the hosted install projection only. It does not publish packages or promote a product, native, provider, catalog, distribution or visual gate.",
  "versions": {
    "node": "24",
    "pnpm": "10.34.5",
    "governanceTests": "42/42"
  },
  "files": [
    ".github/workflows/ci.yml",
    "docs/validation.md",
    "scripts/ci-install.mjs",
    "scripts/ci-prepare-links.mjs",
    "scripts/validation/install-tools.mjs",
    "spec/src/SUMMARY.md",
    "tests/governance/turbo-task-graph.test.mjs",
    "tests/governance/validation.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Governance tests",
      "command": "node --test tests/governance/turbo-task-graph.test.mjs tests/governance/native-lane-defaults.test.mjs tests/governance/desktop-test-mode.test.mjs tests/governance/local-macos-build-exclusion.test.mjs tests/governance/validation.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "42/42. Unpublished packages stay registry ranges until the install projection. Hosted workflows pin Node 24 and the macOS Jujutsu archive. Cargo tasks and the catalog browser stay in separate Turbo invocations."
    },
    {
      "name": "Source audit",
      "command": "node scripts/source-audit.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass."
    },
    {
      "name": "Spec-first mapping",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "18 protected files, 2 canonical chapters (governance.md and migration.md)."
    },
    {
      "name": "Specification check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Validate passed, including progress coverage and chapter limits. rust-format then failed on the untouched canary fixture. This slice does not edit that file."
    }
  ]
}
```

Hosted jobs install from the sibling projection. The tracked lock stays
portable, and a registry-only install remains unqualified until those three
packages are published.
