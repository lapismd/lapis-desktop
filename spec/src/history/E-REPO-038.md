# Main integration of automatic vault backup

```json
{
  "id": "E-REPO-038",
  "tasks": ["M14", "M14.7"],
  "requirements": [
    "LD-REPO-005",
    "LD-CAT-003",
    "LD-HOST-001",
    "LD-GOV-004",
    "LD-MIG-002",
    "LD-DESK-003"
  ],
  "date": "2026-10-19",
  "result": "pass",
  "revision": "enclosing-change",
  "versions": {
    "desktopImplementation": "a4ce183a",
    "sourceAdoption": "d45b03eb",
    "sourceMainIntegration": "E-VAULT-BACKUP-014",
    "node": "v26.9.0",
    "pnpm": "10.34.5",
    "archives": [
      {
        "name": "@lapis-notes/ui",
        "version": "0.1.3",
        "revision": "19d3c58d4b4a45c1a73f195f16cac51330f2af09",
        "sha256": "5473c8c9531d672f227ac0cd3d955b9eaebc249689f40d7be8580a2a99a9245c"
      },
      {
        "name": "@lapis-notes/api",
        "version": "0.1.4",
        "revision": "e522a82822c5f23d4be43bb545e34ea5fb296932",
        "sha256": "d011bc84d10f80f5309ca60760038909dd6cd4321639eaa668f96d381f25ec26"
      },
      {
        "name": "@lapis-notes/language-service",
        "version": "0.1.1",
        "revision": "2b7ee095babd04f72639be7b6140c0cb64eb1512",
        "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65"
      },
      {
        "name": "@lapis-notes/file-explorer",
        "version": "0.1.2",
        "revision": "19d3c58d4b4a45c1a73f195f16cac51330f2af09",
        "sha256": "84bf066037fe866e0d94667adac12af6f88fa8f8455b4b4bda91610add5b5048"
      },
      {
        "name": "@lapis-notes/workspace",
        "version": "0.2.1",
        "revision": "19d3c58d4b4a45c1a73f195f16cac51330f2af09",
        "sha256": "39c22292c376b540a9f90c0434893360d85148f45def8a9e01ac1aec520edf0e"
      },
      {
        "name": "@lapis-notes/source-editor",
        "version": "0.1.2",
        "revision": "d76ed20282b7cc34352a6fe74896566c17c9b4b2",
        "sha256": "685b2685c55045d7792de7f41a59743456dfee5315ad4305bafbd414237b2250"
      },
      {
        "name": "@lapis-notes/markdown",
        "version": "0.1.6",
        "revision": "8c345d30b497e7678ebc5f410d43dfacf12e6f37",
        "sha256": "94961f48973de70cc8a610a88c2064fc7e06051113915dd03d481a4689a91401"
      },
      {
        "name": "@lapismd/mira",
        "version": "0.0.5",
        "revision": "408809d3c41bbef9ad5d73da7ab515f9b0a3679f",
        "sha256": "1b0c2c60d1f7d219fd5d71c96c5e91d99727822cb1123932986804c378f1402b"
      },
      {
        "name": "@lapismd/mira-editor",
        "version": "0.0.2",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "sha256": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3"
      },
      {
        "name": "@lapismd/mira-plugin-ai",
        "version": "0.0.2",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "sha256": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823"
      },
      {
        "name": "@lapismd/mira-plugin-mermaid",
        "version": "0.0.2",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "sha256": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e"
      },
      {
        "name": "@lapismd/design-core",
        "version": "0.5.1",
        "revision": "6b5654e0bda941f1ef9e257cee35b43789218802",
        "sha256": "37478adcc1b7f7db4c741c9e05dec5df5aae85242cc77c10568b0631bbd6242a"
      },
      {
        "name": "@lapis-notes/search",
        "version": "0.1.3",
        "revision": "d76ed20282b7cc34352a6fe74896566c17c9b4b2",
        "sha256": "5fc0cba3d45a99b8525a6d9c4b7cba8a167d7b9ab72e8e9bdfd732b80a08fbdc"
      },
      {
        "name": "@lapis-notes/graph",
        "version": "0.1.3",
        "revision": "d76ed20282b7cc34352a6fe74896566c17c9b4b2",
        "sha256": "5e518ed7914576deb8c997ed7091a7f7d446c6a06e2905ad3b0bb245527af553"
      }
    ],
    "sourceMainHead": "d064b0e3"
  },
  "files": [
    "MIGRATION.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-038.md",
    "src-tauri/README.md"
  ],
  "contractReview": "Unchanged production contracts: main advances to the exact verified a4ce183a implementation. This scope refreshes the existing checksum-verified private development archive graph, verifies main renderer/types/catalog/build and records integration. No native implementation, public API, published range or lockfile changes. The native crate README gains a high-level worker/admission/backup overview; full contracts stay canonical. LD-REPO-005/CAT-003/HOST-001/GOV-004/MIG-002 and their original native/provider/release gates remain unchanged.",
  "milestoneReview": "Functional code is integrated into source and desktop main workspaces. M14 and M14.7 move to Partial with no active M14 implementation stage. Earlier stages remain Partial. Focused integration does not complete deferred actual-native-app/provider, full suite, visual, platform or release qualification; the checklist and canonical ledgers retain these gates.",
  "scope": "Complete main-workspace integration of the working automatic backup/history plugin. Source integration preserves all M33 work and the unrelated original progress-file edit byte-for-byte. Desktop main has the same production code as the qualified isolated implementation, now using its14verified public package archives. This evidence qualifies the completed integration and renderer build, not the deferred native/provider product gates.",
  "runs": [
    {
      "name": "main-code-integration",
      "command": "jj new -r a4ce183a -m \"Validate automatic vault backup in the main desktop workspace\"",
      "result": "pass",
      "failures": 0,
      "note": "The main desktop parent447f8244 is an ancestor of the verified feature head. Advancing the empty main working change adds444files/modifies109without discarding unrelated work or rewriting the other active history workspace. Source integration is separately recorded in E-VAULT-BACKUP-014."
    },
    {
      "name": "registry-setup-before",
      "command": "pnpm install --offline --frozen-lockfile; pnpm check:types; pnpm build; pnpm test:storybook catalog/plugins/repository/HistoryAdoption.stories.ts catalog/plugins/repository/LivePlugin.stories.ts",
      "result": "fail",
      "failures": 154,
      "note": "The ordinary registry install succeeds but drops the private migration archive overlay. Missing newer foundational exports and split API identities produce151type errors, one renderer bundle failure and two catalog import failures (no tests execute). These are dependency setup findings, not passing product checks. vault-backup-main-types/build/catalog logs retain the before state."
    },
    {
      "name": "verified-private-archives",
      "command": "pnpm local:install /Users/stevejuma/code/lapismd/vault-backup/lapis-desktop/.local/archives/manifest.json",
      "result": "pass",
      "failures": 0,
      "note": "Existing helper verifies14archive SHA-256/source revisions and all14import routes, then preserves tracked package.json/pnpm-lock.yaml bytes. The versions/checksums are recorded above and in ignored .local/archives/installed.json. Package publication remains deferred; consumers use built public exports without aliases or patches. vault-backup-main-archives.log."
    },
    {
      "name": "main-renderer-and-types",
      "command": "pnpm exec tsx --test tests/renderer/repository-*.test.mjs tests/governance/source-audit.test.mjs; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "146focused renderer/governance tests pass in main. Strict Svelte types pass with0errors/0warnings after restoring the verified archive graph. vault-backup-main-renderer.log and vault-backup-main-types-final.log."
    },
    {
      "name": "main-cold-catalog",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryAdoption.stories.ts catalog/plugins/repository/LivePlugin.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "14actual plugin/source/adoption stories x4cold light/dark desktop/narrow processes =56interaction/accessibility runs pass in main. This follows the isolated128affected executions and27native host/service cases in E-REPO-037. vault-backup-main-catalog-final.log."
    },
    {
      "name": "production-renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer bundle passes in66seconds. Existing Rollup PURE-comment and large-chunk warnings remain non-fatal; no thresholds are weakened. This is a renderer build, not a native bundle or actual-WebView qualification. vault-backup-main-build-final.log."
    },
    {
      "name": "integration-canonical-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "The native-crate README is covered by the existing src-tauri protection map. First integration check requires its mapped desktop canonical chapter; add an explicit unchanged-contract confirmation and LD-DESK-003 mapping, then rerun the original gate. No implementation or native API changes."
    },
    {
      "name": "integration-governance",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm check:architecture; pnpm check:app-ownership; pnpm exec prettier --check <changed documentation>",
      "result": "pass",
      "failures": 0,
      "note": "Final integration ledger, canonical document checks, source/App ownership and changed-document formatting pass. Only bookkeeping/README changes remain after advancing main to the verified implementation; production code stays unchanged. Source unrelated progress edit checksum and original deferred gates are preserved."
    },
    {
      "name": "source-rendered-book-gap",
      "command": "Source integration E-VAULT-BACKUP-015: pnpm spec:links",
      "result": "fail",
      "failures": 1,
      "note": "The optional upstream book audit initially has no generated HTML. Source E-VAULT-BACKUP-015 retains that failure, generates the book and reruns the exact audit successfully:3157HTMLfiles/120192local references. No native/provider gate is promoted."
    },
    {
      "name": "source-book-repair",
      "command": "Source E-VAULT-BACKUP-015: pnpm spec:build; pnpm spec:links",
      "result": "pass",
      "failures": 0,
      "note": "Generated source book and exact link audit pass after repairing the missing input. Source canonical validation/progress/spec-first also pass; original native/provider/full-suite/release gaps remain explicit in M34/M14."
    },
    {
      "name": "idle-isolated-build-cleanup",
      "command": "Guarded build-storage active/cleanTarget helpers for vault-backup/{lapis-desktop/src-tauri/target,jj-store/target}",
      "result": "pass",
      "failures": 0,
      "note": "After all Rust jobs finish, both isolated targets have no consumers. Exclusive guarded cleanup reduces desktop allocated artifacts5098590208to4096bytes and source1117061120to4096bytes. Source, vaults, review data, verified archives, documentation book and validation logs are retained. Older protected targets/compiler workers remain untouched."
    }
  ],
  "remaining": []
}
```
