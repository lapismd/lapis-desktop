# Retained AI policy coverage

Source: `lapis-plugins` tree `56b5d6c1` (unchanged at `9953da14`). Destination
tests retain the applicable source cases below. Imports move to owned
implementations, including split record validators. Native-specific expectation
changes are recorded below. Desktop-specific safety cases remain in
`tests/renderer/ai-*.test.mjs`. This inventory does not qualify native product
behavior or migrated UI stories.

| Source under `packages/ai/src/lib`            | Destination under `tests/ai`                  |
| --------------------------------------------- | --------------------------------------------- |
| skills/discovery.test.ts                      | skills/discovery.test.ts                      |
| skills/manifest.test.ts                       | skills/manifest.test.ts                       |
| skills/parser.test.ts                         | skills/parser.test.ts                         |
| skills/seed.test.ts                           | skills/seed.test.ts                           |
| conversations/conversation-repository.test.ts | conversations/conversation-repository.test.ts |
| conversations/vault-transcript-store.test.ts  | conversations/vault-transcript-store.test.ts  |
| conversations/validation.test.ts              | conversations/validation.test.ts              |
| conversations/approval-grants.test.ts         | conversations/approval-grants.test.ts         |
| conversations/redaction.test.ts               | conversations/redaction.test.ts               |
| conversations/context-handoff.test.ts         | conversations/context-handoff.test.ts         |
| commands/agent.test.ts                        | commands/agent.test.ts                        |
| commands/discovery.test.ts                    | commands/discovery.test.ts                    |
| commands/inspect.test.ts                      | commands/inspect.test.ts                      |
| commands/markdown.test.ts                     | commands/markdown.test.ts                     |
| commands/parser.test.ts                       | commands/parser.test.ts                       |
| commands/router.test.ts                       | commands/router.test.ts                       |
| commands/seed.test.ts                         | commands/seed.test.ts                         |
| bootstrap/build.test.ts                       | bootstrap/build.test.ts                       |
| chat/chat-mentions.test.ts                    | chat/chat-mentions.test.ts                    |
| chat/chat-trace.test.ts                       | chat/chat-trace.test.ts                       |
| chat/chat-session.test.ts                     | chat/chat-session.test.ts                     |
| chat/chat-time.test.ts                        | chat/chat-time.test.ts                        |
| chat/chat-status.test.ts                      | chat/chat-status.test.ts                      |
| chat/chat-result-views.test.ts                | chat/chat-result-views.test.ts                |
| chat/composer-model-catalog.test.ts           | chat/composer-model-catalog.test.ts           |
| sessions/session-store.test.ts                | sessions/session-store.test.ts                |
| sessions/plugin-data.test.ts                  | sessions/plugin-data.test.ts                  |
| conversations/transcript-projection.test.ts   | conversations/transcript-projection.test.ts   |
| settings/acp-agents.test.ts                   | settings/acp-agents.test.ts                   |
| tools/mcp-server-registry.test.ts             | tools/mcp-server-registry.test.ts             |

The Node Vitest lane transforms the built public API and UI helpers as Vite does
in the app; it adds no source alias, replacement package or production loader.
It mounts no UI, starts no model, reads no credentials and uses disposable
in-memory vaults. Original story coverage remains a separate gate in
`catalog/COVERAGE.md`.

The session-store interrupted-tool case now requires an error state and an
explicit unknown-outcome message instead of a completed tool. Its settled
thinking assertion remains. This matches LD-AI-002 and adds a stronger native
recovery expectation; it does not waive an existing functional check.

## Memory restoration

| Source under `packages/ai/src/lib/memory`                  | Destination under `tests/ai/memory`    |
| ---------------------------------------------------------- | -------------------------------------- |
| native-memory-service.test.ts, first describe: cases 0–7   | memory-ingestion.test.ts               |
| native-memory-service.test.ts, first describe: cases 8–12  | memory-curation.test.ts                |
| native-memory-service.test.ts, first describe: cases 13–16 | memory-recall.test.ts                  |
| memory-record-store.test.ts                                | memory-record-store.test.ts            |
| memory-ingestion-coordinator.test.ts                       | memory-ingestion-coordinator.test.ts   |
| memory-scheduler.test.ts                                   | memory-scheduler.test.ts               |
| runtime-consolidation-provider.test.ts                     | runtime-consolidation-provider.test.ts |

All 17 service cases and the separate one-case memory app-tools describe are
retained. `memory-tools.test.ts` runs the original provider-independent snapshot
and cross-binding result assertions through the owned AppToolHost.

`ai-controller` 89b5c6f1's capture-boundary regression is retained in
`memory-capture.test.ts`. Its separate ingestion/recall/forget fixture is
covered by the 17 retained Lapis service cases rather than copied as a new fake
database. Desktop additions cover tilde escape collisions, disposal/rebuild of
legacy index paths, capture refusal/location integrity and cancelled maintenance
selection/startup. No durable schema, transcript hash or opaque ref is renamed.

`memory-record-validation.test.ts` additionally rejects non-string IDs and
oversized writes before either current state or revision preimages change.

## Application-tool policy

`tools/app-tool-host.test.ts` retains all 13 source cases in the same
destination path. Imports target separate errors, contracts, approvals and
schema modules. The original unloaded-during-approval assertion still requires
`tool_unavailable` and no execution. New lifetime cases additionally require
immediate signal cancellation on unregister, no pre-cancelled dispatch and an
unknown checkpoint outcome when cancellation wins after mutating dispatch.

`app-tool-schema.test.ts` covers full draft-7 meta-schema validation,
unavailable references, supported dialects, frozen registration integrity and
structured results. Its two initially invalid root-schema fixtures were
corrected to exercise nested invalid schemas past the public registry's
object-root guard; no admission assertion was removed. `app-tool-csp.test.ts`
uses a fresh Node subprocess with string code generation disabled. That is
interpreter evidence, not native WebKit CSP acceptance or Rust IPC
qualification.

## Controller, bootstrap and conversation navigation

| Source under `packages/ai/src/lib`                                                                                                                                                                | Destination under `tests/ai`                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| chat/chat-controller.test.ts                                                                                                                                                                      | chat/controller/chat-controller-{1–5}.test.ts        |
| chat/chat-controller.follow.test.ts                                                                                                                                                               | chat/controller/chat-controller.follow-1.test.ts     |
| chat/chat-controller.skills.test.ts                                                                                                                                                               | chat/controller/chat-controller.skills-{1–3}.test.ts |
| chat/ai-view-bootstrap.test.ts                                                                                                                                                                    | chat/view-bootstrap.test.ts                          |
| conversations/{conversation-index,conversation-index-coordinator,conversation-locator,conversation-palette,handoff-summary,history-creation-scope,reveal-scope,scope-resolver,scope-tree}.test.ts | conversations/ with the same test filenames          |

All 56 original controller, eight bootstrap and 31 conversation cases remain.
Desktop additions cover five acknowledgement/opaque-option safety cases and one
question acknowledgement case. The cancellation expectation requires error plus
explicit unknown outcome in place of falsely completed tools. `/help` retains
its assertions and additionally requires stable binding/session reuse;
submission now preserves implicit request defaults for local command dispatch.
The policy runner compiles Svelte runes normally; no runtime rune shim is used.

## Controlled AI Settings

`settings/{settings-store,model-options,setting-values}.test.ts` adds desktop
coverage for serialized durable writes, failure recovery, retained source data,
provider-specific defaults, community opt-ins and closed/stale model inventory.
The settings fields and change semantics derive from current plugin
`settings/register-ai-settings.ts` at `ee20d366`; these behavioral tests replace
source-string assumptions with owned policy and real public tool registries.
They do not qualify native process admission or complete M10.2.

## History and Catalog policy

The eight original cases in `history/conversation-history-tree.test.ts` and
`catalog/{filter,tree,inventory}.test.ts` retain lapis-plugins `ee20d366`.
`history/search.test.ts` adds local-index failure, deleted-index ghosts,
authoritative local metadata and retained index-only text hits. Real-App browser
panel stories separately exercise errors, tool rollback, archive/restore/delete,
stale refreshes and owned cleanup. Real workspace placement coverage lives in
the desktop catalog; ordinary production admission remains pending.

## Owned plugin lifetime

`plugin/{maintenance-lifetime,preferences,services}.test.ts` covers draining
started maintenance, disabled/data preferences, App-scoped service factories and
rejection of deferred execution modes. Bootstrap adds cancellation during a
pending model catalog. `chat/controller/disposal.test.ts` covers late saved
reads, late resume acknowledgements and an in-flight transcript checkpoint. The
retained cancellation fixture now ends its event stream on close, preserving
every original spinner, cancellation and unknown-outcome assertion.

Real Chat/History/Catalog read drains, zero-allocation startup, first-location
stability, explicit replacement and manager-driven re-enable are catalog gates.
They do not qualify ordinary native ACP execution or complete M10.2.

## JSONL preview

`jsonl/preview.test.ts` retains all five source parser cases from lapis-plugins
`ee20d366`. `jsonl/view.test.ts` retains the two view cases and adds owned read/
unmount drainage, cancelled publication and closed admission. Live props use the
base file view's reactive data/path; workspace save remains inert. Real-App
catalog checks separately retain the original shell-preview assertions and
exercise reopen, guarded refresh/rename, disable/re-enable and pending initial
read cleanup. These do not admit ordinary native AI execution.

Native user-command storage adds four renderer transport/lifetime cases and an
atomic default-seeding regression alongside the original seed case. Rust file
policy and cold named-IPC acceptance remain separate evidence in E-AI-020. Nine
external-refresh regressions cover lazy bounded polling, additions/edits/
deletion, one lease, stable order, failure deduplication/recovery, acknowledged
writes, stale reads/errors and drained closure. The catalog inventory regression
rejects file commands duplicated as app-owned commands. Real minimal-shell
stories separately qualify visible refresh and retained inventory on IO failure.
Ordinary service binding and mounted native recovery remain M10.2 work.
