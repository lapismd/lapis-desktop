# Explicit shared native AI queue

This is the opt-in Tauri intake of Notes CORE-030–032/036/037. M16.10 follows
completed M16.9; the original AI/provider, native-store, release and default
cutover gates remain separate. Existing Agent screens and public app-profile
composition own presentation; Core owns accepted work and queue advancement.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-AI-005 | Selected native queue commands MUST use the existing admitted Core client for accept, read, Stop, cancel-unstarted and explicit resume. The Tauri adapter MUST preserve native values and refusals without granting executable, credential, physical-root or provider-session authority.                            |
| LD-AI-006 | Shared UI queue capture MUST use complete host-declared recipient and selection metadata, preserving its IDs, token, optional choices and current declared execution mode. Opaque target IDs and labels MUST NOT imply provider or mention identity. Missing declarations MUST leave shared UI capture unavailable. |
| LD-AI-007 | The existing Agent screen MUST observe native queue state and route explicit controls to Core. Passive detach MUST preserve accepted work; uncertain replies and cold recovery MUST NOT replay mutations or introduce an authoritative renderer scheduler.                                                          |

## Trusted declaration and capture

Extract the existing Desktop builtin recipient declaration into one host-owned
configuration catalog. Its IDs, labels and mention tokens remain identical to
the existing public codec and capture callers. Renderer and Rust consumers stay
thin; Rust does not include renderer implementation paths. Prepared native
runner kind selects a declared entry; unknown kinds expose no queue selection.
Neither an opaque execution-target ID nor a display label selects a provider or
token.

Eligible native TurnTarget metadata publishes the same complete queue_selection
that the host queue selection port returns. Core privately freezes and
revalidates that declaration. It is saved attribution and choices, never launch
authority. The shared app-profile constructor freezes the declared default mode
at capture, with no later dispatch lookup or provider inference. Capture,
authored user, acceptance/action and native dispatch IDs remain distinct as
required by the shared protocol.

The first shared UI profile accepts one declared plaintext recipient. Existing
attachment, comment, application-command and rich-participant refusals remain
source-owned; no renderer fallback fabricates a supported queue operation.

## Admitted native transport and lifetime

Use the same local caller/origin check, fixed Core-owner selection, current
physical-vault admission, retained Core client and guarded AI transition as the
existing native turn command. Keep native code grouped under host/ai/turns and
policy; factor common admission instead of copying an authority path. Requests
carry only the existing opaque vault session and generated queue command.

Core owns FIFO advancement, native target snapshots, publication and receipts.
The shell does not schedule jobs, retry uncertain submissions or reconstruct
queue policy. The existing admitted raw queue port retains explicit compatible
captures even without UI discovery metadata; Tauri adds no duplicate guard.
Failed or stale admission stays visible through existing errors. Stop pauses
advancement; cancel addresses an exact unstarted acceptance; resume acknowledges
the current native head. Reload detaches observation. Explicit feature/vault
closure uses the existing native fence/drain ownership.

## Qualification

Start with exact renderer transport/declaration regressions, including opaque
misleading labels, absent metadata, unchanged captures, exact scopes, all five
commands and typed uncertain refusals without retry. Preserve the extracted
catalog's original codec/caller cases. Run source public-archive qualification
before compiling the Tauri consumer against generated CORE-037 DTOs.

Extend production-component native-queue stories with loading/empty, queued,
paused, cancellation, failure/uncertainty and explicit recovery states.
Functional and accessibility acceptance runs in both themes/viewports; visual
review stays pending. Quiet defaults remain unchanged.

Actual native acceptance must cover the real admitted Core queue, exact command
and identity round trips, existing screen controls, stale/foreign scope refusal,
retained work after detach, cold paused observation and explicit recovery
without replay. Native services, normal/e2e strict checks, both app
configurations and packaged assets retain their original gates. No ordinary
default, publication, signing or installed-application replacement is activated
by this intake.

Installed-provider acceptance remains Notes R4.1.6. It retains the real Agent
screen, read-only declaration and provider-default model/effort omission. A
dispatched Stop with an Unknown outcome stays unresumed through cold recovery.
Known-head resume may use a labelled offline retained-state fixture copied from
a real completed queue, preserving its private target guard and original data.
Write that fixture only after the native process stops; prove no cold dispatch
before the existing UI Resume, then exactly one provider completion. Fixture
creation is not live admission, and no pause-only API is introduced.

## Current-cohort intake

Provider source `85d9b5e1` and immutable E-CORE-045 retain their qualified
`b2034168` Core context. The cutover candidate now selects landed Notes
`cd997c2c` with freshly packed API/AppProfile archives; its participant/protocol
and saved-chat changes retain the original current-cohort host gates.
Applications, profiles and feature defaults remain unchanged.
[E-CORE-046](../history/E-CORE-046.md) records the pending coherent intake.
