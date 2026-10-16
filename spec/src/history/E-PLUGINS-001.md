# E-PLUGINS-001: post-M7 plugin and Storybook plan

The user requested the complete combined plan at root `PLUGIN_MIGRATION.md` and
scheduled implementation after M7 in root `PLAN.md`. This is documentation and
future task planning only; no plugin code or runtime is changed.

The initial working copy contained another agent's M5 watch work. That agent
committed it as `4d73f2f2` before this change touched the canonical documents.
Only the future M8–M10 rows are revised; M4–M7 rows, their gates and evidence
remain unchanged. The captured migration inventory is also unchanged.

```json
{
  "id": "E-PLUGINS-001",
  "tasks": ["M8", "M9", "M10"],
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
    "PLAN.md",
    "PLUGIN_MIGRATION.md",
    "MIGRATION.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLUGINS-001.md"
  ],
  "result": "pending",
  "remaining": [
    "M7 original gate and all deferred M4–M7 checks must pass before plugin implementation.",
    "Detailed product contracts, tasks and current migration mappings are introduced at the post-M7 handoff.",
    "All plugin implementation, native acceptance, Storybook interaction/accessibility and visual approval remain unqualified."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "root-document-formatting",
      "command": "pnpm exec prettier --check PLAN.md PLUGIN_MIGRATION.md",
      "result": "pass",
      "failures": 0,
      "note": "Both root documents passed before canonical scheduling alignment."
    },
    {
      "name": "root-plan-scope-and-links",
      "command": "python3 -",
      "result": "pass",
      "failures": 0,
      "note": "Inline checks verified both document limits, local links, absence of conflict markers, all seven stages, post-M7 gate wording and the agreed exclusions."
    },
    {
      "name": "generated-tracker",
      "command": "pnpm progress:generate",
      "result": "pass",
      "failures": 0,
      "note": "Regenerated MIGRATION.md from the revised future task rows."
    },
    {
      "name": "milestone-and-inventory-preservation",
      "command": "node --input-type=module -",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedStatusesAndDependencies": 14,
        "unchangedOtherTaskRows": 11,
        "matchingFutureGates": 3
      },
      "note": "Compared task fields and the captured inventory to committed M5 revision 4d73f2f2. M4–M7, completed tasks, M11 and M12 are unchanged."
    },
    {
      "name": "document-formatting",
      "command": "pnpm exec prettier --check PLAN.md PLUGIN_MIGRATION.md MIGRATION.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLUGINS-001.md",
      "result": "pass",
      "failures": 0,
      "counts": {
        "files": 8
      }
    },
    {
      "name": "document-bounds-and-local-links",
      "command": "python3 -",
      "result": "pass",
      "failures": 0,
      "counts": {
        "files": 8
      },
      "note": "All edited documents stay within 400 physical lines and 32768 bytes, have resolving local links and contain no conflict markers."
    },
    {
      "name": "progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidence": 28
      }
    },
    {
      "name": "specification-validation",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "validators": 6,
        "chapters": 37,
        "requirements": 46
      }
    },
    {
      "name": "mapped-specification-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "counts": {
        "protectedFiles": 3,
        "canonicalChapters": 1
      }
    }
  ],
  "contractReview": "LD-MIG-002 retains explicit gates and next actions. Future M8–M10 roadmap allocation changes to the approved plugin plan. Existing product requirements and M4–M7 gates are unchanged; this record grants no runtime qualification.",
  "milestoneReview": "M8 remains Planned; M9 and M10 remain Deferred. All other task statuses and all M0–M7/M11/M12 task fields remain unchanged. Implementation waits for M7 and its deferred checks; completedGates is empty."
}
```

Product tests, native builds and application launches are out of scope for this
documentation-only slice. No service is installed, restarted or published.
