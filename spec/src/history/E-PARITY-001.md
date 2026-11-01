# Packaged Notes profile and hosted-UI cohort

```json
{
  "id": "E-PARITY-001",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-006", "LD-GOV-008"],
  "files": [
    "package.json",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "versions": {
    "api": "0.2.4",
    "ui": "0.1.6",
    "workspace": "0.3.2",
    "fileExplorer": "0.2.1",
    "appProfile": "0.1.0",
    "designCore": "0.9.0",
    "mira": "0.1.4",
    "agentUI": "0.2.0",
    "repositoryUI": "0.1.1",
    "history": "0.2.0",
    "specValidator": "0.2.0",
    "markdown": "0.2.1",
    "bases": "0.2.0",
    "tasks": "0.1.1",
    "aiHost": "0.3.0"
  },
  "contractReview": "Desktop retains its native resource lifetime adapter and shared WorkspaceShell. Only portable renderer dependency minimums change. Explicit checksum archives qualify the public profile imports; no source aliases, native lifecycle changes or baseline updates.",
  "acceptanceReview": "The affected public profile/catalog boundary passes. These Docker renderer receipts do not qualify native product/provider execution or registry-only distribution.",
  "runs": [
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-c9e2fba5-0a33-4bd9-8c75-6f7dc8f34ba7"
    },
    {
      "name": "architecture",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-af781f99-7cca-4251-8b76-9e61aab47e03"
    },
    {
      "name": "App ownership",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-0ae4b562-0a92-49c3-974b-9760216a4910"
    },
    {
      "name": "AI policies",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-c2fe007f-4e16-4ec5-bd2e-ae42b4b1574f",
      "tests": 744
    },
    {
      "name": "renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-207de853-985e-4057-ad8c-9e723de514d4"
    },
    {
      "name": "affected catalog",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts catalog/plugins/ai/NativeNotes.stories.ts catalog/plugins/ai/NativeTurns.stories.ts catalog/plugins/ai/NativeQueue.stories.ts catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-ff60cb01-aff6-4f67-b7d3-af9286eb4d26",
      "tests": 760
    },
    {
      "name": "Existing historical references, native diagnostic and Docker evidence check",
      "command": "node scripts/evidence.mjs; pnpm check:evidence",
      "result": "fail",
      "failures": 7,
      "receipt": "lapis-desktop-validation-6eb26f05-a3f7-4582-b8c5-d728fa24b84c"
    },
    {
      "name": "Final specification check after current document structure fixes",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 7,
      "receipt": "lapis-desktop-validation-ff00b849-61e8-468f-bf38-76f6eab0a84a",
      "note": "Only pre-existing missing historical file references in immutable E-CI-003 and E-CI-004 remain; no product or axe failure."
    },
    {
      "name": "Complete source formatting",
      "command": "pnpm format:check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-aba64c1a-50b2-43d3-835d-00104e132bf2"
    },
    {
      "name": "Mapped specification boundary, authoring check",
      "command": "spec-validator first --base @- --head @",
      "result": "pass",
      "failures": 0,
      "note": "One protected manifest and two canonical chapters; this does not waive the seven evidence errors."
    },
    {
      "name": "Latest AI Host cohort, full Docker check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-27ca8755-9cad-4147-a7b9-2c6fe30f2a92"
    },
    {
      "name": "Latest cohort, complete default tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-b41d8bb9-5230-48a0-b781-2bc60c62d971",
      "nodeTests": 585,
      "aiTests": 744
    },
    {
      "name": "Latest cohort renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-12d124c1-5c43-4c10-be0d-73e18c2f6bcd"
    },
    {
      "name": "Superseded Markdown 0.2.1 catalog run",
      "command": "pnpm test:storybook <affected families>",
      "result": "pending",
      "failures": 0,
      "receipt": "lapis-desktop-validation-1ff4764b-9f11-453d-bbc1-a1d8655e78b4",
      "note": "380 passed across both light modes; deliberately stopped before completion to admit released AI Host 0.3.0. This is not a passing full lane."
    },
    {
      "name": "Latest cohort full affected catalog",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts catalog/plugins/ai/NativeNotes.stories.ts catalog/plugins/ai/NativeTurns.stories.ts catalog/plugins/ai/NativeQueue.stories.ts catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-ef95542c-8eb9-4156-9078-2bf3db59f0b0",
      "tests": 760
    },
    {
      "name": "Committed Notes export intake, public type acceptance",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-6ef45af0-4f6d-4e25-b204-942a45213ab7"
    },
    {
      "name": "Committed intake, specification and evidence",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-25140df2-e5b5-4453-9859-2065bfcb156b"
    },
    {
      "name": "Committed intake complete formatting",
      "command": "pnpm format:check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-92a5793f-33f0-4c04-a434-d84cd8820161"
    }
  ],
  "remaining": [
    "Publish remaining public prerequisites only after separate authorization; regenerate complete frozen registry lock and qualify the image.",
    "Refresh hosted CI source pins after release; current hosted CI is not qualified by the local archive run.",
    "Native product/provider and visual approval remain separate gates."
  ]
}
```

The ignored `.local/ui-parity/final-cohort.json` selects 40 checksum-pinned
public archives. Each catalog mode passes 190 cases: desktop light/dark and
narrow light/dark, 760 total with zero interaction/axe failures. The source
cohort includes final Core Settings reconciliation and Search file-identity
observation. Native/private inputs outside that cohort retain prior pins.

An initial read-only Docker preflight failed because its old SSH control socket
was unavailable; no worker was created and no native fallback ran. The ignored
configuration now uses the existing authenticated connection. Doctor and QMD
search pass through installed spec-validator 0.2.0; no global/editor
configuration changed. Final public package source equality is recorded below.

The unchanged evidence checker reports seven missing historical paths in
E-CI-003/E-CI-004 in both native authoring and Docker. Five are removed conflict
components; two are removed planning/catalog documents. The first spec rerun
also found three current-document size/navigation issues, now repaired; the
exact repeated spec check retains only those seven historical findings. No
record was edited, diagnostic disabled or allowlist added. E-EVIDENCE-001 now
appends hash-verified ancestral deletion provenance for these paths. Final
normal checks must pass before this specification gate is qualified; no
historical result is rewritten.

The refreshed immutable inventory is
`.local/ui-parity/final-cohort-markdown-021.json`. Markdown 0.2.1 differs from
the earlier qualified archive only in package/manifest metadata and release
documentation; runtime, styles and declarations are identical. The retained
private AI archive is 0.1.1 while the tracked manifest requests ^0.2.0. This
profile/catalog intake does not qualify complete native dependency freshness,
cohort range satisfaction or a frozen private/registry install.

The AI Host 0.3.0 refresh repeats all 760 affected catalog cases with zero
interaction or accessibility failures. Complete default tests pass 585 Node, 744
AI-policy and 259 Rust cases, with 2 pre-existing ignored Rust cases. Normal
check includes strict Rust Clippy for default/e2e targets and formatting; normal
specification and evidence checks now pass. E-EVIDENCE-001 resolves the seven
historical path findings without changing E-CI-003/E-CI-004.

The final 40-archive projection is
`.local/ui-parity/final-cohort-committed-notes.json`. Notes code is committed at
`3d7bce209f11fe58933df05f14c3888c8cd34ba5`; Docker pack producer
`2d6896e1f548bd0a3b1da35f2c28379c86242372` has the identical tracked tree. All
884 archive members are compared: runtime, styles, declarations and docs match
the prior qualified input. Only API’s AI Host minimum and Profile’s Markdown
minimum change in package metadata. Final types/specification/format acceptance
repeats on the committed public exports; the 760-case runtime proof remains
applicable to those identical payloads.

The old shared SSH control socket expired during a later read-only preflight.
That owned attempt was stopped before a worker existed; an explicitly
authenticated task connection then ran the normal Docker lanes. No native
fallback or source exception was added. The unchanged private AI limitation and
release/distribution/visual gates above remain explicit.
