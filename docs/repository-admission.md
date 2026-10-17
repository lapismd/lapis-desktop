# Native repository admission

`repository::RepositoryAdmissions` is a service independent of Tauri transport
and AI. It builds on the shared native vault registry and jj-store's owned
read-only discovery interfaces. It imports no upstream `jj-lib` types.

The host calls `prepare(vaults, window, session)` after deriving the actual
native caller. Preparation denies existing reads while source discovery and
retirement occur. `Plan::preserves_reads` permits retaining readers only for a
verified same-root reload with identical JJ/Git witnesses. Otherwise, drain old
readers before `complete`. Stale plans and changed sources cannot activate.

A completed `Grant` holds an installation-derived repository ID, monotonic
native generation and pinned metadata path. `check(vaults, grant)` compares the
current vault lease and complete physical source proof. Call it at read entry
and completion. It rejects old sessions, windows and generations. Discovery,
check and completion never write the source or initialize companion identity.

Physical proof retains directory identities for the vault, `.jj`, working copy,
resolved metadata/store and Git directory. The `.jj/repo` entry is pinned as a
directory or bounded file link. Store-type and Git-target files retain exact
bounded contents and identities. Symlinked witnesses, path replacement and
changed links invalidate the grant, even if the original source later returns.
Normal new JJ operations can advance heads under the same physical source.

`leave(window, true)` suspends access for a verified reload. Explicit retirement
removes its grant; a later admission gets a new native generation.
`begin_close_vault` denies new admissions and retains exact retired scopes for
retry; the host must drain readers before `finish_close_vault` and actual vault
release. Check database blockers before beginning that closure transition.

These service methods supply no renderer origin policy, IPC grant, query cache,
reader drain or UI by themselves. Native transport integration must supply and
qualify those boundaries separately. The repository specification and M13 ledger
retain the complete history and recoverable conversation gates.

## Tauri composition

The native binary now installs `tauri-plugin-jj-store` with a policy backed by
its separate `RepositoryAdmissions` instance. The exact main-window capability
adds `jj-store:local-history` plus `desktop_repository_admit` and
`desktop_repository_release`. No default, individual, wildcard or remote plugin
permission is granted.

Admit with `{ request: { sessionId } }` using the live native vault token. The
command derives the current window/origin, prepares source authority, drains old
work if needed and only then completes its ticket. Readers receive no native
roots, cache policy or registration generation as input. The plugin's public
`heads`, `open`, `status`, `read` and `close` carry bounded versioned JSON text.
Every read rechecks its retained grant at entry and completion.

Release with `{ request: { reload } }`. Reload suspends source authority and
retains a verified base generation, but all handles drain and must be reopened.
The transition guard also covers vault closure and database opening. An existing
database blocks closure without changing history/AI authority; an opening that
loses the close race waits, then rejects the closed admission with EACCES.

Native window destruction invalidates pending tickets before plugin cleanup. The
plugin owns final cancellation/drain at window destruction, exit and drop. A
delayed old-vault closure skips a newer active grant because replacement could
only activate after its predecessor drained. Failures retain unavailable scopes
for explicit retry.

The hidden native API lane exercises real stock-JJ history/diffs, source-byte
preservation, external head advancement with retained pins, malformed frames, AI
independence, database/close races, reload, physical replacement and cold
restart. It does not establish a visible history panel or durable AI chat.
