# Migration inventory and progress

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-MIG-001 | The migration inventory MUST retain source repository revisions and map legacy desktop requirements, commands/events, services, plugins, packaging and acceptance surfaces to a destination task and a reuse, port, replace, defer or retire disposition. |
| LD-MIG-002 | Every roadmap task MUST retain an explicit gate and next action. Deferred capabilities MUST remain visible, and product implementation MUST first introduce its owning contract. The generated MIGRATION summary MUST agree with the task ledger.         |

The immutable baseline inventory is `spec/migration-inventory.json`. It is
self-contained and validates without sibling checkouts. Capture fresh source
evidence when extending the inventory; do not silently treat a later checkout as
the original migration baseline.

[Milestone tasks](progress/milestones.md) alone own statuses and selected gate
evidence. Root MIGRATION.md projects that table and links the complete PLAN.md.
The first useful target ends at M4. M0.1 is a native shell qualification, not a
claim that the application can edit notes.

The shell qualification retains the original M0.1 gate. The next task is M1;
application signing and notarization stay deferred to M11 per the user's
2026-10-15 instruction.

## Shared state policy

The user approved `.lapis` as the shared vault-local application-state default
on 2026-10-15. This applies to the entire application, including desktop, web,
and server hosts. M1 changes the default in the shared API and resolves
configuration, workspace/layout, hotkeys, and plugin persistence through it in
every affected package and host. There is no Tauri-specific default or nested
state directory. Host profiles and databases continue using OS application-data
directories.

The application is unreleased. Existing pre-release application state may be
reset or overwritten; `.obsidian` discovery, import, merging, compatibility
fallbacks, backups, and legacy-state rollback are outside the delivery gates.
M1, M2, and M12 have user-approved revised gates in the task ledger. Normal
note-saving, dirty-buffer, filesystem, and database transaction guarantees
remain in scope. No runtime behavior changes in this planning revision.
