# Actual native history restore acceptance

```json
{
  "id": "E-REPO-051",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.3"],
  "requirements": [
    "LD-REPO-005",
    "LD-LIFE-001",
    "LD-FILE-003",
    "LD-GOV-002",
    "LD-GOV-009"
  ],
  "versions": "macOS ARM64; Rust 1.99.0; Tauri 2.12.4; Desktop parent df5f0028; public archive graph from E-POPOUT-004/E-REPO-050",
  "files": [
    "tests/desktop/repository-restore.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/history/E-REPO-051.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "src-tauri/src/acceptance/backup_restore.rs",
    "src-tauri/src/acceptance/mod.rs",
    "src-tauri/src/host/repository/backup_restore.rs",
    "scripts/check-bundle.mjs",
    "spec/src/current/governance.md",
    "tests/desktop/repository-live-history.test.mjs",
    "spec/src/current/migration.md",
    "PLAN.md",
    "docs/automatic-vault-backup-progress.md",
    "MIGRATION.md",
    "spec/src/current/progress/milestones.md"
  ],
  "contractReview": "Unchanged-contract native acceptance for LD-REPO-005. The actual Notes App must preview and confirm file/vault restore through production controls; prove exact disk bytes, writer protection, retained safety history, included-tree changes, runtime-data preservation and cold reopening. No mock restore service, private App access or authority bypass substitutes for the mounted UI path. Native APIs may inspect immutable receipts but mutations use the existing UI and authenticated native worker. A one-shot response fault is compiled only into debug e2e acceptance, runs fixture IO on a blocking worker and activates solely from its isolated root. It preserves the real native mutation/receipt and returns a transport error afterward. Ordinary bundle auditing rejects its markers. No production command, permission or public frame changes. A separate two-cold-process native case proves unpinned JJ Log follows new automatic checkpoints with the saved status-visibility preference disabled; it opens the real captured diff and verifies disk bytes.",
  "milestoneReview": "M14.3 is Done on its unchanged original macOS ARM64 gate: actual WebView file/vault restore and current safety history, guarded editor updates, cold original-request receipt reconciliation without replay, and live history independent of footer status. E-REPO-051 selects this proof; M14 overall and other native/provider/AI/release/cutover gates remain unchanged.",
  "runs": [
    {
      "name": "native-ui-initial",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-restore.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "restore-before.log: 0/2 pass. The revision XPath matched a comparison-parent chip and selected its containing row; immutable Tauri invoke rejected the attempted response-loss patch. Diagnostic rerun restore-diagnostic.log reproduces both and confirms writable=false/configurable=false. Production transport was not loosened."
    },
    {
      "name": "native-ui-owned-row",
      "command": "node --test --test-concurrency=1 --test-name-pattern=native\\ UI\\ rejects tests/desktop/repository-restore.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "restore-ui-corrected.log exposes wrong-row restore; direct row-owned DOM identity fixes the harness. restore-ui-owned-row.log then proves stale refusal and exact file restoration, but a whitespace-sensitive count assertion fails on identical rendered counts. Normalize only whitespace; retain exact counts and byte assertions."
    },
    {
      "name": "mapped-contract-draft",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "restore-spec-first-draft.log requires the migration chapter for the protected instrumentation/bundle audit. Added unchanged-contract acknowledgement and corrected stale introductory M7.3/M14.2 prose to match their already-qualified original gates. No gate, test or status is weakened."
    },
    {
      "name": "native-restore-recovery-live-integration",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-restore.test.mjs tests/desktop/repository-live-history.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "restore-native-full.log: 3/4 pass. Both file and vault restore recovery preserve the original durable request through cold reopening, reconcile the real native receipt and retain newer edited/added files. Unpinned JJ Log follows capture across two cold processes with footer status hidden. The other restore case clicks a still-moving Column Canvas toolbar and misses its button; wait for the visible hit-target geometry to settle without changing the five-second action deadline."
    },
    {
      "name": "restore-safety-fixture-draft",
      "command": "node --test --test-concurrency=1 --test-name-pattern=\"native UI rejects\" tests/desktop/repository-restore.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "restore-ui-stable-hit-target.log: file restore and editor update pass; the receipt inspection incorrectly treats a sibling backup lock as a directory. Select the fixture repository directory by file type, retaining the exact safety-byte assertions."
    },
    {
      "name": "native-restore-original-gate",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-restore.test.mjs tests/desktop/repository-live-history.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "restore-native-qualified.log: 4/4 pass across eight fresh actual Notes processes. File/vault preview and apply use mounted controls and real native JJ receipts. Stale preview produces a Design Core error toast and preserves later bytes. Exact restored bytes reach the open editor; added/deleted files and runtime exclusions are correct. The real safety commit opens in JJ Log with the exact latest pre-restore content. Cold file/vault recovery reuses the saved original request, retains later edits/new files and clears its pending record. Unpinned JJ Log follows capture before/after restart with status hidden. A separate exact restore rerun also passes (restore-ui-safety-qualified.log). No private App state, mock restore service or credential is used."
    },
    {
      "name": "direct-consumers-and-native-checks",
      "command": "node --import tsx --test tests/renderer/repository-restore.test.mjs tests/renderer/repository-file-history.test.mjs\nCARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e,custom-protocol -- -D warnings\nCARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "restore-consumer-units.log passes 15/15. Strict all-target Clippy passes for normal and e2e/custom-protocol configurations (restore-clippy-{normal,e2e}.log). Exact native frame/ordinary bundle checks follow separately; no repository-wide test-suite claim."
    },
    {
      "name": "current-native-and-ordinary-bundles",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json\nCARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --features e2e,custom-protocol --bin lapis-desktop host::repository::backup_restore::tests::restore_frames_reject_renderer_authority\nCARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --config '{\"build\":{\"beforeBuildCommand\":\"\"}}'\npnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "restore-e2e-build.log builds the current actual-App acceptance bundle. restore-native-frames.log passes 1 exact frame test (77 unrelated tests filtered). restore-ordinary-bundle.log builds the normal macOS app in 1m21s using the unchanged current production renderer from E-POPOUT-004; only its redundant renderer prebuild is skipped. restore-ordinary-audit.log and .local/bundle-check.json confirm expected app ID/ARM64, 328 production JS files, no Node/Deno and zero acceptance markers, including both new fault strings. Existing compact-unwind/renderer annotation/empty optional embedding-worker advisories are retained. Source-boundary and App ownership checks pass in restore-final-{architecture,ownership}.log; Rust format passes."
    },
    {
      "name": "final-governance",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first\npnpm check:architecture\npnpm check:app-ownership\ncargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 41 tasks/190 evidence records; source validation passes 6 validators/217 chapters/95 requirements; source-first passes 11 protected files/5 canonical chapters. Source boundaries, explicit App ownership and Rust formatting pass. Authored documents and sources are formatted; Desktop, Governance and Repository remain within their original byte/line limits. Logs restore-{progress-final,spec-final,first-final,final-architecture,final-ownership,authored-format}.log. M14.3 uses the exact original completedGates string; no other task is promoted."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "M14.4/5/6/7 retain live-provider, exact historical-search/restore, advanced storage and adoption acceptance. M10.2/M13.3 managed AI, M10.3 packaged agent, optional compute, M8.5 native presentation, distribution/cutover, other platforms and visual baselines remain separate.",
    "Repository-wide product/catalog matrices, signing and publication were not run under the approved focused qualification scope."
  ],
  "completedGates": {
    "M14.3": "Local timeline, guarded restoration, live history and independent status visibility work"
  }
}
```
