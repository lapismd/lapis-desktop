# Local AI setup and optional compute

LD-AI-001–004 and LD-COMP-001 govern this active local ACP profile. Native
AgentStore/ThreadStore conversation persistence remains Deferred. Existing
file-backed conversations, private per-conversation drafts and ordinary ACP
sessions stay supported.

## Clients and context

Codex, OpenCode and Cursor are independently admitted from the fixed installed
runner catalog. A missing or unconfigured client never disables another client.
The bundled Lapis agent becomes available only after explicit provider setup.
The chat agent picker includes Lapis AI alongside Codex, Cursor and OpenCode,
using the same native admission as Settings. Model, reasoning effort and
execution mode are confirmed through advertised ACP configuration before
sending. Running workers keep their captured configuration.

A binding freezes bounded application bootstrap, the available-skills manifest
and selected skill instructions into initial context. This is separate from
saved authored text, attachments and per-turn context. The initial aggregate has
a 128 KiB UTF-8 limit; snapshots and activations retain their own bounds. Skill
text cannot grant execution permission. Restricted memory/handoff work uses only
the native-admitted bundled Lapis profile, without MCP tools or filesystem hint
discovery; it never delegates to an external client.

## Providers and application tools

AI Settings groups Conversation, Models, Memory (including handoff summaries)
and Tools in Design Core responsive pill tabs. Compute uses the same control for
Models, Resources and Sharing. Overflowed choices remain reachable from More,
and settings search reveals the owning tab. Compute actions have icons and text
labels. Tabs stay pinned above scrolling content on an opaque theme background;
page and repeated tab headings are omitted, with slightly inset descriptions
inside each panel. These presentation changes preserve saved values, draft state
and explicit action semantics. Agents owns named profiles and installed clients.
Choosing the Lapis harness in the agent editor exposes that agent's provider,
endpoint, write-only API key and exact model. New Lapis profiles use independent
device-owned configurations keyed by stable vault and profile identities. Two
profiles may use different endpoints, credentials and models; selecting one
never changes another. Existing device-wide configuration remains compatible
with saved sessions; Agents Settings exposes only the named-profile gallery and
Add agent. The standalone legacy Lapis editor and its Settings-only refresh are
removed. No provider key or endpoint enters a vault's portable profile record;
it contains only the opaque configuration selector and ordinary
model/presentation fields. Unknown configuration selectors refuse; they never
select the legacy provider. Provider updates affect new bindings; running
workers retain their configuration. Chat headers use the chosen agent’s custom
avatar or harness icon. Multiple participants use the public Design Core avatar
group with profile hover cards. Removing a portable agent does not silently
delete its device credentials.

Compute is a dedicated settings-sidebar section with the `cpu` icon. It owns
model preparation, download/import, serving, sharing and Max VRAM (GB), using
the existing bounded native memory setting and runtime limit. Moving controls
neither starts compute nor resets saved limits. Provider choices use the public
native catalog, excluding subscription OAuth. This machine and Paired machine
remain explicit inference choices; unavailable compute never selects cloud
inference.

Device configuration contains opaque Keychain references. API-key input is
transient and write-only; status, JSON diagnostics, transcripts, vault settings
and browser persistence never expose it. Conditional saves retain exact request
identities, revisions and receipts. Unknown saves are observed or retried with
the same identity. Adopting a superseding revision is explicit. Provider changes
invalidate discovery and new admission without interrupting running workers.
Cloud providers require an explicit nonblank default model at setup and native
launch; a missing model never becomes an implicit `auto`. Settings identify the
required field and discover alternatives from the saved profile when supported,
with a custom model ID fallback. This machine and Paired machine use their
separate compute model configuration. Legacy incomplete settings remain
readable, exact committed save receipts remain replayable, and credential
removal stays available without supplying a model. Validation occurs before new
credential writes.

Codex, OpenCode and Lapis use the existing private stdio MCP bridge. Cursor uses
an authenticated stateless HTTP MCP endpoint on literal loopback with an
explicit ephemeral port. Trusted declarations contain environment references,
not bearer values. Browser Origins, foreign Hosts, malformed/oversized frames,
duplicate request IDs and excess concurrency refuse. Both transports delegate to
the same original AppToolHost binding, registration checks, schema validation,
exact approvals, guarded Vault edits, cancellation and unknown-effect policy.
They create no second tool implementation or repository authority.

Close, disable, root/generation changes and shutdown fence calls before draining
owned execution and listeners. Cleanup remains available after revocation.

## Optional compute

Status reads, Settings mount and startup allocate no compute process, model
download, inference request or sharing session. Save changes only configuration
while off. Prepare, Download, Import and Start are explicit independent actions.
Start uses installed weights and a prepared native runtime. Import validates and
copies a selected absolute GGUF path into managed storage. Import GGUF composes
Design Core FilePathInput with an explicit native GGUF chooser. Selection only
changes the local path draft; cancellation, errors, newer input and revoked
admission preserve it. Native admission is checked before and after selection.
Max VRAM composes QuantityInput with canonical whole GB, an optional bounded
slider and retained invalid drafts. Empty remains null/no explicit limit; mount,
display controls and tab changes never save or start compute.
Model/resource/peer controls adapt JJ Store’s Settings components through public
Design Core fields.

All model choices in AI Settings, agent/provider editors and Compute use
searchable Command View pickers. AI defaults, memory and handoff reuse the
app-owned agent model control through the public controlled custom-field API;
the controller retains the original string schema, source, validation and save
ownership. Search filters labels, IDs and descriptions. Saved missing values
remain visible; closing or searching never writes a value. Processor catalogs
remain independent and stale/unmounted results cannot replace active choices. AI
model setting fields center their closed labels and match the surrounding
control sizes. Command results remain left aligned.

The searchable compute model picker copies JJ Store's catalog and command-view
presentation. Selected command choices use a neutral filled `circle-check` with
a contrasting check, without keyboard-shortcut borders. Agent/model,
session-filter and capture-version command pickers share this treatment. Choices
and the selected trigger show weight estimates and advisory memory fit; curated
recommendations use 70% of observed host RAM, capped by the unsaved memory
limit, and the source's 60%/90%/110% thresholds. Estimates are not measured GPU
capacity, free memory or inference benchmarks. Missing hardware and unknown
custom/imported sizes remain unknown, without invented recommendations or
installed badges. An adjacent Custom model field preserves exact GGUF
references. Picking or typing only edits the draft. Serving, pending and busy
states lock both controls; no selection downloads, saves or starts a model.
Device memory facts are cached native read-only status, queried off the UI
thread without starting compute or changing configuration.

The verified bundled helper owns inference. Its working directory, HOME, native
runtime and model caches stay in device-owned managed storage outside the vault.
The persistent machine identity uses Keychain; loopback bearer tokens stay
native and process-local. A locked/unavailable identity store cannot silently
replace an existing identity. Memory allocation is optional and bounded to
1–1024 GB. Sharing defaults off. Peers require explicit mutual admission, and
inference access never grants application tools. Local versus paired selection
is explicit.

Model/configuration commands retain conditional revisions and exact durable
request receipts. Stop is idempotent cleanup with observed process retirement.
Repeated requests observe their original result, including while pending; they
never repeat a download/import/start implicitly. Restart marks an interrupted
request unknown. Stop remains available after trust revocation and drains the
owned process before reporting off. Successful process cleanup does not complete
an interrupted model operation. Native work runs off the UI thread and owned
commands use the App status API; Settings show representative skeletons and
bounded download progress.

## Remaining qualification and secondary work

| Surface                                   | Implementation                                              | Qualification remaining                      |
| ----------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Local ACP chat, context/skills and drafts | Implemented v0; ordinary sessions retained                  | Mounted real-provider/recovery/trust matrix  |
| Provider/Keychain and application tools   | Implemented v0; native and cold setup tests                 | Real bundled/external-client tool turns      |
| Optional compute                          | Implemented v0; explicit controls and isolated helper tests | Loaded GGUF inference and two-device pairing |

E-AI-097 records actual focused, catalog, native and source results. Scripted
helpers and in-memory Settings do not qualify a real provider or loaded model.
Real external-client/Lapis tool turns, cold mounted restart/trust cleanup,
native inference with prepared weights and two-device mutual pairing retain the
original M10.2–M10.4 acceptance gates. Signing/publication and other platforms
remain M11. Expanded model catalogs, model removal, editable relay settings are
secondary work, separate from v0’s explicit model/resource/peer lifecycle. No
deferred JJ-store chat implementation is resumed by this profile.

E-AI-104 records native Codex, Cursor and OpenCode tool reads, approved edits,
cancellation, normal Quit and unchanged cold history. Real local compute
Prepare/Download/Import/Start is observed; its hidden native API lane also
passes explicit Stop and cold off with unchanged settings and sharing disabled.
Bundled Lapis tool requests fail native compute HTTP502 on both Qwen3-0.6B
and1.7B. Desktop avatar accessibility, mounted trust/isolation and two-device
pairing remain open. Source checks do not replace consumer acceptance;
M10.2–M10.4 retain their original In progress gates.
