# Plugin-owned working-copy status and compact split control

```json
{
  "id": "E-REPO-024",
  "tasks": ["M13", "M13.2", "M8.5"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-HOST-001",
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-DESK-003"
  ],
  "date": "2026-10-18",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "desktopBase": "1b8e4011",
    "jjStoreBase": "b829c2ff",
    "designCoreSource": "2b46273c50fbfb4ca9a272e60f0c43526f2af236",
    "apiSource": "e522a82822c5f23d4be43bb545e34ea5fb296932",
    "apiArchiveSha256": "d011bc84d10f80f5309ca60760038909dd6cd4321639eaa668f96d381f25ec26",
    "designCoreArchiveSha256": "a4c2f7a8d14ad334ff986992c653fb26c701071bf16d131f63b729282669bea3",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "rust": "1.99.0",
    "jjStoreSource": "faeab664"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/BlameLayoutReview.stories.ts",
    "catalog/plugins/repository/WorkingCopyStatus.stories.ts",
    "catalog/support/repository/WorkingCopyDemo.svelte",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-024.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/policy.rs",
    "src-tauri/src/host/repository/working_copy.rs",
    "src/components/repository/RepositoryWorkingCopyStatus.svelte",
    "src/components/repository/blame/RepositoryBlameCommitTitle.svelte",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-status.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/working-copy-controller.ts",
    "src/lib/repository/working-copy-status.ts",
    "tests/renderer/repository-working-copy.test.mjs"
  ],
  "contractReview": "LD-REPO-001/002 retain native admitted root/window authority. New exact status frame accepts only sessionId. Its guard spans bounded observer workers and drains scanner leases before release. No source snapshots, writes, shell commands, head reconciliation or index initialization. JJ-store compares the final qualified physical tree directly with its sole WC parent, including unsnapshotted saved files; it does not sum dirty/recorded deltas. Binary/structural/complexity cases omit line totals; stale/conflict/merge cases are unavailable. UI clears stale totals, uses App toasts and reports background progress. Plugin owns controls/CSS through public mount/dispose status API, not repository-specific shell code. Default-enabled setting removes status, listeners/timers and drains reads. Blame title links use surrounding colour at rest, changing on hover/focus. Compact status has no border, 0.1rem vertical padding and 6/12 percent semantic foreground mixes against the status-bar panel. No baseline update.",
  "milestoneReview": "M13 remains In progress, M13.2 retains its original Done qualification for pinned history/diffs, and M8.5 remains In progress. This status extension does not complete a new native cold acceptance gate. Ordinary review app has not yet been rebundled with this feature. Broader provider/platform/release, whole-catalog and visual baseline gates remain deferred by the user.",
  "scope": "Production repository status, native read adapter, direct renderer/catalog consumers and public source-owned status mount intake. Upstream Design Core and API checks/commits are separate. Archive overlay keeps tracked registry manifests/lockfile unchanged; API 0.1.4/UI 0.1.3 remain compatible. No data reset or installed-app replacement.",
  "runs": [
    {
      "name": "source-intake-first",
      "command": "pnpm check:types after local archive installation",
      "result": "fail",
      "failures": 64,
      "note": "General lapis-notes API 0.1.5 intake lacked migration exports and required a newer UI. All task edits in that unrelated checkout were restored. Use correct lapis-notes-history public API 0.1.4; no source alias or dependency patch."
    },
    {
      "name": "compatible-types",
      "command": "pnpm local:install .local/archives/manifest.json; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Compatible API/public Design Core archives installed; strict Svelte diagnostics zero errors/warnings. Log status-types-compatible.log. Source package verification is in API spec/records/2026-10-18-status-host.md and Core spec/records/2026-10-18-status-content.md."
    },
    {
      "name": "repository-renderer",
      "command": "node --test tests/renderer/repository-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "70 repository renderer tests, including request validation, settings defaults, coalesced refresh, drain and stale/failure recovery. Log status-repository-only.log."
    },
    {
      "name": "source-boundary",
      "command": "pnpm check:architecture; pnpm check:app-ownership; node --test tests/governance/source-audit.test.mjs tests/governance/catalog-reload.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both ownership audits and 12 focused governance tests passed. Exact named local permission added to the fail-closed audit. Log status-governance-target.log. The speculative Svelte full-reload expansion was subsequently reverted; existing component/style HMR policy is retained."
    },
    {
      "name": "native-recorded",
      "command": "cargo check --manifest-path src-tauri/Cargo.toml --locked; cargo test --manifest-path src-tauri/Cargo.toml repository_frames_reject_renderer_authority; cargo test --manifest-path src-tauri/Cargo.toml status_request_has_no_renderer_source_authority",
      "result": "pass",
      "failures": 0,
      "note": "Recorded native check and two exact authority tests passed in earlier execution of this slice. Logs status-desktop-native-check.log, status-native-frame-tests.log and status-new-frame-test.log. No new native build during compact-style follow-up; disk reserve protects current live targets."
    },
    {
      "name": "inherited-governance-failure",
      "command": "node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs; isolated local-archives test on Node 26.9/24.19/24.10",
      "result": "fail",
      "failures": 1,
      "note": "135 pass, 1 fail. Unchanged local-archives.test.mjs:190 rmSync(peer) rejects a directory symlink with ERR_FS_EISDIR. Reproduces on all three tested Node versions; not Node26-only. Logs status-repository-node.log, status-inherited-node26.log and status-node24-check.log. Not a full-suite pass."
    },
    {
      "name": "catalog-first",
      "command": "pnpm test:storybook catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "Initial accessibility accessible-name/count mismatch corrected; settings test closes modal before visible-control lookup and waits for popover transitions. Assertions retained."
    },
    {
      "name": "status-catalog-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Six stories across desktop/narrow and light/dark: 24 interaction/accessibility executions pass. Includes settings visibility, disable cleanup, toast recovery and recorded JJ Log navigation. Log status-story-matrix-final.log."
    },
    {
      "name": "blame-links",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Five blame layout stories pass including resting title link colour and navigation assertion. Log blame-link-after.log."
    },
    {
      "name": "compact-cold",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t 'Details And Refresh'",
      "result": "pass",
      "failures": 0,
      "note": "Fresh runner after compact borderless style: one pass, five intentionally unselected. Log status-compact-cold.log. No visual baseline claim."
    },
    {
      "name": "preview-recovery",
      "command": "pnpm storybook:restart --port 7490; curl --max-time 5 http://127.0.0.1:7490/index.json; pnpm storybook:status --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Managed cold preview restarted. Index HTTP200 in under 5ms. Prior freezes profiled in Storybook10.5.7 module-graph snapshot rebuilding; no dependency patch or speculative global reload change retained. Diagnostic loopback inspector closed with the restart. Browser tab had an internal error-page restriction; no bypass, user reload requested. Latest style has focused automated checks, not a fresh manual screenshot."
    },
    {
      "name": "documents-first",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Progress33tasks/126records and spec-first24protected files/six chapters pass. Spec validation rejected milestones.md at33018 bytes. Condense duplicate introductory prose; preserve task rows, IDs and original gates. Logs status-{progress,spec,first}-final.log."
    },
    {
      "name": "documents-qualified",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check <changed Markdown/TypeScript/Svelte/JSON/MJS files>",
      "result": "pass",
      "failures": 0,
      "note": "33tasks/126evidence, six validators/145chapters/94requirements and24protected files/six canonical chapters pass. Changed-file formatting passes. Logs status-{progress,spec}-qualified.log and status-first-final.log. Original task gates remain unchanged; overall evidence pending for the separate listed gaps."
    }
  ],
  "remaining": [
    "Cold ordinary native status UI review/rebundle is pending; existing review data and app remain preserved.",
    "Inherited archive-governance fixture failure remains; no full-suite acceptance claim.",
    "Storybook graph rebuilding caused earlier transient freezes; managed server is responding after restart, long-duration HMR performance remains unqualified.",
    "Visual approval/baselines and broader provider/platform/release/whole-catalog gates remain deferred."
  ]
}
```
