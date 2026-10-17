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
