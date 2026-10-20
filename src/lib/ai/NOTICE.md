# AI application code attribution

Restored app-owned contracts and conversation hashing from the Apache-2.0 Lapis
first-party AI plugin in lapismd/lapis-plugins. The pre-controller runtime seam
is pinned at 27c1427a3aa35e5e41d11e58be56c38821888364; memory extraction is
pinned at ea4fc89b31d74b0ff9946b6d7a395c0b4fb3307f. Current plugin data fields,
source at 56b5d6c1, and the published Apache-2.0 ai-controller 0.1.0
compatibility declarations were compared to retain newer optional fields. No
controller client, runtime or memory implementation is imported into the desktop
dependency graph. The desktop owns these contracts.

Context projection is adapted for separate native text/context fields.

Conversation storage, validation, durable redaction and tool identity helpers
retain the current plugin at 56b5d6c1. Validation is split by record family.

Handoff projection is restored from 27c1427a3aa3 with desktop-owned bounds and
summary admission; no controller implementation is imported.

The ACP runtime/session/event seam adapts the pre-controller design to the
public lapis-ai client and raw control-v3 observations. Legacy semantic-option
fallbacks and JavaScript host execution are not restored.

Skill discovery, parsing, snapshots, manifest generation and bundled seeding,
with their applicable original policy regression suites, retain 56b5d6c1.

Command policy, bootstrap and their applicable original regression suites retain
56b5d6c1. The old Node user-agents implementation and loader are excluded.

Chat state, settings/session data and transcript projection retain 56b5d6c1.
Projection is split by read/write responsibility. The retained fake runtime is
test-only; Design Core presentation functions remain imported public contracts.

Memory ingestion, capture, consolidation, ranking, scheduling and record policy
retain the Lapis implementation extracted at ea4fc89b31d7, with later fixes from
ai-controller 89b5c6f1. Vault adapters, app tools and retained memory suites use
lapis-plugins 56b5d6c1. These are now desktop-owned modules; no controller
package is linked or imported. Shared hashes use the owned conversation
implementation.

Application-tool policy and its original 13-case suite retain lapis-plugins
56b5d6c1. The old controller/Deno bridge is excluded. Runtime AJV code
generation is replaced by the public portable @cfworker/json-schema interpreter.
The unmodified draft-7 meta-schema data is from
https://json-schema.org/draft-07/schema, retrieved 2026-10-17; its specification
license is retained in tools/schema/LICENSE.md (JSON Schema Specification
Authors, BSD-3-Clause / Academic Free License 3.0). This is declarative standard
schema data rather than a vendored validation implementation.

Chat controller, bootstrap, conversation navigation and handoff orchestration,
request cards, chat-panel DOM/CSS and retained catalog cases derive from
lapis-plugins tree 56b5d6c1. The controller/panel are split by responsibility;
provider acknowledgement, explicit option kinds, failure reporting and fresh
question clearing are desktop repairs. Components live under
src/components/ai/chat. Catalog fixtures reuse the test-only fake runtime and
own disposable in-memory Apps; no fake provider enters production.

AI Settings field identities, descriptions, tool controls and model-selection
policy retain lapis-plugins revision ee20d366609209392ed83d73068a1b8519bcb0a0,
`packages/ai/src/lib/settings`. Desktop splits registration, field definitions,
value admission and persistence by responsibility. Controlled plugin data,
serialized durable writes, stale-result fencing and deferred-runtime handling
are desktop adaptations; the public Workspace Settings renderer is reused.

History/Catalog panel markup, paint, helpers and eight policy cases retain
lapis-plugins ee20d366, `packages/ai/src/lib/{history,catalog}`. Desktop splits
panels by responsibility, resolves index hits against current local records,
fences disposed refreshes, reports action failures and retains complete visible
accessible names. Catalog fixtures retain the original panel behavior plays; the
six real workspace placements and owned plugin composition now retain the same
revision's `ai-plugin.ts`, view registration and panel fixture/examples. Desktop
uses only ACP runtime ports and awaits owned lifecycle work. The old controller
host, native-mode execution and original broad fixture's unrelated plugins are
excluded. The complete bundled native handover remains separate.

JSONL preview, file-view identity, original parser/view cases and shell-preview
assertions retain lapis-plugins ee20d366, `lib/jsonl` and
`shell/Shell.stories.ts`. Desktop uses the public file content host, owned
change subscriptions, guarded refresh, awaited unmount and an inert save method.
Shared Markdown/Chat/CodeBlock presentation remains imported through public
package exports.

Full-shell fixtures and retained Shell/Registry behavior plays derive from
lapis-plugins ee20d366, compared with Notes 77ae5c13. Desktop splits fixtures
and stories by responsibility, injects catalog-only ACP clients and documents
source differences in catalog/AI_MIGRATION.md. Public examples derive from
actual seeds/layouts. Notes Catalog's command navigation and expansion checks
are retained in addition to skill navigation.

Local discussion reply-context composition adapts
`jj-store/web/src/lib/conversations/agent-adapter.ts` at `9e531400` while
retaining Notes-owned transcript parents, acknowledgement and binding checks.
Presentation uses public Design Core Transcript/TranscriptController exports; no
JJ store or native conversation publication is introduced by these local links.

AI-JSONL-UI retires the retained Chat.Layout timeline/composer and old JSONL
markup. AiRecordedTranscript shares the existing durable projection across
imports and file previews. AiSessionFrame/AiSessionThread extract the already
attributed jj-store inbox composition; docs/provenance.json retains those source
mappings. The unused capture-source table is retired; its original provenance
remains in historical E-AI-054. No shared-package source is copied.

Markdown-friendly agent links adapt JJ Store's
`community-markdown-content/ syntax-hast-links.ts`,
`CommunityMemberReference.svelte` and exact ID decoder at
`df31b5caeaabd562b0b76806f89bc50dec073ec5` (Apache-2.0). Notes owns its
`lapis://agent` scheme and immutable-reader adapter; badge profiles use public
Design Core AuthorCard. Source mappings are recorded in docs/provenance.json.
