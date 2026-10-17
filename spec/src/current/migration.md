# Migration inventory and progress

The requested M8.5 shell/story review consumes local Design Core 0.5.1 while
preserving existing desktop contracts. It adds editable Problems-based conflict
review, shared recovery presentation and product-only Terminal previews. Merge
settings use compact controls with selected backgrounds (E-CATALOG-005/006).
Test suites and native builds remain deferred; AI work stays paused for this
review.

E-REPO-002 completes M13.1's original native admission gate. M13 and M13.2
remain In progress; visible Notes history/diffs and recoverable JJ-backed chat
remain required. The shared delivery checklist in jj-store reports these slices
without replacing this ledger or promoting fixture previews to product gates.

The reusable workflow implementation resumes after the earlier review
checkpoint. M10.2 adds a lazy conversation-persistence injection seam while
retaining its original native-chat gate. Legacy vault-file conversations keep
their existing backend. A receipt-aware JJ backend and native capture ownership
still require implementation and separate downstream acceptance.

The task ledger alone owns current statuses and selected completion evidence.
Root `MIGRATION.md` is its generated projection; `PLAN.md` retains every
original milestone gate. Component success, bookkeeping and screenshots cannot
replace those gates. The user authorized completion of the current slice
followed by all M8–M10 plugin-plan stages on 2026-10-17. Commit each verified
slice. The latest user instruction pauses after the current Notes AI-binding and
initial-progress correction, then opens the ordinary app for review. Resume only
when requested: M10.2 execution/context/skills/recovery, M10.3 native tools and
credentials, M10.4 optional compute, independent M7.3 ordinary pop-outs, then
M11 distribution and M12 cutover. Original task gates remain unchanged.

Quiet desktop checks and the mapped minimal-shell state catalog are complete
(M0.2/M8.4). Native AI admission groundwork is selected under M10.2: caller and
vault lifetime checks have a separate hidden-WebView API lane. Ordinary builds
expose no AI execution targets; the exact main-window ACP-session grant cannot
select an executable. Notes now binds admitted services; native execution,
context/skills and recovery remain open. Full native UI qualification remains
explicit headed work; both corrected Search consumer regressions pass in
E-AI-022.

M10.2 now binds Notes to the native AI factory and restores its optional bundled
registration. Global command files and the retained Settings/History/Catalog
stay App-owned; native target execution, skills/context integration and mounted
turn recovery still require qualification. E-AI-023 records this binding slice
without claiming the aggregate AI gate.

M7.2 qualifies retained live popup projection, guarded shared close and browser
header clearance through source-owned public archives. Its browser evidence does
not admit ordinary Tauri windows or replace M7.3 native qualification.

The immutable baseline inventory is `spec/migration-inventory.json`. It retains
source revisions and validates without sibling checkouts. Capture fresh source
evidence when extending it; do not treat later checkouts as the original
baseline. Revised post-M7 destinations are recorded separately at that handoff.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-MIG-001 | The migration inventory MUST retain source repository revisions and map legacy desktop requirements, commands/events, services, plugins, packaging and acceptance surfaces to a destination task and a reuse, port, replace, defer or retire disposition.                                                  |
| LD-MIG-002 | Every roadmap task MUST retain an explicit gate and next action. Deferred capabilities MUST remain visible, and product implementation MUST first introduce its owning contract. The generated MIGRATION summary MUST agree with the task ledger.                                                          |
| LD-MIG-003 | The Deno desktop MUST remain superseded and frozen. Further desktop features, fixes and host qualification MUST target Tauri. Shared changes MUST remain in their owning packages. The frozen host MAY remain a reference until M12 removes it; Deno services used by other hosts are outside this freeze. |

## Runtime and acceptance boundaries

The Tauri shell reuses the public vault chooser, progress, recovery, Settings,
workspace and plugin components. Its native vault/database adapters provide
admitted storage for the explicitly owned App. Database rollback/restart and
actual edit/save/attachment/reopen acceptance remain M3's combined gate.

M4 covers every enabled writer in the [writer audit](writer-audit.md): notes and
editable previews, Properties/frontmatter, metadata types, layout,
configuration, hotkeys and plugin state. Safe Close, Quit, reload, chooser
return and repeated switching retain failures and dirty drafts. Startup retry,
session Safe Mode and explicit reset retain inventory LN-DENO-052/053/054
without silently rewriting canonical choices or the skipped saved layout.

M5 combines exclusive creation, admitted mutations, App-owned watcher
reconciliation, dirty rename/delete protection, imports and existing Explorer
native actions. Unsupported hosts retain explicit capability behavior and local
trash fallback. Actual macOS Finder/default-open/system-trash dispatch and
fixture restoration are separate from mocked adapter tests.

For LN-DENO-076, retain the immutable baseline's M5 port disposition. Tauri
replaces Deno's intermediary Vite Fetch proxy with direct devUrl loading and
bundled production assets. LD-FILE-005 governs direct compressed native loading
and unmodified raw GET/HEAD/IPC resources; each needs its own evidence.

M6 uses public Search, metadata/link panels and global/local Graph.
Qualification covers indexing after edits/rename/delete, existing query
handoffs, intended-note navigation, settings admission/recovery, file following
and cold layout restore. M7's [integration contract](integration.md) adds native
menus, bounded service ports, single-instance delivery and queued application
URLs through the existing App and leave coordinator.

The 40px workspace tabs remain at the top edge with no title or toolbar above
them. Native controls and Tauri HTML drag handles retain the original shell
requirements. Startup progress disappears when the workspace is ready. Native
window geometry, source tests and physical drag evidence remain distinct from
visual baseline approval and public distribution.

For this delivery session only, full repository/consumer/native lanes were
deferred until M7 implementation. Run every deferred lane before qualifying
M4–M7 and preserve all failed attempts. This temporary exception does not change
the repository's default testing policy. Final results are recorded in
[E-QUALIFICATION-001](../history/E-QUALIFICATION-001.md) and
[E-QUALIFICATION-002](../history/E-QUALIFICATION-002.md).

Renderer components, application orchestration and global styles use the
feature-grouped layout in `AGENTS.md`. Moving files or introducing this
structure does not replace functionality acceptance.

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
remain in scope. M1 implements and qualifies the shared default across the
affected hosts.

## Local archive qualification

During migration, shared changes are built, tested, and packed in their owning
repositories, then installed in Tauri through verified local pnpm archives. This
is the user-approved M1 qualification path. Package publication moves to the
final release gate. Tracked registry manifests/lockfiles remain portable;
ignored install overlays record source revisions and archive checksums.

M1 native consumer qualification imports the path default and desktop runtime
classification from the actual packed public API. Source regression evidence and
native app evidence are recorded separately. Library archives carry the actual
Jujutsu source snapshot and verified package identities; passing local
installation alone does not complete the native consumer gate.

## Frozen desktop and distribution

The Deno desktop is superseded and frozen under LD-MIG-003. Retain its source
and historical evidence as references until M12; do not port new functionality
back, edit that host or require additional packaged Deno desktop runs for Tauri
slices. Shared-library ownership remains unchanged, and Deno services used by
web/server hosts remain outside this freeze. The freeze does not complete M12 or
change its capability-coverage gate.

Application signing and notarization remain deferred to M11 per the user's
2026-10-15 instruction. Publication and clean-machine/platform distribution
qualification remain separate from the local macOS preview.

## Authorized plugin delivery

M8.0 starts with the real desktop launcher and Notes workspace, disposable
in-memory vault/database sessions and injected clients. Every story runs at
desktop and narrow sizes in light and dark, separately from native acceptance.
Static catalog, production module exclusion and source audits qualify its gate.

The user resumed root `PLUGIN_MIGRATION.md` on 2026-10-17 after M7.2. M8 covers
Stages 0–3, M9 covers Stage 4 and M10 covers Stages 5–6. The detailed M8.0–M10.4
tasks and [plugin contract](plugins.md) govern implementation. Completed M0–M7
and M7.2 gate strings and immutable evidence remain intact.

Prefer local source checkouts through public exports and verified built output,
using ignored JavaScript install overlays and explicit Rust path dependencies.
Do not create package releases for this work. Verified archives remain supported
for reproducible acceptance. Every source change receives its owner's checks,
source revision and consumer evidence. If signing fails, use unsigned local
commits as the user authorized; this does not alter artifact signature checks.

Desktop owns bundled AI/Terminal policy and migrated application stories;
`lapis-ai` and `lapis-terminal` own reusable native runtimes/adapters. Preserve
the affected plugin data and disabled preferences. Deno desktop stays frozen.
Web AI/Terminal removal preserves unrelated data and supported shared app tools.

The captured inventory remains an immutable baseline. Each stage records fresh
source-to-destination story coverage and current plugin mappings. Root
`AI_ACP_REFERENCE.md` pins the pre-controller ACP seam; reuse current fixes and
data rather than rolling back the plugin. No AI controller or Node/Deno runtime
is introduced. Roles/CV, Docs, Tasks, Sync and Community remain excluded.
Application signing/publication and other-platform distribution remain deferred.

M8.0 is committed. M8.1 integrates the unpublished local Terminal public build
without publishing a release; its temporary private-app link is explicit.
Terminal runtime qualification remains separate from catalog evidence.

M8.1 Terminal is qualified in E-TERMINAL-001. M8.2 Web retirement now records
its source-policy, data-preservation and cold browser checks separately in
E-WEB-001; it does not alter frozen Deno desktop source.

M8.3 implements admitted native assets and explicit Tauri ESM selection. Focused
native checks cover all seven portable plugins and real workers/WASM. Final
qualification includes a shared Core Settings correction retaining App Shell
controls and live-locator restoration acceptance; the original gate is
unchanged. M9 installer regressions and final native acceptance are recorded
separately in E-INSTALL-001.

M9.1 qualifies source-owned static identity, replacement, uninstall and restart
recovery through actual signed packaged installation and the retained public
Plugins/Settings UI. M8 fixture seeding remains separate from this proof.

M9 source lifecycle safety is committed in Notes as `2b7ee095`; 1,734 source
tests, 259 catalog cases and 13 Web/server cases pass. Desktop consumes five
refreshed public archives with all 14 routes verified. The original M9/M9.1
gates pass in E-INSTALL-001: all 113 native cases, 84 desktop catalog cases and
the ordinary ARM64 bundle audit pass.

M10.1 is complete. E-AI-001 retains the source session foundation and E-AI-002
records the qualified reusable Rust/Tauri transport, built public renderer
client and cold packaged WebView acceptance. Source and consumer qualification
remain distinct. The installed fourteen-archive cohort is retained.

M10.2 remains in progress. Desktop-owned policy now includes context/events and
transcript contracts (E-AI-003), conversation persistence (E-AI-004), bounded
handoff (E-AI-005), the adapted native-client runtime seam (E-AI-006), retained
skill discovery and original policy tests (E-AI-007), and command/bootstrap
policy with a legacy-runtime audit (E-AI-008), and chat state/transcript
projection with exact-choice and interrupted-work recovery (E-AI-009). The unit
coverage inventory is `tests/ai/COVERAGE.md`. E-AI-023 subsequently mounts the
retained views with native services; it does not qualify ordinary execution.

Retained UI, memory, activation, native admission, command storage and migrated
stories now have their focused evidence below. Native execution, context/skills
and durable recovery retain the unchanged aggregate M10.2 gate. Native
application tools/credentials and optional compute remain M10.3 and M10.4. The
ledger alone owns completion; catalog passes cannot qualify the remaining native
execution, recovery or application-tool behavior.

M10.2's restored memory policy retains original service/storage/scheduler
suites; its app-tool-host case now runs through the retained owned policy.
Memory unit qualification does not complete mounted AI views, stories or durable
native turn recovery.

M10.2 chat-controller and presentation restoration is separately recorded in
E-AI-012. Retained catalog interactions and policy suites do not substitute for
bundled production registration, settings/history, native context/skill
integration or durable turn recovery. Its original aggregate gate stays open.

Native source organization is maintenance selected under M10.2; it does not
complete or change any AI or distribution gate. E-STRUCTURE-002 qualifies the
feature layout, placement guidance and enforced native source boundaries.

The retained chat checkpoint keeps its original policy and presentation evidence
immutable. E-AI-013 qualifies its retained chat catalog through source-owned
accessibility fixes, verified public archives and all four catalog lanes.
Settings/history, native admission, context, skills, recovery, app tools and
compute retain their gates.

AI Settings moves into desktop ownership through the existing public controlled
Settings surface. E-AI-014 records persistence, provider/model and tool-control
qualification separately from production bundled AI registration. Historical
preferences stay inert; no native runtime is restored by Settings intake.

History/Catalog behavior retains its original coverage. E-AI-016 adds all six
Chat/History/Catalog workspace placements and owned plugin lifecycle scenarios.
E-AI-017 retains JSONL preview separately. E-AI-018 qualifies retained Shell and
Notes Catalog scenarios, with 54 browser source mappings. The two Live Host
replacements and ordinary bundled native AI admission, context/skills and
recovery still require M10.2 qualification. M10.3 native tools/credentials and
M10.4 optional compute remain in the authorized scope.

E-AI-019 separately qualifies the committed native dependency graph before
ordinary AI admission. Dependency intake cannot complete a product gate.

E-AI-020 adds admitted native command storage. E-AI-021 adds owned external-file
refresh and live Catalog subscriptions. AI factory admission, context/skills and
mounted native conversation recovery remain open.

The requested M0.2 quiet default and M8.4 desktop-state catalog are independent
review-workflow additions. They preserve every original native product gate and
the ongoing M10.2–M10.4 delivery scope.

E-STRUCTURE-003 separates the AI/compute contract without changing requirement
text or original task gates. Contract organization cannot qualify execution.

E-AI-025 shares native physical-vault admission without adding a repository
command or completing M10.2. Independent service registries preserve separate
activation and retirement. JJ history, durable capture and conversation backend
integration retain their own remaining gates.

Repository reuse consumes owned jj-store discovery and history libraries for an
existing Git-backed JJ vault. This separate M13 workstream adds no conversion,
source snapshot, code mutation or automatic metadata synchronization. M10 AI
execution and persistence gates remain independently selected.
