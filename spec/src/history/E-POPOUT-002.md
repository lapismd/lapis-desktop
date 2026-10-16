# Shared popup workspace

```json
{
  "id": "E-POPOUT-002",
  "tasks": ["M7.2"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-MIG-002",
    "LD-POP-002",
    "LD-POP-003",
    "LD-POP-004",
    "LD-POP-006",
    "LD-NAV-006"
  ],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "POPOUT_PLAN.md",
    "spec/src/current/windows.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-POPOUT-002.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "tests/desktop/notes-conflicts.test.mjs",
    "tests/desktop/preview-conflicts.test.mjs",
    "tests/desktop/navigation-graph.test.mjs",
    "spec/src/current/navigation.md",
    "tests/desktop/native-visibility.mjs",
    "tests/desktop/native-readiness.mjs",
    "tests/desktop/native-session.mjs",
    "tests/governance/native-readiness.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M7.2": "Browser acceptance moves a real note into a popup and back while preserving its draft and editor history. Multiple popups remain independent, overlays stay in their own document, and failed opening or closing leaves source content reachable. Top and stacked popup headers reserve native-control clearance after resize."
  },
  "runs": [
    {
      "name": "design-core-before",
      "command": "pnpm exec vitest run --project unit src/shared/workspace/core/workspace-popout.spec.ts",
      "result": "fail",
      "failures": 4
    },
    {
      "name": "notes-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'preserves live popup'",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "browser-session-initial",
      "command": "WORKSPACE_STORYBOOK_PORT=7340 pnpm exec playwright test -c playwright.workspace.config.ts tests/workspace/popout-session.spec.ts --retries=0",
      "result": "pass",
      "passed": 5,
      "failures": 0
    },
    {
      "name": "source-unit-qualification",
      "command": "Design Core: pnpm test:unit; Notes: pnpm exec turbo run test --filter=!@lapis-notes/desktop-deno",
      "result": "pass",
      "passed": 2163,
      "failures": 0
    },
    {
      "name": "source-storybook-qualification",
      "command": "Design Core: pnpm test:storybook; Notes: pnpm test:storybook",
      "result": "pass",
      "passed": 1012,
      "failures": 0
    },
    {
      "name": "desktop-unit-qualification",
      "command": "pnpm test",
      "result": "pass",
      "passed": 139,
      "failures": 0
    },
    {
      "name": "native-first-full-attempt",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "native-retained-close-exact",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m72/native-focused\" node --test --test-concurrency=1 --test-name-pattern=\"closing (a conflicted|a preview)\" tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "readiness-before",
      "command": "node --test tests/governance/native-readiness.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "readiness-after",
      "command": "node --test tests/governance/native-readiness.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "resource-final-exact",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m72/native-focused\" node --test --test-concurrency=1 tests/desktop/file-http-representation.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "notes-final-pointer",
      "command": "WORKSPACE_STORYBOOK_PORT=7340 pnpm exec playwright test -c playwright.workspace.config.ts --workers=1 --retries=0",
      "result": "pass",
      "passed": 10,
      "failures": 0
    },
    {
      "name": "notes-final-cohort-storybook",
      "command": "pnpm test:storybook --force",
      "result": "pass",
      "passed": 258,
      "failures": 0
    },
    {
      "name": "final-native-cold",
      "command": "pnpm test:desktop",
      "result": "pass",
      "passed": 95,
      "failures": 0
    },
    {
      "name": "final-check",
      "command": "pnpm check && pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "final-unit",
      "command": "pnpm test",
      "result": "pass",
      "passed": 141,
      "failures": 0
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "contractReview": "One App, retained editor identity, session-only popups, one layout writer and full popup header clearance. Native ordinary admission remains M7.3.",
  "milestoneReview": "M7.2 meets its original browser gate; every owning source and affected Desktop lane is qualified. Ordinary native popup integration remains M7.3, and subsequent plugin delivery is separately scheduled.",
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "version": "0.1.3",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
      "sourceRevision": "081798b77e9a375b3bd70477af02021de5c1ceb7"
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "14ea70b5c384b1be659eda28304442147b015d2b5011ade1de838755e12a9111",
      "sourceRevision": "081798b77e9a375b3bd70477af02021de5c1ceb7"
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.1",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
      "sourceRevision": "081798b77e9a375b3bd70477af02021de5c1ceb7"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481",
      "sourceRevision": "081798b77e9a375b3bd70477af02021de5c1ceb7"
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.2.1",
      "sha256": "8550106ce3b3e5b2befc5553b535805713e3cb6665be69102f884336ebbeb5df",
      "sourceRevision": "081798b77e9a375b3bd70477af02021de5c1ceb7"
    },
    {
      "name": "@lapis-notes/source-editor",
      "version": "0.1.2",
      "sha256": "b02865a1f53fbfbab77d146449b9b358785a7f6d2aec074cede7c1883570ddff",
      "sourceRevision": "265680b6ba3f6bdd4fc73e3bc6562d754b2bda42"
    },
    {
      "name": "@lapis-notes/markdown",
      "version": "0.1.6",
      "sha256": "1fd2f7d7dbd33ec4a7627ba4ff9ecf5eed4d888d22c46fc21b8d3ac4e21cb96e",
      "sourceRevision": "265680b6ba3f6bdd4fc73e3bc6562d754b2bda42"
    },
    {
      "name": "@lapismd/mira",
      "version": "0.0.5",
      "sha256": "ba44e98bc0c61490e48f7a7cf4ec24e819963d506145cf94792a83e68e6d39d6",
      "sourceRevision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b"
    },
    {
      "name": "@lapismd/mira-editor",
      "version": "0.0.2",
      "sha256": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3",
      "sourceRevision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b"
    },
    {
      "name": "@lapismd/mira-plugin-ai",
      "version": "0.0.2",
      "sha256": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823",
      "sourceRevision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b"
    },
    {
      "name": "@lapismd/mira-plugin-mermaid",
      "version": "0.0.2",
      "sha256": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e",
      "sourceRevision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b"
    },
    {
      "name": "@lapismd/design-core",
      "version": "0.4.0",
      "sha256": "0d31cc17e3be99bff4eea941de0ab828aabc5f94a12dddcf5a24ec6d3629a4fd",
      "sourceRevision": "a65dcf6d5b40199aadbaa22f4934215202f07f55"
    },
    {
      "name": "@lapis-notes/search",
      "version": "0.1.3",
      "sha256": "5e98170ac31c559c2b98820b35749925d62f7b006842dfa14b933fa660ba1f47",
      "sourceRevision": "ed85b8367868e33d3eeb704c5566aa026fe6ded5"
    },
    {
      "name": "@lapis-notes/graph",
      "version": "0.1.3",
      "sha256": "416488a35593be8ce5fa608cedf627e00a6e63cbc6b12c3b53c2519e6584fd13",
      "sourceRevision": "147ba6e2e3e4af1e1818179c1f309fc3b420ce44"
    }
  ],
  "archiveRoutes": 14,
  "sourceChanges": {
    "designCore": "54756952db68e762f0885b4e8ef75b9a06833068",
    "notes": "a7b3e3b7"
  }
}
```

M7.2 source qualification retains one App, one layout writer and the existing
leaf/editor across popup transfer and return. Generic close admission runs
before destructive removal. Rejected native note and editable-preview tab closes
now keep the tab, draft and shutdown barrier available until explicit recovery
and retry.

The first full native run passes startup and foundation but fails three profile
cases: a Graph driver timeout and two superseded tab-removal expectations. The
two strengthened close cases pass their exact rerun. Graph canvas acceptance now
establishes visible, focused native ownership before observing animation frames.
Initial isolated reruns also hit driver timeouts; the full cold rerun passes the
Graph target and all 64 profile cases. The final complete run passes all 95
native cases, including both resource cases.

Core qualification includes 747 unit cases, 754 interaction/accessibility cases,
15 workspace, 11 shell and three AI browser cases. Shadcn complete runs each
report 82 passes, one existing skip and one failure. Exact top-bar and
dark-dialog reruns pass; the latter full run navigated its iframe during text
entry. A stopped intermediate concurrent run had two more failures, both passing
exact serial reruns. No unresolved source target or relaxed assertion remains.

Notes qualification includes 1,416 unit cases, 258 interaction/accessibility
cases, all 18 public check/build tasks, package checks and a fresh static
catalog. The first complete pointer lane passes six and fails four cases. Three
stale story routes and one overlapping story-play/editor measurement were
corrected. Outgoing Links also distinguishes the omitted outer guide from its
authored map image and explicitly requires that image to remain visible. All
exact reruns pass. A concurrent startup attempt and a plain-static-server
attempt were stopped after loading failures; the normal Storybook lane remains
authoritative.

The public archives above are byte-verified across all 14 Desktop import routes.
Notes also verifies the final Core archive across seven routes. The source
revision fields identify the snapshots used for packing; final source changes
add evidence and acceptance corrections. Tracked registry dependency files are
unchanged.

Ordinary native popup admission, native command/attachment routing, protected
application teardown and measurement against actual popup traffic lights remain
M7.3. Subsequent plugin delivery is scheduled separately. Deno desktop and
Electron are frozen references; signing, publication, native cross-window drag
and restart restoration remain deferred.

The resource lane exposed a readiness-receipt harness defect: truncating a log
batch before matching could omit the Rust acknowledgement. New split-chunk and
large-batch regressions fail before their helper exists, then both pass. The
harness now matches each full batch before retaining a bounded marker tail.
Initial resource reruns alternated boot timeouts; an instrumented diagnostic
observed a ready renderer, and the corrected exact resource lane passes both
cases without changing its deadlines or representation assertions. The final
complete native rerun passes all 95 cases (2 startup, 27 foundation, 64 profile
and 2 resource cases). Desktop checks, specification validation, 73 JS and 68
Rust tests pass. The intermediate specification check lacked its mapped
migration chapter; adding the M7.2 contract confirmation resolves it.
