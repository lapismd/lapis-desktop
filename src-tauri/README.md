# Lapis Notes native host

Rust services and the Tauri adapter for Lapis Notes Preview. The library owns
admitted vault IO, database connections, file watching, service admission and
leave coordination. The binary's `host` modules bind those services to native
windows, menus, permissions and scoped plugin transports.

Native services take explicit vault/session authority. The shared
`vault::admission::VaultAdmissions` registry supplies physical-root checks and
two-phase window transitions; each consuming service owns a separate instance. A
successful discovery or stored identity grants no live service authority.
`repository::RepositoryAdmissions` additionally pins existing JJ/Git source
identity and native generations; hosts drain readers before completing new
admission or vault closure. The binary now connects it to a private history
cache and the read-only JJ Tauri plugin through exact admit/release commands. It
grants no AI execution.

Automatic vault history uses the reusable `jj-vault` coordinator on native
workers. It retains saved internal/external edits with external metadata by
default, while separate commands handle guarded restoration, Git synchronization
and explicit original-history adoption. Immutable readers keep their source and
operation pins; credentials stay in installation-owned native custody. The host
owns watching, vault admission and editor/close barriers. See the
[backup contract](../spec/src/current/vault-backup.md) and
[delivery checklist](../docs/automatic-vault-backup-progress.md) for setup and
qualification boundaries.

`ai::capture::ManagedCapture` adapts an injected
`jj_store_conversations::capture::NativeCapture` to the shared native runtime.
The host supplies admitted privacy and a durable receipt sink. Every safe frame
in a batch is retained for ordered delivery; unknown or mismatched receipts stop
processing without fallback. This adapter alone does not select a Notes backend
or enable execution. The debug acceptance profile uses synthetic policy and
private fixture records, separately from production privacy/JJ adoption.

The device-configured local Codex profile uses the existing vault transcript
files and the shared ACP transport. It does not construct a JJ capture writer.
See [local AI setup](../docs/local-ai.md) for runtime configuration and usage.

`ai::imports` discovers and previews supported local Codex snapshots without
starting an agent or writing JJ state. Its synchronous discovery/read/privacy
functions belong on native workers with a current authority/cancellation check.
The host injects the scoped source port; use **Open Import AI sessions** in the
app to preview and save read-only local history. Its `CaptureQueue` also offers
vault-filtered immutable observations and transient retry-safe confirmation for
an injected opt-in capture coordinator. This source API alone watches/saves
nothing. See the local AI guide above.

Local ACP is the desktop's sole conversation runtime and vault files are its
conversation persistence. The three portable session files join ordinary
Repository History checkpoints by default. Restore/sync uses the App-owned
editing-session barrier to fence sends, drain saves, refuse active/unsettled
turns and reload restored state without dispatching prompts.

The native AgentStore/ThreadStore experiment is Deferred at local bookmark
`codex/desktop-jj-chat-checkpoint-20261020`. See
[checkpoint E-AI-092](../spec/src/history/E-AI-092.md) for dependencies and
reopening instructions. Its existing native objects, journals, receipts and
backend-selection files remain untouched. No ordinary startup opens that state,
exports it or migrates it.

Use the repository's development and acceptance commands from its root. Native
service checks and actual WebView/platform acceptance are separate. Full
contracts and evidence live in
[the specification](../spec/src/current/index.md).
