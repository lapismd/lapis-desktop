# E-PLUGINS-002: pre-controller ACP migration reference

The user requested the missing historical direct-ACP option in the saved plugin
migration plan. Stage 5 now links a detailed root reference with immutable
plugin/host revisions, a source map, transport differences, reuse alternatives
and acceptance guidance. No product code or runtime is changed.

The initial default workspace contained another agent's uncommitted M7.2 work.
This slice was prepared and checked in an isolated Jujutsu workspace based on
`f0a95aad`. The user explicitly approved only additive M10/evidence references
in the shared bookkeeping files, preserving and excluding the other agent's
changes from this commit.

```json
{
  "id": "E-PLUGINS-002",
  "tasks": ["M10"],
  "requirements": ["LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "prettier": "3.3.3",
    "specValidator": "0.1.4"
  },
  "files": [
    "PLUGIN_MIGRATION.md",
    "AI_ACP_REFERENCE.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLUGINS-002.md"
  ],
  "result": "pending",
  "remaining": [
    "M10 implementation and native/Storybook acceptance remain deferred; this document grants no runtime qualification."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "history-examples-before-path-fix",
      "command": "python3 -",
      "result": "fail",
      "failures": 1,
      "note": "The first example used jj -R with a cwd-relative file path, which resolved outside the selected repository. Remaining examples were not reached. Corrected all example filesets to root: paths."
    },
    {
      "name": "history-path-diagnostic",
      "command": "jj -R ../lapis-plugins --no-pager file show -r 27c1427a3aa3 packages/ai/src/lib/host/create-host-runtimes.ts",
      "result": "fail",
      "failures": 1,
      "note": "Confirmed the same fileset error from the desktop cwd. The command diagnostic recommends root: for repository-relative paths."
    },
    {
      "name": "historical-source-examples",
      "command": "python3 -",
      "result": "pass",
      "failures": 0,
      "counts": {
        "examples": 4
      },
      "note": "Executed all four corrected read-only jj examples verbatim from the desktop checkout. Both baseline sources and the cutover diff resolved; the ACP directory comparison returned no changes. Also verified retained ACP test paths and LN-AI-006 controller ownership."
    },
    {
      "name": "document-formatting",
      "command": "pnpm exec prettier --write PLUGIN_MIGRATION.md AI_ACP_REFERENCE.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLUGINS-002.md",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "generated-tracker",
      "command": "pnpm progress:generate && pnpm exec prettier --write MIGRATION.md",
      "result": "pass",
      "failures": 0,
      "note": "The formatted tracker is byte-identical to its parent: evidence-only selection changes no generated status or next action."
    },
    {
      "name": "scope-and-document-integrity",
      "command": "node --input-type=module -",
      "result": "pass",
      "failures": 0,
      "counts": {
        "taskRows": 17,
        "documents": 7
      },
      "note": "All task fields match the parent except the added M10 evidence reference. Immutable inventory unchanged. All seven Markdown documents meet line/byte limits, local links resolve and no conflict markers are present."
    },
    {
      "name": "format-check",
      "command": "pnpm exec prettier --check PLUGIN_MIGRATION.md AI_ACP_REFERENCE.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLUGINS-002.md",
      "result": "pass",
      "failures": 0,
      "counts": {
        "files": 7
      }
    },
    {
      "name": "progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 17,
        "evidence": 45
      }
    },
    {
      "name": "specification-validation",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "validators": 6,
        "chapters": 57,
        "requirements": 71
      }
    },
    {
      "name": "mapped-specification-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "counts": {
        "protectedFiles": 1,
        "canonicalChapters": 1
      }
    }
  ],
  "contractReview": "LD-MIG-002 is unchanged. The reference explains the already-selected direct-ACP route without changing product requirements or completion gates. Historical controller requirements must be remapped before implementation.",
  "milestoneReview": "M10 remains Deferred; only its selected evidence gains E-PLUGINS-002. All statuses, dependencies, gates and next actions are unchanged. M7.2 work and the pause before M8 remain outside this slice."
}
```

The pre-controller plugin was not exclusively ACP: its factory also constructed
Codex Native. Only its direct ACP path is selected for the new desktop. Reuse
does not mean the old bridge is compatible with control-v3. The old unknown
permission option fallback to `allow_once` must be replaced with exact provider
option IDs and rejection/cancellation of invalid choices.

The saved reference retains current UI, storage and fixes, and identifies the
controller-owned types, memory and handoff imports that also need migration. Old
web attachment and Node/Deno hosting remain outside the desktop target.

Product suites, native builds, app launches and live-provider tests are out of
scope for this documentation-only slice. No source dependency is modified,
service restarted or package published.
