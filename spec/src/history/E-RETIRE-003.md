# Retired-free Desktop fixture source admission

```json
{
  "id": "E-RETIRE-003",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "pluginsJavascript": "969356250f26c5561fac22cf00d8da8f395dbdae",
    "pluginsRust": "879581d1549187bdbac2d75b40d02e0df46e721a",
    "base": "351811a99485cf30c946641c8737200d903657ef",
    "dockerNode": "24.15.0",
    "isolatedAuthoringToolInstallerPnpm": "12.6.0"
  },
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-GOV-007"],
  "files": [
    "scripts/ci-sources.json",
    "scripts/ci-native-fixtures.mjs",
    "scripts/local-macos-build.mjs",
    "scripts/plugin-source-admission.mjs",
    "tests/governance/retired-plugin-sources.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-003.md"
  ],
  "contractReview": "Desktop fixture producers must execute the owning Plugins source retirement audit before workspace installation, signer import or builds, even for warm dependency reuse. Missing and failing audits stop preparation. JavaScript fixtures advance to retired-free Plugins969 while all Rust/native and Tasks pins remain unchanged. Existing seven non-AI native fixtures and native AI stay. No package/public policy, publishing, trust or user-data change.",
  "acceptanceReview": "Focused source-admission tests prove actual Node subprocess failure propagation for absent, stale and failing source audits plus clean-source admission. Source-order assertions cover both integration sites and pin identity. Real immutable Plugins969 source audit runs in the existing omarchy Docker fixture container. These controls do not prove full new Desktop dependency artifact production, plugin archives, macOS packaging or native startup/data preservation.",
  "runs": [
    {
      "name": "Exact source admission before",
      "command": "node --test tests/governance/retired-plugin-sources.test.mjs",
      "result": "fail",
      "failures": 3,
      "detail": "0pass/3fail: old source pin, absent pre-build admission and absent helper."
    },
    {
      "name": "Exact source admission after",
      "command": "node --test tests/governance/retired-plugin-sources.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "3pass. Real subprocesses reject absent audit, stale packages/ai with status37 and thrown audit failure with status1; clean source passes."
    },
    {
      "name": "Native source identity before",
      "command": "node --test --test-name-pattern='portable sources retain' tests/governance/validation-native.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "1fail: legacy equality assumed Plugins JavaScript/native pins must match despite distinct fixture/Rust roles."
    },
    {
      "name": "Native source identity after",
      "command": "node --test --test-name-pattern='portable sources retain' tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "1pass. Explicit Plugins969 JavaScript fixture and879 Rust pins; Cargo.lock must still name879. AI/JJ equality retained."
    },
    {
      "name": "Real immutable Plugins source audit",
      "command": "docker --context omarchy exec --workdir /work/lapis-plugins 7dc23c4fbd0d591f2689f70fd623744f7a3253563bf932f4e4015c21766afe0d node scripts/check-retired-ai.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Source is immutable969 export from Notes registry-fixture run f729c5c5-8a75-4a65-9e38-8030f3b70221. No dependency/build mutation. Immutable source tar SHA256:61293084f9af033596e18ff56139e3b4da90eed396629de22a8e0155f765b3e4."
    },
    {
      "name": "Authoring tooling discovery",
      "command": "pnpm dlx @lapismd/spec-validator@0.2.1 doctor --json; pnpm dlx @lapismd/spec-validator@0.2.1 search --semantic \"native fixture local macos build dependencies\"",
      "result": "fail",
      "failures": 1,
      "detail": "Fresh workspace has no node_modules, so pnpm spec:search cannot locate spec-validator. Pinned CLI doctor identifies QMD ABI147 mismatch; search explicitly degrades to text fallback. No semantic search success claimed."
    },
    {
      "name": "Expanded source governance host attempt",
      "command": "node --test tests/governance/retired-plugin-sources.test.mjs tests/governance/ci-prerequisites.test.mjs tests/governance/local-macos-build-exclusion.test.mjs tests/governance/validation-native.test.mjs tests/governance/native-fixture-portability.test.mjs tests/governance/ci-artifacts.test.mjs",
      "result": "fail",
      "failures": 2,
      "detail": "24pass/2fail. Fresh host lacks public API dependency and xcrun SDK. Do not qualify from host; unchanged targets rerun in existing provisioned Docker worker with isolated source copy."
    },
    {
      "name": "Expanded source governance in Docker",
      "command": "docker --context omarchy exec --workdir /tmp/desktop-retirement-fixture-governance lapis-desktop-validation-57aaf2ca-a631-4d95-8637-ef2afdf435d8 node --import tsx --test tests/governance/retired-plugin-sources.test.mjs tests/governance/ci-prerequisites.test.mjs tests/governance/local-macos-build-exclusion.test.mjs tests/governance/validation-native.test.mjs tests/governance/native-fixture-portability.test.mjs tests/governance/ci-artifacts.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "29pass/0fail on Node24.15.0. Isolated tracked-source snapshot; read-only installed public dependencies from worker. No app/window/provider or browser launched. Artifact identity/mutation guards pass."
    },
    {
      "name": "Architecture and App boundaries",
      "command": "node scripts/source-audit.mjs; node scripts/source-audit.mjs --app-only",
      "result": "pass",
      "failures": 0,
      "detail": "Both source-only audits pass."
    },
    {
      "name": "Initial canonical line boundary",
      "command": "node_modules/.bin/spec-validator validate --json",
      "result": "fail",
      "failures": 1,
      "detail": "SPEC-FILE-LINES: distribution backlog401 exceeds400. Shorten its changed remaining-outcome sentence; retain all original gates."
    },
    {
      "name": "Canonical validation after bounded-page correction",
      "command": "node_modules/.bin/spec-validator validate --json",
      "result": "pass",
      "failures": 0,
      "detail": "7validators,570chapters,134requirements,0findings. Governance/distribution remain400physical lines."
    },
    {
      "name": "Mapped change and book gates",
      "command": "node_modules/.bin/spec-validator first --base @- --head @ --json; node_modules/.bin/spec-validator build --json; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "detail": "6protected files/2canonical chapters; mdBook builds; Rust format unchanged/pass. Source-only authoring checks do not qualify native product."
    },
    {
      "name": "Evidence and changed-file formatting",
      "command": "node scripts/evidence.mjs; node_modules/.bin/prettier --check <all12changedfiles>",
      "result": "pass",
      "failures": 0,
      "detail": "Fresh evidence coverage and committed receipt immutability pass. All changed files use Prettier formatting."
    }
  ],
  "remaining": [
    "Produce and verify a fresh complete Desktop dependency artifact bound to the changed ci-sources identity; old full CI artifacts remain inadmissible.",
    "Run real seven-plugin native fixture producer with fresh prerequisites and verify signed artifacts.",
    "Explicit macOS build/native qualification stays on-demand and non-qualifying under the current Linux-only hosted policy. No app execution/replacement authorized here.",
    "Root coordination retains final consumer/catalog/hosted and installed-data migration gates."
  ]
}
```
