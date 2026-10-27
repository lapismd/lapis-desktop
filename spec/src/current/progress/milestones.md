# Milestones and gates

Last updated **2026-10-27 05:11:24 UTC**.

<!-- migration-activity:start -->

## Completed Desktop shared Core intake

**Master tracker:** `/Users/stevejuma/code/lapismd/lapis-notes/MIGRATION.md` in
Notes `default` owns R0–R7. This file owns Desktop M-series acceptance gates.

M16.8 shared Repository readers and M16.9 native Tasks have completed their
original gates on Core `03b8257d` and API archive `89e81a5f` (source commit
`000aef52`). E-CORE-040/041 retain exact provenance and every failed attempt.

| Qualified surface         | Final result                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Actual native app         | 99/99: API/model 20, Repository 12, navigation 12, writers 51 and installed Tasks 4                                         |
| Complete public catalog   | 2,088/2,088 across four theme/viewports: partitions 636 + 696 + 756                                                         |
| Portable runtime          | Node 537/537, AI 744/744, types 0 errors/0 warnings, renderer/static builds and architecture/App/parity audits              |
| Native Core and packaging | Rust 260, unattended-day/DST 2, strict normal/e2e, both complete-asset app configurations and 31 archives/116 import routes |
| Shared API producer       | Source 13 exact/158 affected/1,716 API, full frontend 2,438, hosted 42, cold catalog 265 and canonical 78                   |

The Notes master tracker schedules subsequent shared application work. Later AI,
terminal, service-host replacement and default cutover keep their own original
gates. M16 completion does not activate a new default. Publication, signing M11,
remote AI M12.4–M12.6, native memory M13, application tools M17.1 and Review
M17.2–M17.5 remain separate or Deferred.

E-CORE-042 records default-workspace adoption of verified `cdf71da6` with
identical runtime, dependency and native inputs. This adoption leaves default
feature selection unchanged.

Immutable E-AI-109 retains its explicit accepted formatting exception; all other
format, progress and specification checks pass. Visual review remains separate;
no baselines were changed. Compiler/cache guards preserve apps, vaults,
profiles, models and receipts.

<!-- migration-activity:end -->

## Earlier desktop checkpoint — 2026-10-20

Done: M0–M9, M7.3/M8.5, M10.1, M13.1/M13.2. M10.2 continues with local ACP and
file-backed transcripts. M13/M13.3 native AgentStore/ThreadStore chat is
**Deferred**, preserved at `codex/desktop-jj-chat-checkpoint-20261020`
(E-AI-092). E-AI-093 records the simplification; original native gates/evidence
remain available and are not marked complete.

[Backup M14](vault-backup.md), E-REPO-054: M14.1–3/M14.6 Done; native
storage/adoption qualified, provider Partial.
[Roadmap](../../../../PLAN.md#current-delivery-checkpoint).

Background: E-AI-031–066, E-REPO-007–025/E-CATALOG-008, E-QUALIFICATION-001/002,
E-PLAN-002, E-POPOUT-004. Native/visual gaps retain E-REPO-012–014; Deno stays
frozen. AI: M10.2 → M10.3 → M10.4. M11 distribution is Deferred until requested;
M12 retains its M11 dependency and cutover gate (E-PLAN-006).

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M0.0 | Done | - | LD-GOV-006,LD-MIG-002 | The saved document contains the complete architecture, delivery sequence, tracking rules, acceptance gates, and deferred work. Include it in the initial repository commit. | Complete | E-PLAN-001 |
| M0.1 | Done | M0.0 | LD-GOV-001,LD-GOV-002,LD-GOV-003,LD-GOV-004,LD-GOV-005,LD-GOV-006,LD-GOV-007,LD-DESK-001,LD-DESK-002,LD-DESK-003,LD-DESK-004,LD-DESK-005,LD-MIG-001,LD-MIG-002 | Cold launch, resize, drag, close, and relaunch work; a local `.app` launches without Deno; governance checks pass. | Complete | E-SHELL-002,E-REVIEW-001,E-REVIEW-002,E-STARTUP-002,E-SHELL-003 |
| M1 | Done | M0.1 | LD-MIG-002,LD-GOV-006,LD-HOST-001 | Upstream regressions prove the shared `.lapis` default across every affected package and host. Build and pack verified shared-package changes locally, then validate their public archives in the Tauri app and affected consumers. | Complete; proceed to M2 native vault access | E-HOST-001,E-ARCHIVES-002 |
| M2 | Done | M1 | LD-MIG-002,LD-VAULT-001,LD-VAULT-002,LD-VAULT-003,LD-VAULT-004,LD-VAULT-005,LD-VAULT-006 | Real temporary-folder tests cover cancellation, Unicode paths, binary data, permission failures, traversal/symlink escape, and interrupted writes. | Complete; proceed to the M3 native database gate | E-VAULT-001,E-ONBOARD-001 |
| M3 | Done | M2 | LD-MIG-002,LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-SESSION-002 | In the actual WebView, open a seeded vault, edit a note, verify disk content, display a local attachment, close the database, and reopen successfully. Database rollback and restart tests pass. | Complete; proceed to M4 safe everyday-use qualification | E-DB-001,E-SESSION-001,E-SESSION-002 |
| M4 | Done | M3 | LD-MIG-002,LD-GOV-008,LD-LIFE-001,LD-LIFE-002,LD-LIFE-003,LD-LIFE-004,LD-LIFE-005,LD-LIFE-006,LD-LIFE-007,LD-SESSION-003,LD-VAULT-007,LD-SESSION-004,LD-REC-001,LD-REC-002 | Cold edit → save → quit → relaunch restores content and session. Failed saves prevent silent close; external edits never silently overwrite dirty buffers; repeated switching leaves no stale sessions or subscriptions. | Complete | E-LIFE-001,E-WRITE-001,E-CONFLICT-001,E-ARCHIVES-001,E-PREVIEW-001,E-CHROME-001,E-STARTUP-001,E-ONBOARD-001,E-REVIEW-001,E-REVIEW-002,E-MUTATION-001,E-STATE-001,E-STRUCTURE-001,E-WRITERS-001,E-RECOVERY-001,E-QUALIFICATION-001,E-QUALIFICATION-002,E-STARTUP-002 |
| M5 | Done | M4 | LD-MIG-002,LD-FILE-001,LD-FILE-002,LD-FILE-003,LD-FILE-004,LD-FILE-005,LD-FILE-006,LD-FILE-007 | UI and disk stay consistent after internal and external changes. Dirty-note rename/delete, collisions, watcher overflow/reconciliation, and teardown are covered. | Complete | E-FILES-001,E-WATCH-001,E-TRASH-001,E-CREATE-001,E-INGESTION-001,E-ACTIONS-001,E-MOVE-001,E-IMPORT-001,E-HTTP-001,E-QUALIFICATION-001,E-QUALIFICATION-002,E-AI-055 |
| M6 | Done | M5 | LD-MIG-002,LD-NAV-001,LD-NAV-002,LD-NAV-003,LD-NAV-004,LD-NAV-005,LD-NAV-006,LD-NAV-007,LD-NAV-008 | Searches and metadata reflect edits, renames, deletions, and restart; navigation opens the intended note and preserves layout. | Complete | E-SEARCH-001,E-SEARCH-002,E-NAV-001,E-GRAPH-001,E-GRAPH-002,E-QUALIFICATION-001,E-QUALIFICATION-002 |
| M7 | Done | M6 | LD-MIG-002,LD-INT-001,LD-INT-002,LD-INT-003,LD-INT-004,LD-INT-005,LD-INT-006,LD-INT-007,LD-INT-008,LD-INT-009 | Cold launch and already-running delivery pass; external links open safely; menu actions use the same application commands as the UI. | Complete | E-INTEGRATION-001,E-QUALIFICATION-001,E-QUALIFICATION-002 |
| M7.1 | Done | M7 | LD-MIG-002,LD-POP-001 | An isolated actual native WebView opens a related window with an accessible Window and Document, mounts an existing shared surface, and proves focus, resize, close and cleanup. Ordinary bundles retain denied popup creation and contain no proof instrumentation. | Complete; proof retained | E-POPOUT-001 |
| M7.2 | Done | M7.1 | LD-MIG-002,LD-POP-002,LD-POP-003,LD-POP-004,LD-POP-006 | Browser acceptance moves a real note into a popup and back while preserving its draft and editor history. Multiple popups remain independent, overlays stay in their own document, and failed opening or closing leaves source content reachable. Top and stacked popup headers reserve native-control clearance after resize. | Complete; native ordinary integration remains M7.3 | E-POPOUT-002 |
| M7.3 | Done | M7.2 | LD-MIG-002,LD-POP-001,LD-POP-002,LD-POP-003,LD-POP-004,LD-POP-005,LD-POP-006 | The ordinary packaged app opens, edits, saves, redocks and safely closes multiple native windows with no duplicate sessions or stale resources. | Complete; continue AI and backup | E-POPOUT-003,E-POPOUT-004,E-REPO-050,E-SHELL-003 |
| M8 | Done | M7 | LD-MIG-002 | Storybook build, interaction and accessibility checks pass; native Terminal lifecycle and portable-plugin persistence are qualified; web has no AI/Terminal activation or connection paths. | Complete; continue to M9.1 | E-PLUGINS-001,E-PLUGINS-003,E-CATALOG-001,E-CATALOG-008,E-TERMINAL-001,E-WEB-001,E-PORTABLE-001,E-PORTABLE-002,E-VALIDATION-001,E-VALIDATION-003 |
| M9 | Done | M8 | LD-MIG-002 | Signed-package verification, shared API identity, restart, failed-load recovery, capability restrictions and bundled-ID collision checks pass in a packaged app. | Complete; continue to M10.1 native ACP adapter | E-PLUGINS-001,E-PLUGINS-003,E-INSTALL-001 |
| M10 | In progress | M9 | LD-MIG-002 | Native chat, approvals, cancellation, tool edits, recovery, isolation and cleanup pass without ai-controller; compute receives separate model-lifecycle and peer-admission qualification. | Continue native AI and persistence qualification | E-PLUGINS-001,E-PLUGINS-002,E-PLUGINS-003,E-AI-001,E-AI-002,E-AI-003,E-AI-004,E-AI-005,E-AI-006,E-AI-007,E-AI-008,E-AI-009,E-AI-010,E-AI-011,E-AI-026,E-AI-027,E-AI-028,E-AI-029,E-AI-030 |
| M11 | Deferred | M10 | LD-MIG-002 | Install, upgrade, rollback, clean-machine launch, and platform filesystem/WebView tests pass. Local `.app` success alone does not complete distribution. | Await explicit resumption; retain distribution and platform gates | E-PLAN-006 |
| M12 | Planned | M11 | LD-MIG-002,LD-MIG-003 | Every currently supported desktop capability is migrated or explicitly retired, and the replacement has no Deno runtime dependency. | Qualify Tauri coverage and remove frozen Deno desktop | E-PLAN-002,E-REVIEW-001 |

## Repository history milestones

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M13 | Deferred | M3 | LD-REPO-001,LD-REPO-002,LD-REPO-003 | Cold Notes history/diffs and one recoverable AgentStore/ThreadStore AI conversation in an existing Git-backed JJ vault. | Preserved experiment: codex/desktop-jj-chat-checkpoint-20261020 (E-AI-092); no active implementation |E-REPO-001,E-REPO-002,E-REPO-003,E-REPO-004,E-REPO-005,E-REPO-006,E-REPO-007,E-REPO-008,E-REPO-009,E-REPO-010,E-REPO-011,E-REPO-012,E-REPO-013,E-REPO-014,E-REPO-015,E-AI-028,E-AI-029,E-AI-030,E-AI-031,E-AI-032,E-AI-033,E-AI-034,E-AI-035,E-AI-036,E-AI-037,E-AI-038,E-AI-039,E-AI-040,E-AI-041,E-REPO-042,E-AI-042,E-AI-043,E-AI-044,E-AI-045,E-AI-046,E-AI-047,E-AI-048,E-AI-049,E-AI-050,E-AI-051,E-AI-052,E-AI-053,E-AI-054,E-AI-055,E-AI-056,E-AI-057,E-AI-058,E-AI-093 |
| M13.1 | Done | M3 | LD-REPO-001 | Real JJ physical-source admission, native caller frames and independent AI/history authority. | Complete; continue visible history and durable chat | E-REPO-001,E-REPO-002 |
| M13.2 | Done | M13.1 | LD-REPO-002,LD-REPO-004 | Cold native and visible Notes pinned history/diffs, exact integer frames and drained vault closure. | Complete; continue durable conversations in M13.3 | E-REPO-002,E-REPO-003,E-REPO-004,E-REPO-005,E-REPO-006,E-REPO-007,E-REPO-008,E-REPO-009,E-REPO-010,E-REPO-011,E-REPO-012,E-REPO-013,E-REPO-014,E-REPO-015,E-REPO-016,E-REPO-017,E-REPO-018,E-REPO-019,E-REPO-020,E-REPO-021,E-REPO-022,E-REPO-023,E-REPO-024,E-REPO-025,E-REPO-044,E-REPO-055,E-AI-096,E-AI-111,E-REPO-056 |
| M13.3 | Deferred | M13.2,M10.2 | LD-REPO-003 | One raw event owner sanitizes before durable AgentStore/ThreadStore capture and restart recovery. | Preserved experiment: codex/desktop-jj-chat-checkpoint-20261020 (E-AI-092); no active implementation | E-AI-028,E-AI-029,E-AI-030,E-AI-031,E-AI-032,E-AI-033,E-AI-034,E-AI-035,E-AI-036,E-AI-037,E-AI-038,E-REPO-042,E-AI-067,E-AI-068,E-AI-069,E-AI-070,E-AI-071,E-AI-073,E-AI-074,E-AI-075,E-AI-076,E-AI-077,E-AI-078,E-AI-079,E-AI-080,E-AI-081,E-AI-082,E-AI-083,E-AI-084,E-AI-085,E-AI-086,E-AI-088,E-AI-089,E-AI-090,E-AI-091,E-AI-092,E-AI-093 |

## Plugin delivery slices

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M8.0 | Done | M7.2 | LD-MIG-002,LD-CAT-001,LD-CAT-002 | Desktop catalog renders real production composition, builds statically and passes both-theme interaction/accessibility cases without native services. | Complete; continue to M8.1 Terminal | E-PLUGINS-003,E-CATALOG-001,E-CATALOG-008,E-ICONS-001,E-ICONS-002 |
| M8.1 | Done | M8.0 | LD-MIG-002,LD-PLUG-001,LD-TERM-001,LD-TERM-002,LD-TERM-003 | Bundled Terminal stories and cold native input, retention, reload, close, disable, vault isolation and restart-Start acceptance pass. | Complete; continue to M8.2 Web retirement | E-PLUGINS-003,E-TERMINAL-001 |
| M8.2 | Done | M8.1 | LD-MIG-002,LD-PLUG-002 | Web exposes no AI/Terminal connection or activation paths, skips existing installations and preserves saved data and unrelated behavior. | Complete; continue to M8.3 portable plugins | E-PLUGINS-003,E-WEB-001 |
| M8.3 | Done | M8.2 | LD-MIG-002,LD-PLUG-003,LD-PLUG-004 | Portable plugins preserve native writes, freshness and vault isolation; packaged Markdown Lint and Spellcheck workers/WASM start and terminate correctly. | Complete; continue to M9.1 | E-PLUGINS-003,E-PORTABLE-001,E-PORTABLE-002,E-DEPENDENCY-003 |
| M9.1 | Done | M8 | LD-MIG-002,LD-PLUG-001,LD-INSTALL-001,LD-INSTALL-002 | Signed compatible plugins install, enable, disable, update and uninstall with shared API identity, restart recovery, capability rejection and bundled-ID protection in the packaged app. | Complete; continue to M10.1 native ACP adapter | E-PLUGINS-003,E-INSTALL-001 |

## AI delivery slices

Deferred backlog: [AI tool expansion](../../backlog/ai-tool-expansion.md), saved
in E-PLAN-004. All six stages await implementation; M10.2/M10.3 statuses and
original gates are unchanged. Plan approval is not product acceptance.

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M10.1 | Done | M9 | LD-MIG-002,LD-AI-001 | Reusable native ACP adapter preserves ordered correlated events, exact permission choices, cancellation, worker isolation and teardown with no automatic uncertain replay. | Complete; continue to M10.2 desktop-owned AI | E-PLUGINS-003,E-AI-001,E-AI-002,E-AI-026,E-AI-027,E-AI-028,E-AI-029,E-AI-030 |
| M10.2 | In progress | M10.1 | LD-MIG-002,LD-PLUG-001,LD-AI-002,LD-AI-004 | Desktop AI retains conversations, context, memory and current UI with complete migrated story coverage through direct ACP and no controller. | Qualify staged Core chat/history/trust; finish Lapis, avatar accessibility and provider recovery |E-PLUGINS-003,E-AI-003,E-AI-004,E-AI-005,E-AI-006,E-AI-007,E-AI-008,E-AI-009,E-AI-010,E-AI-011,E-AI-012,E-STRUCTURE-002,E-AI-013,E-AI-014,E-AI-015,E-AI-016,E-AI-017,E-AI-018,E-AI-019,E-AI-020,E-AI-021,E-STRUCTURE-003,E-AI-022,E-AI-023,E-AI-024,E-AI-025,E-AI-029,E-AI-030,E-REPO-016,E-AI-039,E-AI-040,E-AI-041,E-REPO-042,E-AI-042,E-AI-043,E-AI-044,E-AI-045,E-AI-046,E-AI-047,E-AI-048,E-AI-049,E-AI-050,E-AI-051,E-AI-052,E-AI-053,E-AI-054,E-AI-055,E-AI-056,E-AI-057,E-AI-058,E-AI-059,E-AI-060,E-AI-061,E-AI-062,E-AI-063,E-CATALOG-011,E-CATALOG-012,E-CATALOG-013,E-AI-064,E-CATALOG-014,E-AI-065,E-AI-066,E-AI-067,E-AI-069,E-AI-070,E-AI-071,E-AI-072,E-AI-073,E-AI-074,E-AI-075,E-AI-076,E-AI-077,E-AI-078,E-AI-079,E-AI-080,E-AI-081,E-AI-082,E-AI-083,E-AI-084,E-AI-085,E-AI-086,E-AI-088,E-AI-089,E-AI-090,E-AI-091,E-AI-092,E-AI-093,E-AI-094,E-AI-095,E-AI-096,E-AI-097,E-AI-098,E-AI-100,E-AI-101,E-AI-102,E-AI-103,E-AI-104,E-AI-105,E-AI-106,E-AI-107,E-AI-108,E-AI-109,E-AI-111,E-AI-112,E-AI-113,E-AI-115,E-AI-118,E-AI-119,E-AI-120,E-AI-121,E-AI-122,E-PLAN-004,E-CORE-020,E-CORE-021,E-CORE-022,E-CORE-024,E-CORE-025,E-CORE-026,E-CORE-027,E-CATALOG-017 |
| M10.3 | In progress | M10.2 | LD-MIG-002,LD-AI-001,LD-AI-003,LD-AI-004 | Packaged lapis-agent performs native chat, exact approvals, guarded tool reads/edits, cancellation, recovery and isolated cleanup over authenticated Rust app-tool IPC. | External native tools verified; bundled Lapis local app-tool turns fail the native grammar sampler | E-PLUGINS-003,E-AI-097,E-AI-098,E-AI-103,E-AI-104,E-AI-107,E-AI-108,E-PLAN-004,E-AI-123 |
| M10.4 | In progress | M10.3 | LD-MIG-002,LD-COMP-001 | Optional compute downloads/imports, starts and stops explicitly; disabled startup, admitted pairing, failures and shutdown pass independently of ACP. | Downloaded library, progress and recovery added; qualify real local tool inference and two-device pairing | E-PLUGINS-003,E-AI-097,E-AI-098,E-AI-099,E-AI-104,E-AI-108,E-AI-109,E-AI-110,E-AI-111,E-AI-123,E-AI-124,E-AI-125 |

## Quiet testing and desktop review

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M0.2 | Done | M0.1 | LD-GOV-002,LD-GOV-003,LD-GOV-009 | Default and explicit headless runs execute renderer/catalog and native-service checks without native UI or session clipboard changes; explicit headed mode retains the complete native suite, with clear separate qualification. | Complete; native qualification remains explicit | E-TEST-001,E-PROGRESS-001,E-PROGRESS-002,E-PROGRESS-003 |
| M8.4 | Done | M8.0 | LD-GOV-002,LD-GOV-003,LD-CAT-003 | Every implemented desktop-specific UI state and desktop-only plugin maps to a discoverable production-component scenario in a minimal real shell, with both-theme and both-viewport interaction/accessibility checks. | Complete; extend inventory with new desktop UI | E-CATALOG-002 |
| M8.5 | Done | M8.4 | LD-CAT-001,LD-CAT-002,LD-CAT-003,LD-FILE-008 | Latest local Design Core, themed editor/recovery presentation, Problems-based conflict decisions and product-only Terminal previews pass their affected source/catalog and native acceptance lanes. | Complete; continue AI and backup | E-CATALOG-003,E-CATALOG-004,E-CATALOG-005,E-CATALOG-006,E-CATALOG-007,E-REPO-024,E-REPO-025,E-CATALOG-009,E-CATALOG-010,E-CATALOG-011,E-CATALOG-012,E-CATALOG-013,E-CATALOG-014,E-CATALOG-015,E-CATALOG-016 |

E-CATALOG-010/016: footer/native qualified.

## Shared-screen adoption

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M15.1 | In progress | M8.5 | LD-CAT-001,LD-AI-002,LD-REPO-002 | Existing Desktop chat, history, catalog, imports, recorded and repository views mount shared public complete screens; exact and affected interaction checks pass in an isolated workspace, with comparable before/after stories and cold native acceptance. | Integrated into default workspaces; finish remaining consumer qualification here | E-SHARED-001,E-SHARED-002,E-SHARED-003,E-SHARED-004,E-SHARED-005,E-SHARED-006,E-SHARED-007,E-CATALOG-017 |

## Shared Rust application services

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M16.1 | Done | M2 | LD-GOV-006,LD-VAULT-001,LD-VAULT-002,LD-VAULT-003,LD-VAULT-004,LD-VAULT-005,LD-VAULT-006 | Desktop directly consumes the extracted Notes-owned vault engine; original native file/admission/watch/resource regressions and normal/e2e native configurations pass, with no duplicate engine or old-path exports. | Core R1.2 source qualified; Desktop/HTTP service intake remains R1.3 | E-CORE-001,E-CORE-002 |
| M16.2 | Done | M16.1 | LD-VAULT-002,LD-VAULT-003,LD-FILE-001,LD-FILE-003 | Existing native file IPC delegates portable actions to the shared owner; admission, close, file errors and real native read/edit/mutation acceptance pass with original renderer frames. | Desktop intake qualified; HTTP shell and backup lifetime remain R1.3 | E-CORE-003,E-CORE-004,E-CORE-005,E-CORE-006,E-CORE-007,E-CORE-008,E-CORE-009,E-CORE-010,E-CORE-011,E-CORE-012,E-CORE-013,E-CORE-014,E-CORE-015 |
| M16.3 | Done | M16.2 | LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004 | R1.3.8 Tauri intake uses the shared high-level database owner through the existing packed provider. Native admission, commit observation, rollback, view/vault closure, cold persistence and existing Notes/Search UI acceptance pass without a renderer SQL engine. | Qualified with explicitly accepted pre-existing Markdown exception; continue R2 | E-CORE-016,E-CORE-018,E-CORE-019 |
| M16.4 | Done | M16.3 | LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-NAV-004,LD-NAV-006,LD-CAT-003 | Explicit Core metadata selection shares the existing native database admission and observer; default/admission/lifetime regressions, full affected catalog and cold native Metadata/Search/Graph views pass while renderer metadata remains default. | Complete; native Search, Tasks ordered writes/recovery and metadata default cutover retain separate gates | E-CORE-029 |
| M16.5 | Done | M16.4 | LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-NAV-001,LD-NAV-002,LD-NAV-003,LD-NAV-005,LD-NAV-007,LD-NAV-008,LD-CAT-003 | Explicit Core Search reuses the shared App observer and database admission; default/admission, lexical/semantic/provider, detached owner/disable/re-enable, cold Metadata/Search/Graph and recovery regressions plus all affected catalog cases pass without client writers or a new scheduler. | Complete; native Tasks adoption, full R3 and default cutover retain separate gates | E-CORE-030,E-CORE-031 |
| M16.6 | Done | M16.5 | LD-REPO-001,LD-REPO-002,LD-REPO-005,LD-CAT-003 | Desktop consumes the public shared History controls, observer and validators without duplicate policy; original cold native saved-search/context, missing source, paused capture, cache rebuild and storage relocation plus all affected service, renderer and catalog checks pass while native admission and accepted-call drain remain intact. | Complete; native Tasks/shared reader adoption, full R3 and default cutover retain separate gates | E-CORE-032 |
| M16.7 | Done | M16.6 | LD-LIFE-001,LD-LIFE-004,LD-LIFE-007,LD-LIFE-008,LD-LIFE-009,LD-CAT-003 | Explicit Core editing selection binds real API/Markdown writers to admitted native intents; original conditional-save, conflict, leave/refused-leave and cold-recovery acceptance plus all affected catalog and portable/native checks pass without another save or recovery engine. | Complete; native Tasks/shared reader adoption, broader R3 and default cutover retain separate gates | E-CORE-033,E-CORE-034 |

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M16.8 | Done | M16.7 | LD-REPO-001,LD-REPO-002,LD-REPO-004,LD-REPO-005,LD-CAT-003 | Desktop Repository discovery and both immutable source readers delegate to the shared Core Client on one existing worker/preparation queue; foreign/stale scopes, source replacement, retirement, blocked-close preservation and cold retained UI pass without duplicate read admission or new mutation authority. | None; later shared application work follows the Notes master tracker | E-CORE-035,E-CORE-038,E-CORE-040,E-CORE-041,E-CORE-042 |
| M16.9 | Done | M16.7 | LD-TASK-001,LD-TASK-002,LD-TASK-003,LD-CAT-003 | Explicit native Tasks selection uses the existing admitted App client, shared Task storage/journal and retained installed-plugin surfaces; full source/public archive, provider/locale, passive lifecycle, recovery and cold native/catalog acceptance pass without renderer fallback. | None; default cutover remains a separate gate | E-CORE-036,E-CORE-037,E-CORE-038,E-CORE-039,E-CORE-040,E-CORE-041,E-CORE-042 |

## Markdown document review

[Saved plan](../../backlog/markdown-review-mode.md) and
[planned contract](../markdown-review.md). All slices are Deferred until
implementation is requested. E-PLAN-005 verifies documentation only; no product
gate is completed and existing milestones retain their status and gates.

<!-- prettier-ignore -->
| ID | Status | Depends | Requirements | Gate | Next | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M17.1 | Deferred | M8.5 | LD-REVIEW-001,LD-REVIEW-002,LD-REVIEW-003,LD-REVIEW-005 | A shared public Markdown review reader supports cursor/selection comments without source edits; keyboard, IME, accessibility and affected chat regressions pass in production-component stories. | Await implementation request; qualify the shared reader in its owning packages | E-PLAN-005 |
| M17.2 | Deferred | M17.1,M13.1,M14.2 | LD-REVIEW-004,LD-REVIEW-006,LD-REVIEW-007,LD-REVIEW-009,LD-REVIEW-010 | An admitted saved Markdown document publishes, restores after cold native restart, replies, edits and resolves JJ-backed comments with unchanged document bytes and exact failed/unknown-request recovery. | Qualify the selected local JJ profile and App/native service, then integrate Review | E-PLAN-005 |
| M17.3 | Deferred | M17.2 | LD-REVIEW-004,LD-REVIEW-005,LD-REVIEW-008 | Edits, repeated text, renames, copies, deletions and concurrent source changes retain original anchors and expose unproved placements without silent retargeting, including after restart. | Add source-change and placement qualification after native persistence | E-PLAN-005 |
| M17.4 | Deferred | M17.3 | LD-REVIEW-001,LD-REVIEW-002,LD-REVIEW-003,LD-REVIEW-005,LD-REVIEW-009,LD-REVIEW-010 | The supported Markdown matrix, multiple windows, draft/leave recovery and affected chat/Preview/Edit consumers pass functional, accessibility and cold native acceptance through verified public packages. | Complete Markdown compatibility and host lifecycle acceptance; visual baselines stay excluded | E-PLAN-005 |
| M17.5 | Deferred | M17.4,M10.2 | LD-REVIEW-011 | Explicit agent handoff delivers exact authorized review-comment revisions and links proven answers without duplicate sends after uncertain outcomes; ordinary review remains independent of AI. | Qualify handoff separately against the supported conversation backend | E-PLAN-005 |
