# Direct renderer compression and raw resource representation

Targeted M5 native transport qualification; aggregate gates remain open.

```json
{
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "id": "E-HTTP-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-MIG-001",
    "LD-MIG-002",
    "LD-FILE-005",
    "LD-VAULT-005",
    "LD-DESK-003",
    "LD-DESK-005"
  ],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-HTTP-001.md",
    "spec/src/history/index.md",
    "tests/desktop/file-http-renderer.mjs",
    "tests/desktop/file-http-representation.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Run all session-deferred source, Storybook/accessibility, web, Desktop and ordinary-bundle lanes and the original M4–M7 aggregate gates after M7 implementation."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-raw-and-compressed-direct-transport",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-http-representation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "First uses the existing bundled e2e app: gzip-looking raw file bytes remain exact through GET and binary IPC, Content-Length remains physical length, and HEAD returns zero body with the same length/type/cache policy. Then the isolated fixture serves unchanged built application HTML with HTTP 201, gzip and ETag and all modules over gzip. Direct HTTP checks preserve status, content type, validators and decoded bytes. A fresh non-custom-protocol e2e Cargo build loads that exact configured origin in the actual WebView and reaches renderer readiness; passive server records prove native HTML/module gzip delivery. The fixture and child process close normally."
    },
    {
      "name": "development-native-build",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --locked --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Run within the native target with CARGO_BUILD_JOBS=2 and TAURI_CONFIG equal to tauri.e2e.conf.json. No custom-protocol feature; default configured development URL is retained. Require terminal zero before native launch. Bundled app binary remains separate and unchanged."
    },
    {
      "name": "governance-and-boundaries",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 7
      }
    },
    {
      "name": "initial-evidence-gate",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Fresh evidence has not yet been added; validation reports its missing record and seven uncovered protected files. Add E-HTTP-001 instead of weakening progress coverage."
    },
    {
      "name": "specification-and-progress",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 35,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Current transport mapping is explicit while the captured inventory and original gates remain unchanged. No broader source or product suite is needed for this test-harness/documentation slice beyond its actual native target; all previously session-deferred lanes remain required at M7 end."
    }
  ],
  "contractReview": "Frozen Deno main.ts uses proxyVite only for devUrl. Its Fetch response normalization prevents forwarding decoded bytes with encoded representation headers. Tauri loads its configured Vite origin directly and bundles production assets, removing that intermediate Fetch stage. Preserve LD-FILE-005 and immutable LN-DENO-076/M5 port mapping; any future decoded proxy still requires normalization. Actual native direct gzip loading and raw resource/IPC preservation qualify this transport without an unused proxy, new permission, production hook or changed CSP.",
  "milestoneReview": "Targeted M5 representation qualification only. M5 implementation slices now have source/native evidence, but its original gate and all M4–M7 full qualification remain pending. Continue into M6, including Graph, then M7 before aggregate qualification. Deno is frozen; publication, signing, normal review profiles and the separate post-M7 plugin plan are unchanged.",
  "archiveEvidence": "E-IMPORT-001",
  "transportMapping": {
    "inventory": "requirement:LN-DENO-076",
    "capturedDisposition": "port",
    "legacyReference": "lapis-notes-desktop-migration/packages/desktop-deno/src-deno/main.ts:438-489 and renderer-http.ts",
    "currentDevelopment": "Tauri devUrl directly loads http://127.0.0.1:1431",
    "currentProduction": "Tauri frontendDist bundled assets",
    "retainedInvariant": "Decoded Fetch forwarding must normalize representation headers if introduced; raw resources keep their own headers and bytes."
  }
}
```
