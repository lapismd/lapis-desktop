# E-CORE-018 — Shared asset reader and native file-action compatibility

```json
{
  "id": "E-CORE-018",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.3"],
  "requirements": [
    "LD-GOV-006",
    "LD-FILE-001",
    "LD-FILE-003",
    "LD-INSTALL-002"
  ],
  "versions": {
    "desktopBaseline": "a5b936e0",
    "notesCore": "fe604931",
    "lapisAI": "6548afe0",
    "rust": "1.99.0"
  },
  "contractReview": "Unchanged-contract confirmation: the installed asset verifier is extracted into Notes-owned Core; Desktop retains URI/origin/resource admission and response policy. Original asset and file semantics remain. No duplicate verifier or old-path export is retained.",
  "milestoneReview": "Shared asset-reader compatibility and both native file-action journeys pass: seven original asset cases, strict normal/e2e checks, both bundles and zero-automation ordinary audit. Hosted acceptance remains independently committed in Notes. The user explicitly accepted the separate pre-existing Markdown image failure as non-blocking on 2026-10-25 and authorized the database/backup intake commit. This does not qualify unrelated native/provider/platform gates.",
  "runs": [
    {
      "name": "source-boundaries",
      "command": "pnpm check:architecture && pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Both audits pass on the retained working snapshot."
    },
    {
      "name": "strict-normal-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check:rust",
      "result": "fail",
      "failures": 1,
      "note": "The extracted adapter passes an unnecessary extra reference to the shared reader. Strict Clippy rejects needless_borrow at plugins/assets.rs:38. Pass the existing root reference directly; no lint allowance or behavior change."
    },
    {
      "name": "original-assets-after",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test plugin_assets",
      "result": "pass",
      "failures": 0,
      "note": "All seven original asset cases pass on the shared reader after the reference correction (0.34s)."
    },
    {
      "name": "strict-normal-after",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "note": "All-target strict normal check passes after correcting the exact one-finding regression."
    },
    {
      "name": "strict-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "All-target strict e2e check passes."
    },
    {
      "name": "normal-bundle",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Fresh ordinary bundle builds and audit reports zero automation markers across 327 renderer JS files. Debug linking reports the large unwind-table warning; no source lint is suppressed. Acceptance build and actual native checks remain separate."
    },
    {
      "name": "acceptance-bundle",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh acceptance bundle builds from the committed shared core and retained JS archives. The same debug unwind-table linker warning is retained; it does not suppress a source lint."
    },
    {
      "name": "native-file-ui",
      "command": "node --test --test-concurrency=1 --test-name-pattern=\"Explorer rename and move preserve collisions\" tests/desktop/file-ui-mutations.test.mjs; node --test --test-concurrency=1 tests/desktop/file-creation.test.mjs (isolated acceptance-root environment)",
      "result": "pass",
      "failures": 0,
      "note": "Both actual macOS WebView cases pass: internal rename/move preserves collisions, active editor saves and cold layout (9.35s), and exclusive creation preserves existing destinations plus binary/Unicode bytes and Explorer new-file intent (2.82s). Fixture .local/native-test/rust-file-actions-WxB8kH; no user profile, clipboard or vault is used."
    },
    {
      "name": "specification-before-summary",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The new evidence record is linked from history/index but lacks its required SUMMARY entry. Add the one canonical index entry and rerun; no validator rule is changed."
    }
  ],
  "files": [
    "src-tauri/src/plugins/assets.rs",
    "spec/src/current/plugins.md",
    "spec/src/history/E-CORE-018.md"
  ],
  "remaining": []
}
```

The original seven native asset cases and full 235-case service suite passed
before this final strict check. The reference correction preserves that reader's
type and behavior; all seven exact cases and both strict configurations pass
after it. The five Notes JavaScript archives retain source `b55d3492`; this is
not a full archive-cohort refresh. No Lapis AI source or installed application
is changed.

## Accepted exception — 2026-10-25

The user answered: “Accept the recorded failure and commit the verified intake.”
This accepts the independently reproduced Markdown attachment defect as
non-blocking for this intake. The actual native UI result stays 27 pass / one
fail; the owning `lapis-plugins` repair remains pending. The unchanged
historical E-AI-109 formatting exception also retains its earlier explicit
acceptance. No native/provider acceptance is inferred for the newer R2 execution
source.
