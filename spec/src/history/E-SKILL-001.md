# Plugin-contributed skills in Desktop

```json
{
  "id": "E-SKILL-001",
  "date": "2026-11-14",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SKILL-001"],
  "files": [
    ".gitignore",
    "scripts/prepare-bundled-skills.mjs",
    "scripts/source-audit.mjs",
    "scripts/spec-contracts.mjs",
    "scripts/validation/lanes.json",
    "spec/src/backlog/distribution.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/skills.md",
    "spec/src/history/E-SKILL-001.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification/skills.md",
    "spec-validator.config.mjs",
    "src/components/ai/plugin/register-commands.ts",
    "src/lib/ai/skills/seed.ts",
    "src/lib/native/skill-management.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/skills.rs",
    "src-tauri/tauri.conf.json",
    "tests/ai/skills/seed.test.ts",
    "tests/renderer/skill-management.test.mjs"
  ],
  "contractReview": "Desktop exposes explicit main-window, vault-scoped skill management through shared native Core. Public package assets supply bundled Markdown instructions. Local edits and interrupted installation receipts remain protected.",
  "acceptanceReview": "Linux source qualification uses public built npm archives and command-line public Core/Protocol development dependencies. Real Core App and CLI cold-process tests share an isolated vault; Desktop admission is covered by renderer/native tests and compiled ordinary/e2e binaries. This does not claim installed-app or macOS headed acceptance. The final API archive also projects successful skill operations into the live vault index before completion. Source API tests prove immediate discovery and preserve immutable bindings; the catalog snapshot predates that final command-only correction. Final source archive checks pass all 761 Node cases and zero-warning renderer types; the owning API additionally passes real OPFS shared-vault writes and a cold browser-process restart.",
  "versions": {
    "api": "0.4.0 development archive",
    "markdown": "0.2.6 development archive",
    "specValidator": "0.2.0",
    "nativeSource": "lapis-server-agent-skills",
    "nativeCore": "lapis-server-agent-skills source; fixed registry/git dependencies retained in committed manifests",
    "archives": [
      {
        "name": "@lapis-notes/api",
        "version": "0.4.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/lapis-notes-api-0.4.0-764aeecb34f8.tgz",
        "sha256": "764aeecb34f8fc0c6465d7743efd452dbe767d7c8b3fbc659c7cfe23733883bf"
      },
      {
        "name": "@lapis-notes/markdown",
        "version": "0.2.6",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/lapis-notes-markdown-0.2.6-d6e0154e318e.tgz",
        "sha256": "d6e0154e318e845fff751a4eb7bf903abb62c2e3e86e9c54a344aa2735f163bc"
      },
      {
        "name": "@lapis-notes/app-profile",
        "version": "0.0.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/-lapis-notes-app-profile-2f20123af33c.tgz",
        "sha256": "2f20123af33cb23cc1a5489158332f3f4c8e66fc4d50e8ab29f417f76192e9ee"
      },
      {
        "name": "@lapismd/ai",
        "version": "0.2.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/-lapismd-ai-071f885c9c0b.tgz",
        "sha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
      }
    ],
    "nativeSourceRevision": "aee3c957",
    "apiSourceRevision": "72d81a19ee1a",
    "pluginsSourceRevision": "d9d775ee",
    "finalArchives": [
      {
        "name": "@lapis-notes/api",
        "version": "0.4.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/lapis-notes-api-0.4.0-3616fa66ac63.tgz",
        "sha256": "3616fa66ac635b2cbe6bddac2c2b3af911781989fe411b42b39ba245a86e9f1e"
      },
      {
        "name": "@lapis-notes/markdown",
        "version": "0.2.6",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/lapis-notes-markdown-0.2.6-d6e0154e318e.tgz",
        "sha256": "d6e0154e318e845fff751a4eb7bf903abb62c2e3e86e9c54a344aa2735f163bc"
      },
      {
        "name": "@lapis-notes/app-profile",
        "version": "0.0.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/-lapis-notes-app-profile-2f20123af33c.tgz",
        "sha256": "2f20123af33cb23cc1a5489158332f3f4c8e66fc4d50e8ab29f417f76192e9ee"
      },
      {
        "name": "@lapismd/ai",
        "version": "0.2.0",
        "path": "/home/steve/Projects/lapis-desktop-agent-skills/.local/skills-validation/-lapismd-ai-071f885c9c0b.tgz",
        "sha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
      }
    ],
    "catalogArchives": [
      {
        "name": "@lapis-notes/api",
        "version": "0.4.0",
        "path": "package-0.tgz",
        "sha256": "764aeecb34f8fc0c6465d7743efd452dbe767d7c8b3fbc659c7cfe23733883bf"
      },
      {
        "name": "@lapis-notes/markdown",
        "version": "0.2.6",
        "path": "package-1.tgz",
        "sha256": "d6e0154e318e845fff751a4eb7bf903abb62c2e3e86e9c54a344aa2735f163bc"
      },
      {
        "name": "@lapis-notes/app-profile",
        "version": "0.0.0",
        "path": "package-2.tgz",
        "sha256": "2f20123af33cb23cc1a5489158332f3f4c8e66fc4d50e8ab29f417f76192e9ee"
      },
      {
        "name": "@lapismd/ai",
        "version": "0.2.0",
        "path": "package-3.tgz",
        "sha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
      }
    ],
    "nativeFeatureTip": "8aa7c871d023 (same qualified runtime code; ancestor release metadata refreshed)"
  },
  "runs": [
    {
      "name": "renderer transport",
      "command": "node --test tests/renderer/skill-management.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "renderer types",
      "command": "pnpm exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings --output human",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "initial native compile",
      "command": "cargo check --manifest-path src-tauri/Cargo.toml --lib with documented local Core/Protocol patches",
      "result": "fail",
      "failures": 1,
      "note": "Tauri build resource prerequisite resources/lapis-ai was absent in the new workspace. Preparing verified host resources before rerun."
    },
    {
      "name": "native compile with public Core and Protocol development sources",
      "command": "cargo check --manifest-path src-tauri/Cargo.toml --bins with documented local patches",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "validation lane regressions",
      "command": "node --test tests/governance/validation-dispatch.test.mjs tests/governance/validation.test.mjs",
      "result": "pass",
      "tests": 28,
      "failures": 0
    },
    {
      "name": "native resource preparation",
      "command": "pnpm ai:prepare -- --reuse",
      "result": "pass",
      "failures": 0,
      "note": "Stages verified runtime helpers in the isolated workspace after the initial missing-resource compile failure."
    },
    {
      "name": "portable Node source suite, initial archive projections",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "tests": 761,
      "failures": 2,
      "note": "Temporary validation lockfiles failed registry-cohort/native-revision policy assertions. Restored both source lockfiles; no assertion weakened."
    },
    {
      "name": "portable Node source suite, registry lockfiles restored",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "tests": 761,
      "failures": 0
    },
    {
      "name": "AI seed preservation, initial retained overwrite expectation",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/skills-validation/archives.json pnpm test:ai",
      "result": "fail",
      "tests": 746,
      "failures": 1,
      "note": "The retained test expected replacement of a user edit. Replaced with fresh-content plus edit-preservation assertions."
    },
    {
      "name": "AI seed preservation exact regression",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/skills/seed.test.ts",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "complete Docker AI policy suite",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/skills-validation/archives.json pnpm test:ai",
      "result": "pass",
      "tests": 746,
      "failures": 0
    },
    {
      "name": "native tests against public development Core and Protocol",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml with documented command-line patches",
      "result": "pass",
      "tests": 260,
      "failures": 0,
      "note": "Two existing ignored tests remain ignored."
    },
    {
      "name": "ordinary and e2e strict native Clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets [--features e2e] with documented command-line patches -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "ordinary and e2e native binaries",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --bins [--features e2e] with documented command-line patches",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker renderer production build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/skills-validation/archives.json pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "source architecture and App ownership audits",
      "command": "node scripts/source-audit.mjs [--app-only]",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "initial final specification checks",
      "command": "pnpm exec spec-validator check",
      "result": "fail",
      "failures": 1,
      "note": "New Rust module order needed rustfmt. Subsequent spec-first identified three owning chapter links; a verbose Desktop cross-reference exceeded its existing byte budget and was replaced by a short link to the dedicated skills chapter. Fresh evidence coverage now includes those chapters."
    },
    {
      "name": "e2e-feature native suite",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --features e2e with documented command-line Core/Protocol patches",
      "result": "pass",
      "tests": 260,
      "failures": 0
    },
    {
      "name": "final public archive consumer source suite",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "tests": 761,
      "failures": 0
    },
    {
      "name": "final public archive renderer types and seed regression",
      "command": "pnpm exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings --output human; pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/skills/seed.test.ts",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "formatting and specification validation",
      "command": "pnpm exec prettier --check .; pnpm exec spec-validator validate --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "complete cold Docker catalog matrix",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/skills-validation/archives.json pnpm test:storybook",
      "result": "pass",
      "tests": 2136,
      "failures": 0,
      "note": "All four shards and all desktop/narrow, light/dark combinations pass with accessibility failures enabled. Result: .local/validation/runs/lapis-desktop-validation-5c91c165-80a4-402e-9381-0da4d357c23d/result.json."
    }
  ],
  "remaining": [
    "Released package/Core revision intake and packaged native application qualification remain separate release gates. macOS native/headed acceptance is on-demand only."
  ]
}
```
