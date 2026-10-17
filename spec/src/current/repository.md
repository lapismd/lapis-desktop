# Repository history and conversations

The existing Git-backed JJ vault is the code authority. The desktop consumes
owned JJ interfaces; it does not import upstream `jj-lib`. This work implements
the Notes consumer of jj-store M33 in independently verified slices.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-REPO-001 | Repository reads MUST require current native physical-vault and caller-window admission independent of AI enablement. Roots, metadata/Git witnesses, repository identity, cache location and registration generation MUST remain native-owned. Discovery grants no authority and MUST NOT initialize, snapshot or reconcile a source repository. |
| LD-REPO-002 | History and diff reads MUST retain exact operation pins and full-width identities through bounded versioned text frames. Replacement, revocation or stale generations MUST reject retained reads. Native close MUST fence new work and drain owned reads/preparations before vault release; database blockers MUST preserve authority.           |
| LD-REPO-003 | JJ-backed conversations MUST explicitly select AgentStore and ThreadStore persistence with confirmed receipts and unknown-outcome recovery. One native raw event owner MUST sanitize and durably retain before display or acknowledgement. Legacy file conversations retain their explicit backend; unknown prompts MUST NOT replay.             |

## Native admission

A separate service registry reuses the shared two-phase `VaultAdmissions`
transition. Its pending tickets cannot authorize reads; its grants cannot enable
AI, and AI grants cannot enable history. Native discovery observes the existing
JJ metadata/Git paths. Admission pins the physical vault, JJ directory,
working-copy directory, repository link, metadata/store and Git directory plus
bounded store-type and Git-target file witnesses. Replaced directories, altered
links and changed store bindings invalidate the grant. Ordinary external JJ
operations may advance heads without changing this physical binding.

Native registration identities are installation-owned and do not initialize a
companion identity in the source. A monotonic native registration generation
fences retired grants. A same-root reload can retain its generation only after
revalidating all source witnesses. Failed or stale completion cannot activate a
replacement. Source proof failure and explicit retirement deny existing access.

The native transport, application history UI, raw-event owner and durable JJ
conversation adapters require their own later qualification. A service-only test
or successful compilation cannot complete the first usable milestone.

## Qualification

Real stock-JJ fixtures must cover internal and colocated Git, shared repository
links, source/dirty-file preservation, no companion initialization, physical
replacement, stale tickets, independent AI grants, closure fencing and explicit
reload. Native command integration additionally requires a cold hidden WebView
with actual caller frames and exact permission grants. Presentation uses
released Design Core Chat/Diff exports with production component stories. A
recoverable one-agent conversation completes the first usable milestone only
after actual native persistence and restart acceptance.

## Native history transport

The named main-window admit/release commands accept only a live vault session or
explicit reload mode. Tauri supplies caller window and URL; the host checks the
bundled origin or exact development origin. The history plugin receives only
`jj-store:local-history`; default, wildcard, remote and mutation grants remain
absent. History is available independently of AI admission or targets.

Every retained reader checks its exact native repository grant at entry and
completion. The host supplies bounded defaults and a private profile cache; e2e
acceptance uses its isolated temporary cache. The public versioned JSON text
transport preserves full-width values and strict request frames.

A shared native transition guard serializes replacement, release and vault
closure through actual read/preparation drain. A failed drain leaves admission
unavailable and retryable. Database blockers are checked before any vault-close
fence. Database opening shares this guard, so it cannot invalidate a successful
close preflight during reader drain. A delayed old-vault close skips a newer
admitted generation because the replacement already drained its predecessor.
Destroyed windows invalidate pending tickets immediately; plugin
destruction/exit drains the reader owner. Reload suspends native authority and
drains handles; verified re-admission may retain its registration generation but
must obtain new handles.
