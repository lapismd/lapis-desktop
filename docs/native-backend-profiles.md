# Native backend profiles

`ai::backend::BackendProfiles` is Notes' native persistence-selection service.
Construct it with an installation-owned profile `Dir` and a callback that reads
the current native `VaultLease`. The callback owns window/origin admission; the
service rechecks the captured generation, profile and physical root around IO.
Opaque hashes bind private state to the physical vault without recording paths.

`read()` returns the explicit `vault-files` or `jj` selection and bounded
revision. A fresh vault retains legacy compatibility without writing a marker.
`select(request, expected_revision, backend)` verifies the current selection
before publishing an atomic synced private record. JJ selection checks existing
source witnesses but does not initialize metadata or snapshot working files.
Request IDs bind the original choice and precondition. `status(request)` retains
the original receipt after later selections. Missing status remains unknown.

A synced preparation record precedes selection publication; selection and all
original receipts share one atomic state. Missing, mismatched, malformed,
oversized or substituted state refuses opening another writer. An interrupted
selection cannot be reclaimed or silently retried. Query its original receipt;
do not replace an unknown request identity. Private state uses owner-only modes,
bounded no-follow IO and an exclusive OS lease. Up to 256 original choices are
retained without eviction; exhausting the bound requires explicit maintenance.

`open_scope()` pins the selected backend and JJ source. The owner retains its
exclusive lease. Use `begin()` before admitted work and retain its `BackendCall`
through completion; `check()` reauthorizes before exposing results. The native
metadata path is available only through that admitted call. Changed JJ witnesses
refuse use without switching to another backend. Explicit native disable fences
old generations; fresh admission may reopen the saved choice.

Calling `drain()` immediately fences new calls, including when its returned wait
is never polled or is abandoned. It waits for admitted calls to drop. The owner
and its remaining calls retain the lease, so selection stays blocked until all
owners drop. Closing cannot turn an uncertain mutation into permission to replay
it. Hosts must coordinate this owner with runtime revocation, the private
capture journal and pending native commands; admission callbacks should avoid
ownership cycles with a host that retains the owner.

This service is available to native composition. Ordinary host/IPC and renderer
conversation wiring remain pending; it does not yet expose a selectable JJ
writer in the running app, admit an agent or replace legacy conversations.
Cold-process tests qualify private selection/lease recovery. Actual managed
callbacks, packaged-app chat/restart and additional platform qualification keep
their separate M13.3 gates.
