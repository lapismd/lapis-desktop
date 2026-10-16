# Enabled writer audit

This inventory supports LD-LIFE-007. The milestone ledger remains the completion
authority; an inventory row or passing component test does not complete M4.
Scope is the desktop's enabled Source Editor, Markdown and File Explorer profile
plus the shared shell's settings and navigation commands.

| Writer                                                           | Owner and boundary                                                             | Evidence or next verification                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API note editors and Source Editor                               | API document-owned editing sessions and conditional persistence                | E-CONFLICT-001 and cold Notes conflict/lifecycle acceptance; preserve this coverage.                                                                                         |
| Editable note/link previews                                      | Markdown binding, Mira text authority and API conflict registry                | E-PREVIEW-001 and three cold preview recovery cases; preserve retired-draft and stale-decision coverage.                                                                     |
| Properties/frontmatter, including bulk property mutations        | API queued managed mutation; Markdown supplies the previously displayed record | E-MUTATION-001 records passing native close/cold restore, stale-record recovery and retained permission failure; audit initial read/admission failures before M4 completion. |
| Metadata type state                                              | API App-owned mutable text-state writer on the editing registry queue          | Seven targeted metadata cases and the actual native property-type menu/cold restoration pass. Preserve this coverage during the remaining writer audit.                      |
| Workspace layout                                                 | API's awaitable single layout writer                                           | E-LIFE-001 and cold failed-layout/reload coverage; continue flushing before workspace teardown.                                                                              |
| App configuration and plugin settings in app.json                | API Configuration.persist and plugin-data update methods                       | Audit pending asynchronous updates and failures; prove close waits and concurrent settings updates preserve every key.                                                       |
| Hotkey overrides                                                 | API CommandManager.saveHotkeys                                                 | Add pending/failure lifecycle coverage and cold persistence through the existing Settings surface.                                                                           |
| Core-plugin enable/disable state                                 | API PluginManager's debounced configuration writers                            | Replace the void flush boundary with awaitable, failure-retaining ownership; prove immediate close and retry. Community installation remains outside this profile.           |
| New files/folders and attachments                                | File Explorer/API operation orchestration over admitted native IO              | Audit close during an admitted create. M5 adds and qualifies remaining mutations, imports, watch reconciliation, Finder reveal and trash.                                    |
| Language-service edits, terminal, AI, sync and installed plugins | Native service/plugin capabilities outside the initial profile                 | No intake here. Their explicit capability and writer qualification remains with M8–M10; unavailable native commands must continue to reject.                                 |

App state stays under the shared `.lapis` default. The pre-release reset policy
does not waive pending-save ownership, note integrity or a visible failure.
Native IO serialization, atomic replacement and database lifetime remain
independent of renderer writer admission.

After component qualification, rerun the complete cold edit/save/quit/relaunch,
failed-save, external-conflict and repeated-switch gates before marking M4 Done.
M5, M6 and M7 must then meet every functionality item and original gate in
PLAN.md. Deno desktop stays frozen; no publication or app signing is introduced.
