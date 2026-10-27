# Installed native Tasks acceptance preparation

```json
{
  "id": "E-CORE-039",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.9"],
  "requirements": ["LD-TASK-001", "LD-TASK-002", "LD-TASK-003", "LD-CAT-003"],
  "contractReview": "Acceptance bundles verified public Tasks exports and uses the existing signer/production installer. E2e-only probes forward native commands, hold pre-admission saves/submissions or discard a real reply, and add no Task engine or replay. Public App/provider/metadata APIs supply observations. Shared entry/script wiring remains parent-owned and pending.",
  "milestoneReview": "M16.9 remains In progress and depends only on M16.7. Nine fixture/probe checks, strict probe types, native-case syntax and source audits pass. Four headed installed-plugin cases remain unexecuted; preparation does not qualify native UI or complete LD-TASK-003. E-CORE-036/037 remain immutable.",
  "versions": {
    "desktopParent": "67b3aea21b5b9856e8fd4a46e44fc8b2e653d07a",
    "nativeNotesSource": "0ff929b1fe53a790c1cd4af777d4e9879e46e15f",
    "tasksSource": "52270c2aa7838811604a20be0861cdbd04027b42",
    "tasksPackage": "@lapis-notes/lapis-plugin-tasks@0.1.0",
    "tasksArchiveSha256": "ff64c349777bb4331f87dc2e6f8412dc92c7e05e423572fdaad455434f995c6b",
    "apiArchiveSha256": "419b47c5b7857cb9e2106aacf519671deba7d34bb79f364f642a378c4db094b9",
    "historyArchiveSha256": "e714935f9f0a9365f74aaeca3aa67f8b0fef089e95ef107d24eabe915710b028",
    "nodePinned": "24.10.0",
    "initialHostNode": "26.9.0 - exact checks repeated successfully on pinned Node",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/tasks.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/core/index.md",
    "spec/src/history/E-CORE-039.md",
    "tests/desktop/tasks-entry.ts",
    "tests/desktop/tasks-installed-artifact.mjs",
    "tests/desktop/tasks-installed-assets.mjs",
    "tests/desktop/tasks-installed-driver.mjs",
    "tests/desktop/tasks-installed.test.mjs",
    "tests/desktop/tasks-transport.ts",
    "tests/renderer/tasks-installed-fixture.test.mjs",
    "tests/renderer/tasks-transport.test.mjs"
  ],
  "runs": [
    {
      "name": "fixture-original-boundary",
      "command": "node --import tsx --test tests/renderer/tasks-installed-fixture.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Initial missing assets module: one module failure before implementation, retained from preceding preparation turn. Exact after: all four fixture-integrity cases pass."
    },
    {
      "name": "transport-original-boundary",
      "command": "node --import tsx --test tests/renderer/tasks-transport.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Before: missing tasks-transport.ts produces one module failure. Exact after: all five transport cases pass."
    },
    {
      "name": "pinned-fixture-and-transport",
      "command": "PATH=/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH node --import tsx --test tests/renderer/tasks-transport.test.mjs tests/renderer/tasks-installed-fixture.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "9/9 pass: verified resources; tamper/symlink/host-module refusal; forwarding/options; pre-admission gate/cleanup; real completion then lost reply; matching conditional save; unchanged native errors. Infrastructure checks do not simulate Task product behavior."
    },
    {
      "name": "strict-probe-types",
      "command": "PATH=/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH pnpm exec tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions tests/desktop/tasks-entry.ts tests/desktop/tasks-transport.ts",
      "result": "pass",
      "failures": 0,
      "note": "Actual public App/native Tasks/provider types, without source aliases or patches."
    },
    {
      "name": "native-case-syntax",
      "command": "node --check tests/desktop/tasks-installed.test.mjs && node --check tests/desktop/tasks-installed-driver.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Four headed cases parse; zero native cases executed."
    },
    {
      "name": "public-artifact-prerequisite",
      "command": "node --import tsx tests/desktop/tasks-installed-artifact.mjs .local/qualification/tasks-archives.json",
      "result": "pending",
      "failures": 1,
      "note": "Archive SHA verifies, then complete installed-package fingerprint check refuses ENOENT for node_modules/@lapis-notes/lapis-plugin-tasks. Default31 overlay has no Tasks install. No artifact bundled; composed acceptance-only install/preparation remains required."
    },
    {
      "name": "source-ownership",
      "command": "node scripts/source-audit.mjs && node scripts/source-audit.mjs --app-only",
      "result": "pass",
      "failures": 0,
      "note": "Source architecture and App ownership audits both pass."
    },
    {
      "name": "generated-summary-format-before",
      "command": "pnpm exec prettier --check MIGRATION.md",
      "result": "fail",
      "failures": 1,
      "note": "Fresh progress output initially required formatting; pnpm exec prettier --write MIGRATION.md corrected the sole formatting failure."
    },
    {
      "name": "specification-and-progress",
      "command": "pnpm progress:generate; node scripts/progress.mjs; pnpm exec spec-validator check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes56tasks/312evidence; validate, rust-format, mdbook and spec-first all pass. Existing large search-index warning is informational. Changed-file formatter passes after formatting the generated summary. No product build or native execution is implied."
    }
  ],
  "remaining": [
    "Parent composes public Tasks artifact with existing signed fixture, e2e entry, normal-bundle marker rejection and headed test list.",
    "Execute four headed cases after final shared source/ONNX pins: signed install/editor drain/cold Logbook; actual locale/provider/daily mutation; stale admission; lost reply/cold read-only recovery.",
    "Complete composed strict ordinary/e2e host, full portable and interaction/accessibility/catalog gates; all original M16.9 gates remain."
  ]
}
```

The native driver uses the real installed public plugin, planner/source editor
and production `installBundle`. The existing ephemeral signer remains the only
fixture trust boundary. The artifact builder verifies the archive and whole
installed payload, captures exact resource hashes and checks emitted static and
dynamic externals against Desktop's actual host map. No plugin implementation or
Notes source is copied or modified.

The probe wraps actual Tauri invocation only in the compiled e2e entry. It
records bounded commands/outcomes, forwards ordinary calls unchanged, releases
gates during cleanup and never retries. The provider probe uses the public App
registry; callbacks throw and count if accidentally executed. Recovery reads
public App metadata references and inspects the journal through the real command
palette. Actual WebView locale/date are compared; no fallback or clock override
is installed. Recovery references must omit original and replacement bytes.

Prepared native cases cover conditional editor-save drain, unchanged external
bytes on stale refusal, native replacements matching saved Task/daily bytes,
zero unsupported callbacks, and one accepted operation with read-only inspection
after a lost reply and cold reopen.

No native build, application process/window, browser interaction, broad worker,
baseline update, publication or default-owner change ran. Shared host/script
wiring and coordinated executions remain parent-owned. M16.9 stays In progress;
visual review stays pending. Broader source/focused transport receipts remain in
immutable E-CORE-036/037.
