# Find and navigate (M6)

M6 composes existing Search, Markdown metadata/navigation and Graph packages.
Their public views, controls, settings and command openers remain authoritative;
the host adds the plugin profile and native qualification. Do not create a
replacement Search, metadata panel, graph or navigation implementation.

E-AI-022 revalidates the two E-AI-020 native Search regressions with the
corrected public source archive: disk recovery updates live settings before
another write, and indexing/navigation retains the query after cold restart.
Both original cases pass unchanged; hidden API and browser checks remain
separate evidence.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-NAV-001 | Desktop MUST load the public Search and Graph plugins with the existing Source Editor, Markdown and Explorer profile before metadata and layout restoration. Each plugin MUST share the explicitly owned App/API instance, default enabled and retain the existing user-disable setting.                                |
| LD-NAV-002 | Lexical Search MUST use the native AppDatabase and reflect note creation, content edits, renames, deletion and cold restart. Persisted results and generated indexes MUST NOT preserve stale paths or omitted edits. Semantic model download and initialization MUST remain disabled by default.                        |
| LD-NAV-003 | Search results and ordinary Markdown/internal-link navigation MUST open the intended note and supported source position through the existing workspace commands. Navigation MUST preserve pending writers and the selected layout rather than replacing the workspace or saving through another pipeline.               |
| LD-NAV-004 | Existing Outline, Tags, Properties, Backlinks and Outgoing Links MUST derive from the owning App's indexed metadata, follow the active note and reflect edits, renames, deletions and restart. Their native controls MUST continue to use the shared component and workspace lifecycles.                                |
| LD-NAV-005 | Tag and property Search actions MUST use the registered Search command with the intended query. Missing or disabled Search MUST retain the existing recoverable behavior without accessing plugin internals or another App.                                                                                             |
| LD-NAV-006 | Existing global and local Graph views MUST use native indexed metadata, preserve supported note/tag/attachment/unresolved semantics and refresh after relevant file changes and restart. Local Graph MUST follow the active note. Graph navigation and tag Search MUST use existing public workspace/command contracts. |
| LD-NAV-007 | Search and Graph settings, recent-query state and controls MUST join existing App-owned persistence before asynchronous work or presentation debounce can omit changes. Native close, failed saves and explicit recovery MUST preserve pending drafts and external bytes under the original M4 writer guarantees.       |
| LD-NAV-008 | Search, metadata and Graph views MUST restore through their registered public view types and saved workspace layout after a cold restart. Existing command-palette and keyboard navigation MUST reveal the intended surface without duplicate or missing-view replacements.                                             |

## Intake and qualification

First qualify Search registration, native lexical indexing and existing metadata
navigation. Then qualify global/local Graph, its settings writer and native
refresh/navigation. Retain every functionality item and the original M6 gate; an
earlier component slice cannot mark the whole milestone Done.

Use source-owned public builds and verified local archives. Keep tracked npm
ranges and lockfiles portable, sharing API, Svelte and editor class identities.
Fix defects in their owning package before refreshing the consumer cohort.

Native canvas acceptance restores native-window visibility before observing
animation frames and node hover labels; it retains the indexed semantic,
navigation and persistence assertions. Readiness receipt matching observes each
complete output chunk before retaining a bounded tail, so batched driver logs
cannot hide a completed renderer boot.

The enabled-writer audit expands with Search and Graph. A delayed plugin save
must remain admitted before host shutdown begins; an unload-time save alone is
not evidence that pending controls entered the original M4 guard. Generated
database state is disposable but its lifecycle must drain before database close.

Native acceptance uses isolated real folders and the actual shared workspace.
Query and metadata assertions must inspect visible results alongside disk bytes,
then repeat after edit/rename/delete and cold restart. Graph qualification uses
its real views and indexed source data, not a fixture renderer or copied panel.

The active session still defers full source, Storybook/axe, web, Desktop and
ordinary-bundle lanes until M7 implementation is complete. Original M4–M7 gates
remain open until those deferred lanes pass. Deno is frozen; publishing,
signing, semantic compute and post-M7 plugin intake remain deferred.

Search settings qualification includes immediate close/cold restore, retained
permission failure and explicit disk recovery. The recovered values must reach
the real controls before an unrelated partial change; native disk bytes and
original close barriers remain part of the acceptance.

Metadata acceptance uses the existing command openers and public panel hosts.
Qualify Outline source-position navigation, Backlinks/Outgoing Links activation,
Tags/property Search handoffs, external refresh and restored native views.

Graph intake follows Search in the optional default-enabled profile. Native
acceptance exercises the real global/local canvases, indexed node/link counts,
filters, file-follow and refresh, node-menu navigation and restart. Test
observers forward unchanged standard Canvas drawing calls; they do not supply
graph data or replace its renderer. Source package tests retain graph derivation
semantics.

The affected native profile also qualifies shared startup and teardown after
Graph registration. Native Close timeout diagnostics capture visible failure
text before forced cleanup; they never extend the original deadline or turn a
blocked close into success. Sync-host observed events queue behind its initial
identity reconciliation in the owning API package.
