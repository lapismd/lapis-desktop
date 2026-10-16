# Desktop catalog foundation

```json
{
  "id": "E-CATALOG-001",
  "tasks": ["M8", "M8.0"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-DESK-005"
  ],
  "revision": "enclosing-change",
  "files": [
    ".gitignore",
    ".prettierignore",
    ".storybook/main.ts",
    ".storybook/preview.css",
    ".storybook/preview.ts",
    ".storybook/vitest.setup.ts",
    "AGENTS.md",
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/Introduction.mdx",
    "catalog/plugins/Launcher.stories.ts",
    "catalog/plugins/Workspace.stories.ts",
    "catalog/support/LauncherDemo.svelte",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/lifecycle.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/catalog-tests.mjs",
    "scripts/repository-files.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-001.md",
    "spec/src/history/index.md",
    "spec-validator.config.mjs",
    "src/components/views/NotesWorkspace.svelte",
    "tests/governance/source-audit.test.mjs",
    "tsconfig.json",
    "vite.catalog.config.ts",
    "vite.config.ts",
    "vitest.catalog.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M8.0": "Desktop catalog renders real production composition, builds statically and passes both-theme interaction/accessibility cases without native services."
  },
  "runs": [
    {
      "name": "catalog-before",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "note": "The command did not exist."
    },
    {
      "name": "production-boundary-before",
      "command": "node --test --test-name-pattern=\"production cannot import\" tests/governance/source-audit.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "production-boundary-after",
      "command": "node --test --test-name-pattern=\"production cannot import\" tests/governance/source-audit.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0
    },
    {
      "name": "initial-types",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 7,
      "warnings": 1
    },
    {
      "name": "initial-full-catalog",
      "command": "pnpm test:storybook",
      "result": "fail",
      "passed": 8,
      "failures": 2,
      "note": "Workspace imports required the Mermaid runtime dependency prebundles."
    },
    {
      "name": "workspace-a11y-before",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts -t \"Edit Note\"",
      "result": "fail",
      "failures": 1,
      "note": "The production shell section declared a region around its existing main landmark."
    },
    {
      "name": "workspace-a11y-after",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts -t \"Edit Note\"",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "svelte-import-first",
      "command": "pnpm test:storybook catalog/plugins/Launcher.stories.ts -t \"Open Vault\"",
      "result": "fail",
      "failures": 1,
      "note": "The first host configuration lacked Svelte package resolution for runed."
    },
    {
      "name": "commonjs-import-first",
      "command": "pnpm test:storybook catalog/plugins/Launcher.stories.ts -t \"Open Vault\"",
      "result": "fail",
      "failures": 2,
      "note": "Both viewport suites failed on an unprepared CommonJS eventemitter import."
    },
    {
      "name": "editor-identity-first",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts -t \"Edit Note\"",
      "result": "fail",
      "failures": 1,
      "note": "Prepared all public CodeMirror modules consistently before retrying the same target."
    },
    {
      "name": "spec-map-first",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Added the owning file-lifecycle unchanged-contract confirmation and M8.0 migration mapping."
    },
    {
      "name": "catalog-matrix",
      "command": "pnpm test:storybook",
      "result": "pass",
      "passed": 24,
      "failures": 0,
      "note": "Six production-component scenarios at two widths in both light and dark themes. Cold rerun after generated-output watcher exclusions."
    },
    {
      "name": "static-and-production",
      "command": "pnpm build-storybook && pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Static documentation/catalog and production renderer builds pass; complete production module graph excludes catalog/Storybook."
    },
    {
      "name": "checks",
      "command": "pnpm check && pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Strict Svelte/TypeScript: zero errors and warnings; all four specification lanes pass."
    },
    {
      "name": "parallel-cargo-attempt",
      "command": "pnpm test (during native build)",
      "result": "fail",
      "passed": 141,
      "failures": 2,
      "note": "73 JS and 68 Rust cases passed; concurrent native Cargo build invalidated objc2 doc-test metadata (E0463). Retried after native build completed; future Cargo mutations stay serial."
    },
    {
      "name": "serial-doc-retry",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --doc --locked",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "serial-tests",
      "command": "pnpm test",
      "result": "pass",
      "passed": 141,
      "failures": 0,
      "note": "73 JS and 68 Rust tests; two existing ignored Rust provider cases remain explicit. Doc phase compiles with zero doctests."
    },
    {
      "name": "native-smoke",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m8/native-focused\" node --test --test-concurrency=1 --test-name-pattern=\"cold Close and application Quit\" tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0,
      "note": "Fresh feature-gated .app, isolated profile, Node/Deno-free application PATH, real edit/save/Close/Quit/relaunch."
    },
    {
      "name": "dev-render",
      "command": "pnpm storybook; Playwright launcher probe and screenshot inspection",
      "result": "pass",
      "failures": 0,
      "note": "Initial probe waited for Create a vault although recent-vault fixture correctly displays Open a vault; corrected locator. Screenshot inspected. Visual baselines remain pending."
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "vitest": "4.1.11",
    "playwright": "1.61.1",
    "platform": "macOS ARM64"
  },
  "contractReview": "Desktop Storybook mounts production components, uses explicitly owned disposable in-memory sessions and injected clients, and stays outside production bundles. Both themes and viewport sizes qualify independently of native services.",
  "milestoneReview": "M8.0 meets its unchanged gate. M8 remains In progress; M8.1 Terminal is next. This slice does not complete portable plugins, installation or AI/compute."
}
```

The catalog hosts the existing VaultLauncher and NotesWorkspace. It supplies a
fake native picker and an in-memory Notes session; the production workspace
constructs and tears down its actual App. Storybook awaits fixture disposal. The
first composition story loads and edits a real note. Launcher scenarios cover
opening, failure/retry availability and return to a prior vault.

The first browser attempts lacked Svelte resolution and packed CommonJS
prebundling. Their import failures were corrected in the catalog configuration.
A subsequent CodeMirror identity failure was resolved by preparing the shared
public editor modules consistently. No package source alias or patch is used.
The catalog follows the Notes catalog inline component-CSS compilation path,
which retains real styles without missing virtual-CSS requests.

The stricter full axe lane exposed a nested main landmark in the production
Notes wrapper. Its labelled section is now an explicit group around the existing
workspace main. The exact edit/axe case passes at both widths. No accessibility
rule or behavior assertion was relaxed.

The source audit rejects production imports from catalog code. The production
Vite build also checks its complete module graph for catalog/Storybook paths.
Generated catalog/browser output is ignored by source traversal and version
control. Registry manifest/lock ranges remain portable; the 14 current public
archives were reinstalled and byte-verified after adding development tools.
Visual baselines remain pending and are not updated.

The catalog watcher ignores generated Rust targets, local acceptance artifacts,
static catalog output and the specification book. The complete cold catalog
matrix passes with that startup configuration. Source qualification logs and the
launcher screenshot remain local under `/tmp/lapis-m8-*` and `.local/m8`.
