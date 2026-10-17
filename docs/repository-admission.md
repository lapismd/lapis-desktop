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
