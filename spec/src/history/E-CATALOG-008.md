# Scoped preview lifecycle and cache maintenance

```json
{
  "id": "E-CATALOG-008",
  "tasks": ["M8", "M8.0"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009"
  ],
  "revision": "enclosing Jujutsu change rukuqntr",
  "versions": {
    "base": "564e039dd6f779a427fff3e3b97628776ad98194",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "vite": "7.3.2",
    "platform": "macOS ARM64",
    "ownershipRecord": "lapis-storybook/1",
    "defaultPort": 7480,
    "reviewPort": 7490
  },
  "files": [
    "MIGRATION.md",
    "README.md",
    "package.json",
    "scripts/storybook-files.mjs",
    "scripts/storybook-owner.mjs",
    "scripts/storybook-process.mjs",
    "scripts/storybook-runtime.mjs",
    "scripts/storybook.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-008.md",
    "spec/src/history/index.md",
    "tests/governance/storybook-maintenance.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "missing-commands",
      "command": "node --test tests/governance/storybook-maintenance.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Before state: manifest has only the foreground launcher, build and interaction runner; the five scoped lifecycle/cache commands are absent. preview-maintenance-before.log."
    },
    {
      "name": "initial-owned-lifecycle",
      "command": "node --test tests/governance/storybook-maintenance.test.mjs\nnode scripts/storybook.mjs start --port 7500\npnpm storybook:status -- --port 7500",
      "result": "pass",
      "failures": 0,
      "note": "Initial 12 then 15 governance cases pass. Actual independent cold server PID 90158 starts on 7500 with recorded UID/birth/cwd/command and readable story index. Unmanaged review62420 on 7490 stays alive. preview-maintenance-focused{,-2}.log, preview-maintenance-cold-start.log and preview-maintenance-live-status.log."
    },
    {
      "name": "real-exit-observation-race",
      "command": "pnpm storybook:restart -- --port 7500\nnode --test --test-name-pattern=\"transient exit observation\" tests/governance/storybook-maintenance.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The real restart stops PID 90158 but lsof loses cwd before ps reports exit; the record is correctly retained and the command fails. Actual subsequent ps/lsof show90158 and port7500 absent. The added exact Node regression independently fails once before correction. Treat unavailable observations as unknown; after SIGTERM, retry bounded observations until confirmed exit without another signal or automatic new start. preview-maintenance-live-restart.log and preview-maintenance-exit-before.log."
    },
    {
      "name": "confirmed-exit-repair",
      "command": "node --test --test-name-pattern=\"transient exit observation\" tests/governance/storybook-maintenance.test.mjs\nnode --test tests/governance/storybook-maintenance.test.mjs\npnpm storybook:restart -- --port 7500\npnpm storybook:restart -- --port 7500\npnpm storybook:stop -- --port 7500",
      "result": "pass",
      "failures": 0,
      "note": "Exact transient-observation regression passes, then all 16 cases. Two real restart cycles create PID 91098 then PID 91640; explicit stop confirms terminal state and no7500 listener remains. All final17 cases additionally cover abandoned lease recovery only after a real short Node child exits and its PID is absent. preview-maintenance-exit-after.log, preview-maintenance-focused-{3,qualified}.log and preview-maintenance-live-{restart-2,restart-3,stop-2}.log."
    },
    {
      "name": "authority-cache-and-migration",
      "command": "node scripts/storybook.mjs status --port 7490\nnode scripts/storybook.mjs clean\nNode assertions for actual unowned stop/live-cache refusal\nVerified one-time raw62420 shutdown\npnpm storybook:clean -- --apply\nNode assertions for admitted cache absence\npnpm storybook:start -- --port 7490\npnpm storybook:status -- --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Actual foreign PID 62420 is preserved by new stop; live cache apply is refused and cache inode remains. Verify exact known birth Sun Oct18 12:21:25, UID 501, checkout and raw command before stopping that previously created preview. Confirm exit before maintenance. Applied clean has zero detected consumers and removes only the Storybook dependency cache; both admitted cache paths are then absent. Managed review PID 92784 starts cold on 7490 and status verifies live PID/port. jj-store22952/22953 remain listening on7462/7460. Logs preview-maintenance-live-refusals,bootstrap-stop,cache-apply,cache-absent,review-start. No native process/data/static deliverable cleanup."
    },
    {
      "name": "managed-live-hmr",
      "command": "cua_repl: inspect existing two-tab comparison after cold managed start; edit/revert runtime and CSS comments",
      "result": "pass",
      "failures": 0,
      "note": "Existing browser automatically reconnects and renders production JJ/Op workspace tabs and diffs. Switching to Op then editing runtime TS reconstructs App and returns to default JJ. CSS hot-update at12:00:24 UTC retains open parent picker and focused input. Controller/style bytes are exactly restored to SHA256 288d7b6551bc1a50ffdda621d465445b4bc936d2515ac1d5bb9e443710bbb8c0 and d5b482af4552b181f71c43865d011055398b4b82f4bf54eb493461085dad7005. No UI source diff or visual baseline update."
    },
    {
      "name": "complete-node-and-boundaries",
      "command": "node --test tests/governance/storybook-maintenance.test.mjs\npnpm check:architecture\npnpm check:app-ownership\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Intermediate 17 maintenance cases and all 241 renderer/governance cases pass. Exact ownership, foreign listeners, changed UID/cwd/command/birth, preflight retention, unknown stop, startup port takeover, bounded cleanup, cache dry-run/live refusal/data preservation, symlink containment and lease serialization/recovery are covered. Audits pass. preview-maintenance-{focused,architecture,ownership,renderer}-qualified.log. Superseded by the final readiness-aware Node rerun below."
    },
    {
      "name": "unready-index-regression",
      "command": "node --test --test-name-pattern=\"unresponsive story index\" tests/governance/storybook-maintenance.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "An owned listener with an unresponsive index initially reports running and can be reused. Add an exact state regression. preview-maintenance-unready-before.log."
    },
    {
      "name": "readiness-aware-final-node",
      "command": "node --test --test-name-pattern=\"unresponsive story index\" tests/governance/storybook-maintenance.test.mjs\nnode --test tests/governance/storybook-maintenance.test.mjs\npnpm check:architecture\npnpm check:app-ownership\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs\npnpm storybook:status -- --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Exact readiness regression passes, then all 18 maintenance and all 242 Node renderer/governance cases pass. Status probes the owned index, distinguishes unready from running, retains its PID/ownership and refuses another start while remaining explicitly stoppable. Current actual 7490/PID 92784 reports running. Both audits pass. preview-maintenance-unready-after.log and preview-maintenance-{focused,architecture,ownership,renderer}-final-2.log, preview-maintenance-review-status-final.log. These private CLI changes do not feed the unchanged UI/Vite/story inputs in the concurrent catalog lane."
    },
    {
      "name": "renderer-and-static-builds",
      "command": "pnpm check:types\npnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Strict types 0 errors/0 warnings. Renderer 27.43s and static catalog 44.72s pass with existing PURE/chunk advisories. preview-maintenance-{types,build,static}-qualified.log. Full catalog remains pending in this draft."
    },
    {
      "name": "draft-document-consumers",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Progress passes 33 tasks/113 evidence records. Spec correctly refuses governance chapter at401 physical lines. Shorten the current introductory note while preserving every requirement and historical record. preview-maintenance-{progress,spec}-draft.log."
    },
    {
      "name": "complete-cold-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 52 files/201 cases pass independently in desktop/light, narrow/light, desktop/dark and narrow/dark: 804 interaction/axe checks with fresh Vite/Chromium per configuration. preview-maintenance-catalog-qualified.log. Only private Node CLI health handling and documentation changed during this lane; no UI/story/fixture/Vite inputs changed. CLI health handling has separate final18/242 Node proof."
    },
    {
      "name": "repaired-document-consumers",
      "command": "pnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "After the recorded one-line repair, progress passes 33 tasks/113 records, all four spec lanes and full formatting pass. preview-maintenance-{progress,spec,format}-draft-2.log. Final selected-evidence consumers follow before commit."
    },
    {
      "name": "managed-review-deliverable",
      "command": "pnpm storybook:status -- --port 7490\ncua_repl: verify/save existing Comparison preview and retain original History/reference tabs",
      "result": "pass",
      "failures": 0,
      "note": "Managed review PID 92784 remains running at literal127.0.0.1:7490 with matching live identity/listener and responding story index. Production workspace JJ/Op tabs and retained file/diff preview remain open for review. Screenshot .local/reusable-conversations/preview-maintenance-managed-review.png. No baseline approval or native product qualification is inferred."
    },
    {
      "name": "final-selected-evidence-consumers",
      "command": "pnpm progress:generate\npnpm exec prettier --write spec/src/history/E-CATALOG-008.md spec/src/current/governance.md spec/src/current/plugins.md spec/src/current/migration.md spec/src/current/progress/milestones.md MIGRATION.md\njj --no-pager st\npnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Original M8/M8.0/native statuses and gates remain unchanged. Final progress passes 33 tasks/113 records; all four spec lanes and full formatting pass. preview-maintenance-{progress,spec,format}-final.log. Evidence/current-note-only consumers follow before the local commit."
    }
  ],
  "contractReview": "LD-CAT-001/002 gain optional managed process/cache commands alongside the existing foreground CLI. Authority requires a matching live UID/PID/birth/command/cwd and selected port; state files alone grant no signal authority. Atomic ignored records and a checkout lease fence concurrent maintenance. Unavailable exit observations retain ownership until confirmed terminal. Cache apply admits only named dependency caches and rejects live Node consumers/symlink traversal. Native capabilities, App/fixture ownership, UI components, production/Vitest configuration and package dependency ranges remain unchanged.",
  "milestoneReview": "NOTES-05I0B qualifies the five managed lifecycle/cache commands; with NOTES-05I0A runtime reload, the requested NOTES-05I0 preview workflow is complete on the qualified macOS ARM64 profile. M8/M8.0 retain Done under their original gate; this is supplementary tooling evidence. M13/M13.3, managed conversation/restart and visual approval stay open. NOTES-05I remains the sole Active umbrella for remaining Op Log selectors, native query/statistics/row/state and whole-view parity.",
  "scope": "Node development tooling and command/document contracts only. New shared preview/cache entrypoints and package manifest justify complete cold catalog, renderer/static builds, strict UI checks and full Node governance/renderer surface. Real macOS process startup/status/restart/stop, refusal and cache/HMR proof are distinct from mocked ownership cases and UI interaction/axe. No Rust builds/native product/provider/foreground/OS-window qualification, installed app replacement, publication or baseline update. Linux ps/lsof command path is implemented but not live-qualified here."
}
```
