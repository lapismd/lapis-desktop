# Retry transient Linux window-list readiness

```json
{
  "id": "E-RELEASE-019",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "failedRun": 43371356381,
    "sourceCommit": "57a8e132fea15f807c9d47431b966e6f324e038f",
    "hostedNode": "24.15.0",
    "node": "24.19.0"
  },
  "requirements": ["LD-GOV-002", "LD-REL-005", "LD-REL-006"],
  "files": [
    "docs/desktop-release.md",
    "scripts/release/smoke-linux.mjs",
    "scripts/release/window-observation.mjs",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-RELEASE-019.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/release-workflow.test.mjs"
  ],
  "contractReview": "Installed-app qualification retains the actual Homebrew install/reinstall/uninstall, exact archive and process identity, visible native window, minimum geometry, graceful quit, retained profile/vault bytes, empty Node/Deno PATH and one 60-second window deadline. Only wmctrl status 1 while Openbox has not yet published its EWMH client list becomes an empty observation for the next bounded poll. Missing tools, command timeouts, every other status, early app exit, absent or undersized windows and deadline expiry remain fatal; no assertion, deadline, platform or process boundary is weakened.",
  "acceptanceReview": "Exact-main CI 43366476948 passed every selected job for 57a8e132. Prepare run 43371356381 then built and assembled all three ordinary archives successfully. Both Linux Homebrew jobs installed their target archive successfully and failed before observing the product window because the first wmctrl -lpG call returned status 1 with _NET_CLIENT_LIST unavailable. Candidate sealing and publication stayed skipped. The same helper boundary failed locally before repair and passes after the narrow status classification; a wholly new complete main CI and release preparation remain required.",
  "remaining": [
    "Pass complete CI for the repaired exact main source, then pass a wholly new three-platform preparation and both original Homebrew installed-app qualifications before requesting protected publication."
  ],
  "runs": [
    {
      "name": "Exact-main full qualification before preparation",
      "command": "GitHub Actions run 43366476948",
      "result": "pass",
      "failures": 0,
      "detail": "Unit, both Linux native builds, bundle, catalog, Validate and Full source qualification passed for canonical main 57a8e132."
    },
    {
      "name": "Three-platform preparation with dual Linux qualification failure",
      "command": "GitHub Actions run 43371356381",
      "result": "fail",
      "failures": 2,
      "detail": "All three builds and candidate assembly passed. Linux ARM64 and x64 each installed through Homebrew, then failed at smoke-linux.mjs:103 when wmctrl -lpG returned status 1 before _NET_CLIENT_LIST existed. Candidate sealing and every publication job remained skipped."
    },
    {
      "name": "Local transient observation regression before repair",
      "command": "node --test --test-name-pattern='Linux window observation' tests/governance/release-workflow.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "The status-1 observation escaped exactly as it did on both hosted architectures; the separate non-transient missing-tool assertion passed."
    },
    {
      "name": "Local transient observation regression after repair",
      "command": "node --test --test-name-pattern='Linux window observation' tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Both cases passed: status 1 returns an empty observation for bounded polling, while ENOENT remains an exception."
    },
    {
      "name": "Complete release governance family",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "23/23 release workflow, artifact, qualification and publication governance tests passed."
    },
    {
      "name": "Complete governance suite",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "369/369 governance tests passed with no skips."
    },
    {
      "name": "Exact pinned-sibling native check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "A disposable local Jujutsu workspace materialized the exact pinned sibling commits, prepared and verified genuine Lapis AI helpers, then passed Storybook parity, specification validation, Svelte diagnostics with zero findings, normal and e2e Rust checks and formatting."
    },
    {
      "name": "Specification and evidence qualification",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All 455 evidence records and all four specification lanes passed."
    }
  ]
}
```

This repair cannot qualify the preserved preparation attempt. Qualification
requires new exact-source CI and a wholly new prepare-only release run.
