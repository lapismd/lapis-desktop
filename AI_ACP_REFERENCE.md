# Pre-controller ACP reference for the desktop AI migration

Read this with
[Stage 5 of the plugin migration](PLUGIN_MIGRATION.md#stage-5--ai-through-direct-acp-with-migrated-stories).
This guides the M10 work authorized on 2026-10-17. The task ledger owns status;
its adapter and native acceptance gates still require implementation evidence.

## Decision and alternatives

Use the earlier Lapis AI plugin's direct ACP runtime as the starting point for
the desktop-owned plugin. Keep the current UI, conversations and applicable
fixes, and replace its host transport with the Rust `lapis-ai` service. Do not
restore the old plugin or host wholesale.

| Approach                                                                             | Disposition                                                                                                                   |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Adapt the earlier ACP runtime/backend seam and tests, retaining current app features | Selected starting point; audit and adapt the retained code before reuse.                                                      |
| Write a new minimal ACP adapter against the same app-owned interface                 | Use only where the old interface cannot express control-v3 correctly; preserve the historical tests and current app behavior. |
| Roll back the entire plugin and Notes host                                           | Not selected: loses later fixes and restores obsolete hosts and modes.                                                        |
| Keep shared `ai-controller` orchestration                                            | Outside the agreed desktop scope.                                                                                             |

Here, “direct ACP” means no shared AI controller between the app and the ACP
execution service. The WebView still uses an admitted native host; it cannot
spawn agents or write their stdio. The old host protocol and control-v3 are
different contracts even though both execute ACP agents.

The historical npm plugin **`@lapis-notes/ai`** lives in `lapis-plugins`. The
new reusable Rust **`lapis-ai`** repository is a different component. The
desktop owns the migrated plugin's presentation and application policy.

## Revisions to inspect

These revisions and source paths were checked on 2026-10-17. Use immutable
revisions for the historical comparison, and recheck the implementation checkout
before porting code.

| Repository      | Revision                                   | Meaning                                                                              |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `lapis-plugins` | `27c1427a3aa35e5e41d11e58be56c38821888364` | 2026-09-15; plugin version 0.1.3, before memory extraction and controller execution. |
| `lapis-plugins` | `ea4fc89b31d74b0ff9946b6d7a395c0b4fb3307f` | 2026-09-16; extracts memory policy and orchestration behind vault/database ports.    |
| `lapis-plugins` | `e554e92cb6e7a1bbc44dfa5fa2890c95a4b0bab1` | 2026-09-16; switches plugin sessions, tools and context to the shared controller.    |
| `lapis-notes`   | `28bc7ab228bdde6a5556728974d4d29a8e7dbe9b` | 2026-09-15; Notes host baseline before controller cutover.                           |
| `lapis-notes`   | `908961182940b271f3938f834e8254d85a5a91a3` | 2026-09-16; routes desktop, web and Storybook attachment through the controller.     |

The old factory in `packages/ai/src/lib/host/create-host-runtimes.ts` created
both `AcpAgentRuntime(new DesktopAcpRuntimeBackend())` and `CodexNativeRuntime`.
It was a plugin with a **direct ACP path**, not an exclusively ACP plugin. Only
ACP is selected here; Codex Native and OpenCode Native remain deferred.

Read-only commands from the usual sibling `lapis-desktop` checkout:

```sh
jj -R ../lapis-plugins --no-pager file show -r 27c1427a3aa3 root:packages/ai/src/lib/host/create-host-runtimes.ts
jj -R ../lapis-plugins --no-pager diff --from 27c1427a3aa3 --to e554e92cb6e7 -- root:packages/ai/src/lib/host root:packages/ai/src/lib/core root:packages/ai/src/lib/memory
jj -R ../lapis-notes --no-pager file show -r 28bc7ab228bd root:packages/desktop-deno/src-deno/agent-runtime.ts
jj -R ../lapis-plugins --no-pager diff --from 27c1427a3aa3 --to @ --summary -- root:packages/ai/src/lib/runtimes/acp
```

The final comparison had no differences at default `lapis-plugins` snapshot
`9953da14`: the old ACP runtime directory still existed unchanged. Its presence
does not mean the current plugin selects it. The current host factory selects
`ControllerAgentRuntime`; verify the checkout used for implementation again.

## Historical and target boundaries

Historical ACP path:

```text
AI plugin → AgentRuntime → AcpAgentRuntime → AcpRuntimeBackend
  → platform bridge → ai-host/acpx executor → provider ACP agent
```

The application owned transcripts, context preparation, memory and application
tool policy. A host still owned execution and transport. In the historical Deno
desktop, `packages/desktop-deno/src-deno/agent-runtime.ts` used `acpx/runtime`
and `createAgentRuntimeExecutor` / `ToolBridgeBroker` from `@lapismd/ai-host`.
Its tool broker supplied authenticated loopback HTTP; other host paths used a
Node stdio shim. Neither host runtime is carried into the Rust desktop.

Target path:

```text
Desktop-owned AI plugin → app-owned AgentRuntime / adapted ACP runtime
  → desktop Tauri client → reusable lapis-ai Tauri adapter / AcpClient
  → lapis-acp control-v3 → provider ACP agent
```

The `lapis-ai` Tauri adapter remains planned, not a qualified existing service.
Its Rust `crates/lapis-ai-runtime/src/acp.rs` client starts
`serve --control-version 3` and exposes command submission and raw events. The
host adapter must supply correlation, event ordering, ownership and lifecycle.
Read `lapis-ai/spec/src/current/contracts/tauri.md` before implementing it.

## Source map and porting work

Paths in this table are relative to `lapis-plugins/packages/ai/src/lib/`.
Consult both the pinned baseline and the current source; retain later fixes.

| Source                                                            | Reuse or adaptation                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtimes/acp/acp-runtime.ts`                                     | `AcpAgentRuntime`, `AcpAgentSession`, `AcpRuntimeBackend` and `AcpBackendSession` define the useful seam: start/resume, configure, send, cancel, detach and close. Retain neutral event handling; adapt transport and context serialization. |
| `runtimes/acp/desktop-acp-backend.ts`                             | Replace `NativeDesktopBridge` and `desktop_agent_acp_*` calls with the Tauri client. Preserve relevant deferred-start, request-correlation, subscribe-before-start and sequence-deduplication regressions.                                   |
| `runtimes/acp/acp-event-mapper.ts`                                | Reuse event-normalization coverage, but replace permission response mapping. Its unknown-option fallback returns `allow_once` and must not survive the port.                                                                                 |
| The three corresponding `runtimes/acp/*.test.ts` files            | Starting regression suite; update host fixtures and assertions for control-v3. Passing old bridge tests alone does not qualify the new host.                                                                                                 |
| `runtime-adapters.ts`, `host/create-host-runtimes.ts`             | Retain only the chosen ACP path in the shipped desktop; exporting old adapters does not activate them or remove controller dependencies.                                                                                                     |
| `core/types.ts`                                                   | Currently reexports `@lapismd/ai-controller/runtime`. Recover/adapt neutral app-owned contracts from before extraction and audit transitive imports.                                                                                         |
| `memory/*`, `conversations/context-handoff.ts` and related hashes | Recover app-owned policy and handoff from before extraction; retain newer storage/schema, scope, security and correctness fixes. Do not copy controller reexports.                                                                           |
| `chat/chat-controller.svelte.ts`                                  | Reuse the existing branch where `runtime.capabilities().preparesContext !== true`: prepare context locally and pass `contextBlocks` to `session.send`. Preserve current UI and transcript persistence.                                       |
| `tools/app-tool-host.ts`, `tools/desktop-app-tool-bridge.ts`      | Retain the registry, authorization and guarded-edit behavior; replace host IPC and runtime-dependent transport.                                                                                                                              |
| `providers/acp-model-provider.ts`                                 | Bind model discovery/configuration to the native service; never spawn processes from renderer code.                                                                                                                                          |

Do not restore dependencies simply because an old source file imports them. Use
the baseline to recover behavior, then move retained app code, tests and stories
into desktop ownership with attribution and licence notices. Reusable native
defects and extension points remain owned by `lapis-ai`.

## Adaptation checklist

1. Map the old bridge commands/events to control-v3 deliberately. Validate
   readiness/version, session scoping, request correlation and event order. Do
   not assume old run/status or replay capabilities exist in the new host.
2. Preserve **exact provider permission option IDs**, including custom options.
   An unknown or stale choice must reject/cancel, never fall back to approval.
   Keep semantic policy separate from the option ID returned to the provider.
3. Preserve user-authored transcript text separately from injected context. The
   old runtime flattened context/skills into prompt text; the Rust client also
   exposes separate context. Choose and test one serialization path to avoid
   duplicated context, lost skill instructions or transcript pollution.
4. Keep application conversations independent of provider session IDs and old
   controller thread IDs. Resume only when the provider actually supports it;
   otherwise start a fresh binding with explicit context handoff. Record
   interruptions and unknown submissions without automatic replay.
5. Respect one active turn per worker and launch-fixed runner/root/tool
   configuration. Use separately owned workers for concurrent conversations.
   Native code resolves executable/environment/credential policy and admitted
   roots; opaque handles remain scoped to their window/vault.
6. Implement app-tool hosting in Rust with authenticated private IPC and
   existing app-owned tool authorization. Observed provider tool activity must
   not become a second application-tool invocation. Preserve guarded writes,
   cancellation and idempotent or reconcilable effects.
7. Audit shipped dependencies and canonical source mappings. Existing plugin
   contracts such as `LN-AI-006` describe controller ownership; update the
   affected owning contracts during migration rather than treating those
   requirements as a reason to restore the controller. Introduce the desktop
   product contract and verification before implementation.

No legacy web attachment, URL/token settings, Deno compatibility host or acpx
JavaScript runtime is added to the shipped app. Desktop-only bundled ownership,
Safe Mode, disabled preferences and lazy startup remain as specified in the
combined plan. Qualify the bundled Rust agent first; external ACP agents have
explicit prerequisites and may not assume the app supplies Node.

## Acceptance to carry forward

- Streaming text, tool activity, model/configuration events and failures are
  mapped once, in order, to the correct session.
- Deferred start, listener-before-start and prompt correlation retain their
  regressions; old sequence/run-status behavior is adapted only where supported.
- Permission tests include exact custom option IDs, stale/unknown choices and
  explicit cancellation with no implicit approval.
- Local context preparation, skills and handoff preserve transcripts and memory
  scope. Existing conversations survive without fabricated provider resumes.
- Cancel, detach, reconnect and close are distinct; plugin disable, vault close,
  trust revocation and app exit release the appropriate native resources.
- Worker exit or lost replies produce interrupted/unknown outcomes; neither
  prompts nor tool effects replay automatically.
- Migrated fake-client stories cover the current AI UI. Separate cold native
  acceptance proves chat, tools, approvals, isolation and process cleanup
  without `ai-controller` or an app-supplied Node/Deno runtime.

This reference changes no task gate or status and establishes no runtime
qualification. Terminal and the earlier stages still precede AI.
