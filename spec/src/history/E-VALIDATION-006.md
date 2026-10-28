# Local-only macOS app build with bundled first-party plugins

```json
{
  "id": "E-VALIDATION-006",
  "date": "2026-10-28",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-004", "LD-GOV-010"],
  "contractReview": "Adds scripts/local-macos-build.mjs with the pnpm build:local:macos entry as a local-only convenience: it builds an unsigned macOS app (release profile by default, --debug opt-in) through the existing desktop:bundle path, ad-hoc re-signs the bundle (codesign --force --deep -s -), strips the quarantine xattr, verifies the signature with codesign --verify --deep --strict, and installs every first-party plugin the application does not already statically register into a vault's .lapis/ directory as schema-valid development-provenance InstalledPluginState records whose files carry path/sha256/size. Plugin payloads are built in the owning repos via lapis-plugins plugin:build and lapis-plugin-notebook build; the statically bundled ids (ai, source-editor, markdown, search, graph, file-explorer, terminal) are skipped so no duplicate registration occurs. The script refuses off darwin/arm64, refuses a real signing identity in the environment (TAURI_SIGNING_IDENTITY / APPLE_SIGNING_IDENTITY / TAURI_APPLE_SIGNING_IDENTITY), enforces the 30 GiB free-space and serialized cargo guards, writes only under the vault path or .local/local-app, and never touches /Applications, an installed app or a user profile. No signing, publication or distribution gate is changed; the release bundle audit and its deferred-signing assertion stay untouched.",
  "milestoneReview": "M8 keeps its original Done gate and evidence; this record covers the validation/tooling surface as a governance-only addition in the same chapter, and does not promote any product, native, provider, catalog, distribution, signing or visual gate. The on-demand heavy acceptance (an actual pnpm build:local:macos --vault <throwaway> release build, the 17-plugin build and a launch verification of the installed plugins) is a separate on-demand action and is not a completion gate of this tooling slice.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "governanceSuite": "7/7"
  },
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "package.json",
    "scripts/local-macos-build.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-VALIDATION-006.md",
    "tests/governance/local-macos-build-exclusion.test.mjs",
    "tests/governance/native-lane-defaults.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Script syntax",
      "command": "node --check scripts/local-macos-build.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Governance tests",
      "command": "node --test tests/governance/native-lane-defaults.test.mjs tests/governance/local-macos-build-exclusion.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "7/7: the local build is an explicit isolated script, is ad-hoc only, Docker stays the code-level default, the on-demand inventory is complete, no default lane collects a native lane, the dispatcher refuses without opt-in, and hosted CI keeps the portable lane set with the local-macos-build script in the native-selector allowlist."
    },
    {
      "name": "Spec-first mapping",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "5 protected files, 1 canonical chapter (governance.md); no unmapped protected path."
    },
    {
      "name": "Architecture audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass."
    }
  ]
}
```

The on-demand heavy acceptance that confirms the working build and installed
plugins remains a separate action (`pnpm build:local:macos --vault <throwaway>`)
in the serialized macOS slot; this record qualifies only the tooling, governance
and specification surface that shipped in this slice.
