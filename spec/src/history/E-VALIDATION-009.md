# Linux release binaries and Storybook Pages

```json
{
  "id": "E-VALIDATION-009",
  "date": "2026-10-29",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006"],
  "contractReview": "Hosted CI keeps the macOS Native bundle and Native ARM64 acceptance jobs and adds Native Linux release binaries for x86_64-unknown-linux-gnu and aarch64-unknown-linux-gnu. Storybook Pages publishes https://lapismd.github.io/lapis-desktop/. rustfmt skips the ACP detector statement so the hosted formatter does not reflow that line. Published Notes packages and GitHub Notes main do not export the desktop workspace and API surfaces this app imports. No packages were published.",
  "milestoneReview": "M8 keeps its original Done gate. This record qualifies the hosted Linux binary jobs and Storybook Pages workflow only. It does not publish packages or promote a product, native, provider, catalog, distribution or visual gate.",
  "versions": {
    "node": "24",
    "pnpm": "10.34.5",
    "governanceTests": "44/44"
  },
  "files": [
    ".github/workflows/ci.yml",
    ".github/workflows/publish-storybook-pages.yml",
    "README.md",
    "docs/validation.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "src-tauri/tests/fixtures/acp-provider.rs",
    "tests/governance/native-lane-defaults.test.mjs",
    "tests/governance/turbo-task-graph.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Governance tests",
      "command": "node --test tests/governance/turbo-task-graph.test.mjs tests/governance/native-lane-defaults.test.mjs tests/governance/desktop-test-mode.test.mjs tests/governance/local-macos-build-exclusion.test.mjs tests/governance/validation.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "44/44. Linux targets and both macOS native jobs stay in the workflow. Storybook Pages pins Node 24 and the v6 checkout, setup-node and pnpm actions."
    },
    {
      "name": "Rust format file list",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check --files-with-diff",
      "result": "pass",
      "failures": 0,
      "detail": "No files listed. rustfmt skips the detector statement so the formatter does not reflow it."
    }
  ]
}
```

Hosted Linux jobs build release binaries with the same Node 24, pnpm and Rust
1.99 toolchain as the macOS native jobs, then upload each binary. Storybook
Pages uses the sibling install projection because Agent UI, Repository UI and
App Profile are unpublished.
