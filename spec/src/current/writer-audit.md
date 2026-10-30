# Enabled writer audit

This inventory supports LD-LIFE-007. The milestone ledger remains the completion
authority; an inventory row or passing component test does not complete M4.
Scope expands from Source Editor, Markdown and File Explorer to the M6 Search
and Graph intake, plus shared shell settings and navigation commands.

| Writer                                                           | Owner and boundary                                                                   | Evidence and final qualification                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API note editors and Source Editor                               | API document-owned editing sessions and conditional persistence                      | E-CONFLICT-001 and cold Notes conflict/lifecycle acceptance; preserve this coverage.                                                                                                                                                |
| Generated memory notes and durable receipts                      | Desktop captured mutation using API FileTextPersistence and native producer metadata | E-CORE-033 retains the existing conditional baseline and immutable one-shot input; Core editing must preserve bundled AI startup and activation.                                                                                    |
| Editable note/link previews                                      | Markdown binding, Mira text authority and API conflict registry                      | E-PREVIEW-001 and three cold preview recovery cases; preserve retired-draft and stale-decision coverage.                                                                                                                            |
| Properties/frontmatter, including bulk property mutations        | API queued managed mutation; Markdown supplies the previously displayed record       | E-MUTATION-001 records native close/cold restore, stale-record recovery and retained permission failure. API frontmatter-persistence covers initial-read failure and rejected recovery projection; retain full-suite qualification. |
| Metadata type state                                              | API App-owned mutable text-state writer on the editing registry queue                | Seven targeted metadata cases and the actual native property-type menu/cold restoration pass. Final cold writer qualification passes in E-QUALIFICATION-002.                                                                        |
| Workspace layout                                                 | API's awaitable single layout writer                                                 | E-LIFE-001 and cold failed-layout/reload coverage; continue flushing before workspace teardown.                                                                                                                                     |
| App configuration and plugin settings in app.json                | API Configuration's serialized logical changes and App-owned text-state writer       | E-STATE-001 records concurrent-key, pending/failure and conditional recovery qualification. Shared Settings changes enter this owner before the presentation debounce.                                                              |
| Hotkey overrides                                                 | API CommandManager's App-owned conditional text-state writer                         | E-STATE-001 records external-write recovery and startup loading of the existing override through the normal workspace command.                                                                                                      |
| Core-plugin enable/disable state                                 | API PluginManager's retained conditional state writers                               | E-WRITERS-001: immediate native close/cold restoration and source failure/runtime recovery pass; full aggregate close/restart, retained failure and live disk recovery pass in E-GRAPH-001/002.                                     |
| App Shell plugin enablement                                      | API App Shell plugin-persistence adapter                                             | E-WRITERS-001: retained admission, external byte preservation, blocked close and existing-control recovery pass.                                                                                                                    |
| Plugin compatibility data files                                  | API Plugin.writeLegacyData                                                           | E-WRITERS-001 and owning source record: secondary compatibility writes retain failures and explicit recovery after canonical app.json succeeds.                                                                                     |
| New files/folders and attachments                                | File Explorer/API operation orchestration over admitted native IO                    | E-WRITERS-001: source drains note/binary/folder creation through projection; native immediate create/close/restoration passes. M5 file management is qualified in E-QUALIFICATION-002.                                              |
| Application URLs and native menu history                         | App-owned admitted URL operations and the focused editor's existing history          | M7 URLs join fileEditingSessions.track through dispatch and acknowledgement. Native history enters the existing editor keymap. Neither adds an independent note writer; final cold qualification passes in E-QUALIFICATION-002.     |
| Language-service edits, terminal, AI, sync and installed plugins | Native service/plugin capabilities outside the initial profile                       | No intake here. Their explicit capability and writer qualification remains with M8–M10; unavailable native commands must continue to reject.                                                                                        |

App state stays under the shared `.lapis` default. The pre-release reset policy
does not waive pending-save ownership, note integrity or a visible failure.
Native IO serialization, atomic replacement and database lifetime remain
independent of renderer writer admission.

Database-backed metadata, indexes and explicitly persisted notification records
use the public AppDatabase and the ordered native connection. Its close waits
for admitted SQL operations; M3's rollback/restart and real database acceptance
remain part of the final native gate. Transient notifications and progress do
not introduce another note writer. Native recent/last-vault profiles use awaited
atomic persistence, native geometry uses window-state persistence, and launcher
appearance uses synchronous localStorage. Retain the original profile, geometry
and chooser cold-restoration checks for these host-owned state paths.

E-QUALIFICATION-002 passes the complete cold edit/save/quit/relaunch,
failed-save, external-conflict and repeated-switch gates for every enabled
writer above. Native file, navigation and integration scopes retain that
original aggregate qualification. Deno desktop stays frozen; no publication or
app signing is introduced.

M6 adds Search settings/recent-query data and Graph control/settings persistence
to the enabled writer surface. Their admission, debounces, unload and failure
recovery are included in the final LD-NAV-007 and aggregate M4/M6 qualification.
E-SEARCH-002 records passing Search close/cold restore, failed-save protection
and live disk recovery through the source-owned repair. Graph intake adds source
admission before settings debounce and live recovery for every open view; native
close/restart, retained failure and live disk recovery pass in E-GRAPH-001/002.
Final aggregate qualification passes in E-QUALIFICATION-002.

## Editing and recovery boundaries

The Notes host consumes the App-owned conflict registry, including retired
writers. Problems opens the shared editable three-way review; its settings use
compact, theme-aware Toggles. Saving uses the captured guarded writer;
whole-version decisions remain conditional and revalidate disk bytes before
discarding drafts. Check disk again refreshes snapshots without resolving.
Failed/stale decisions retain conflicts and block shutdown. Desktop adds no
parallel save path.

Editable Markdown previews bind their captured Mira session to the original
App's editing registry and the public API FileTextPersistence contract. Each
source keeps its own acknowledged baseline and operation-owned recovery lease;
equivalent internal-link resolution must not replace the visible writer. Failed
and retired previews remain visible to shutdown and recovery. Accepting disk
text must update the visible editor and permit later saves, including after an
empty save. Unbound writes on conditional-capable hosts reject.

API editors and editable previews are separate qualified components. Properties
and metadata text mutations must join the App-owned writer lifecycle, protect
existing documents before transformation and retain failed drafts for recovery.
Properties must compare the displayed record with authoritative frontmatter;
unrelated body edits remain compatible. Metadata types must join shutdown before
any debounce can omit an edit, including initial creation and external deletion.
The complete enabled-writer audit and cold native acceptance remain M4 gates.

E-CORE-034 pins a stale Properties draft before external mutation and awaits
metadata hydration before committing it. Native qualification preserves the
focused draft, explicit disk recovery and later edits without dropping keys.

M16.7/E-CORE-034 passes 58 actual native cases with Core editing selected,
including original writers, Search/Graph settings, Terminal leave, Memory and
real popup lifetimes. All 2,068 catalog cases and both app configurations pass.
Renderer remains default; native Tasks/shared readers and R3 cutover are
separate.
