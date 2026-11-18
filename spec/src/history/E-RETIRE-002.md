# Shared AI retirement final consumer qualification

```json
{
  "id": "E-RETIRE-002",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopSource": "351811a99485cf30c946641c8737200d903657ef",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-GOV-006", "LD-AI-002"],
  "files": [
    "spec/src/history/E-RETIRE-002.md",
    "spec/src/current/ai-adapter.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Append consumer qualification without rewriting E-RETIRE-001. Preserve native AI, independent third-party origins, settings/transcripts/memory, Rust pins and all production audit gates. Existing approved exact development exception still expires2026-11-30. Artifact preparation defects and actual native preservation remain open; do not infer publication, website cutover or installed-app replacement.",
  "acceptanceReview": "Final checks import installed public packages from independently verified complete archives, not dirty sibling source. LanguageService local archive has20files/16dist files. The actual fresh hosted producer later packed an incomplete LanguageService archive; its repair and regeneration remain mandatory before Desktop landing. Local qualification cannot excuse that producer defect or qualify native migration.",
  "archives": [
    {
      "name": "@lapis-notes/lapis-plugin-tasks",
      "version": "0.2.0",
      "sha256": "9ff0dbdec630b0e56fbaa21957349ee22248d80759fa0a3f1a5b3c3a9b898cff"
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.6.8",
      "sha256": "c90eac5de04eb15b971d45665f0bd26603abf3a00fd35320a9ed3cb56dc0f4ce"
    },
    {
      "name": "@lapis-notes/ui",
      "version": "0.2.3",
      "sha256": "d8dc5f8e2469f2e9f4dd5bcd5b727db9780507caa5a8701f3c8a9d32f9a32e95"
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.4.8",
      "sha256": "558ecb749a420cbb222a790f19f5527aef9b2d956fcb367e633ca26cc7d60177"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.2.8",
      "sha256": "5ab4ba28eb6a839bf64cfbc4031c77bb60b9883069ce9c0a510ecce32be3f342"
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.6",
      "sha256": "9b371f7c14850d73961f9d2a94aad126c964b7f3800576b38079185e821f28a0"
    },
    {
      "name": "@lapis-notes/app-profile",
      "version": "0.2.5",
      "sha256": "82f533715b31a0504f4ce3e9780b9071a8c00bcfb1f9c929c5deff46a0e1d859"
    },
    {
      "name": "@lapismd/ai",
      "version": "0.2.0",
      "sha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
    }
  ],
  "runs": [
    {
      "name": "Final independent workspace setup",
      "command": "node scripts/validation.mjs run test:ai -- tests/ai/plugin/retired-distribution.test.ts",
      "result": "fail",
      "failures": 1,
      "detail": "Copied ignored config initially retained a relative archive-inventory path missing from the independent workspace. Set the already verified original inventory absolute path; no source or dependency change."
    },
    {
      "name": "Final merged-source installed public guard",
      "command": "node scripts/validation.mjs run test:ai -- tests/ai/plugin/retired-distribution.test.ts",
      "result": "pass",
      "failures": 0,
      "detail": "bcfc1d57-4799-42ff-98a3-958e1b05bc9f:2pass/0fail. Actual installed public guard rejects retired original artifact before fetch; independent ai origin reaches ordinary fetch and deliberately returns404. No writes or byte changes. This is not successful third-party installation."
    },
    {
      "name": "Final exact-source expectations",
      "command": "node --test --test-name-pattern='released Notes cohort|portable sources retain' tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "2pass/0fail. Source-only Node assertions; product checks remain Docker."
    },
    {
      "name": "Final source canonical qualification",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "380517b9-5ef2-4c0b-a843-c871d96cf94d:validate/evidence, Rust formatting, mdBook and spec-first all4lanes pass."
    },
    {
      "name": "Complete cold catalog qualification",
      "command": "node scripts/validation.mjs run test:storybook",
      "result": "pass",
      "failures": 0,
      "detail": "57aaf2ca-a631-4d95-8637-ef2afdf435d8: all4shards and16desktop/narrow/light/dark variants pass. Per-variant shard counts127/134/130/151; total2168passes,0failures,116story files per complete viewport/theme. Fresh browser startup/teardown and axe remain enabled; no visual baseline changes. Actual source617dafc4a7b5c0ddb1521a07e842982e718865e5; compared with351811a9 only Notes source pin, source-pin expectations and documentation/evidence differ. No src/src-tauri/catalog files differ, and every archive SHA256 equals the final merged-main inventory."
    },
    {
      "name": "Receipt source canonical checks",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "ef1590fc-d49e-4de5-8e65-51aec523ce16: all4lanes pass with E-RETIRE-002/index/context present. Final pass-count update requires evidence/format validation."
    },
    {
      "name": "Final evidence after completed catalog",
      "command": "node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "41a685d9-9109-4b7e-a22e-760cf387da23:508records pass. Final provenance/detail strings are reviewed and formatted after the run; no product code or evidence schema changes."
    }
  ],
  "remaining": [
    "Resolve Desktop-owned incomplete hosted LanguageService pack and missing Markdown prerequisite, regenerate exact fresh cohort and qualify all affected consumers.",
    "Exact-head hosted CI and appropriate branch integration.",
    "Actual external/bundled native saved-data/Safe Mode/cold-reopen acceptance, original signed artifact and App Profile native-chat boundary.",
    "API/Profile publication, registry-only consumer adoption, website cutover and installed-app replacement remain separately gated."
  ]
}
```

E-RETIRE-001 remains immutable. Passing portable lanes does not close the native
preservation or distribution gates.
