# Installed AI clients and bundled helpers

LD-AI-001 and LD-AI-002 retain execution, admission, privacy and transcript
ownership. Device tooling does not authorize a conversation or send a prompt.

Desktop adapts jj-store's verified helper staging and Installed runtimes
presentation. Development preparation stages all four Lapis helpers with their
manifest; ordinary packages carry that complete bundle in application resources.
The shared native verifier checks inventory, platform, versions and hashes on a
blocking worker before use. Development starts verify staged resources before
opening the app. Installed builds resolve application resources rather than a
source checkout. Explicit legacy device configuration remains supported.

The AI plugin registers its own Agents category in Settings, alongside AI
preferences. Its Your agents gallery copies/adapts jj-store agent cards and
shares the composer editor for name/avatar/runtime defaults. Profiles remain
vault-owned and separate from installed-client authority (E-AI-072, unqualified
while verification is parked). Its Installed clients table adapts Repository
History's forge entries: a tinted header, body-surface rows with separators and
a distinct footer. It lists the bundled helpers, detected Codex adapter/CLI
versions, managed/device origin and Cursor availability with its current
unsupported execution boundary. Skeletons represent loading. Refresh and
installation report through the App status API. Errors identify missing paths,
adapter prerequisites or failed verification and provide a repair action; they
never echo credentials or configuration contents.

Explicit Codex installation and update use jj-store's fixed adapter 1.13.1 and
CLI 0.156.1 catalog. Native code resolves Node.js 22+ and npm on the device,
installs without a shell or lifecycle scripts into a new private request folder,
and confines npm configuration/cache/home/temp files there. Time and size
budgets are 120 seconds and 512 MiB/50,000 entries. Package-version and
executable probes precede durable selection. Failed/interrupted installs retain
the previously selected client; requests have durable IDs and never replay on
restart. No global tooling or credentials are replaced. Cursor links to its
upstream setup guide; no managed Cursor installer is promised.

The native main-window command accepts only a live vault token and fixed status,
install or receipt action. It accepts no executable, package, version, root or
environment authority. Installation is refused while connected AI sessions are
present. Existing sessions retain their launch identity; newly prepared
connections use the selected managed client. Authentication remains device-owned
and separate from installation.

M10.2 remains In progress at its original full native chat/capture/context
gates. Focused tooling and presentation proof does not close managed JJ capture,
release/signing, other-platform or provider acceptance.

## Managed conversation launch admission

LD-AI-001/002 and LD-REPO-003 permit explicit managed capture preparation for
the already admitted Codex client. The main-window frame carries only the live
vault token, current backend handle, original conversation/preparation IDs and
the closed client selector. Native code retains its opaque target and checks the
original conversation, source, window and generation. Repeated preparation
retains the same target; it cannot upgrade a capture-only request or change
clients.

The opaque managed target may claim one launch attempt using the existing
verified helper, native working directory and fixed client environment. Resume,
arbitrary executable/environment fields, substituted owners and consumed launch
targets are refused. Processor construction must use native managed capture and
recheck the original private conversation before starting a provider.
Capture-only preparation keeps its existing inert launch contract. Client
installation, legacy file storage and non-prompting model discovery retain their
own admission; this does not select a persistence backend or migrate existing
conversations.

M10.2/M13.3 retain full renderer/store adoption, context and cold
conversation/restart gates. Native launch qualification is one required
boundary, not completion of those product gates. Packaged agent
credentials/tools and compute retain M10.3/M10.4.

E-AI-078 adds a draft [canonical managed capture](ai-managed-capture.md) path
without an original private creation record. Its explicit one-use grant and
worker-owned membership/privacy/store fence retain the fixed client authority.
The original launch path remains supported. Verification and ordinary native
composer/store adoption remain open.

## Shared discovery lifetime

E-AI-095 makes LD-AI-001/002 model and execution-mode discovery independent of
view/layout lifetime. The native service shares one probe per provider across
concurrent chat, agent-editor and permission callers. Successful validated
metadata stays in that vault service for at most five minutes; the next read
refreshes after expiry. Cache hits and callers joining a probe MUST NOT create
additional status work. One App progress item covers admission, discovery and
probe cleanup, including failures.

Failed, malformed and unavailable results remain retryable. Workspace trust and
Safe Mode are checked before cached reads; revocation clears cached facts.
Completed client installation/update invalidates metadata and native admission;
failed installation retains the existing cache. Invalidated in-flight results
cannot repopulate it or overwrite newer discovery, and remain owned until
cleanup. Closing/reloading the vault clears metadata and drains every pending
generation. The cache is memory-only and stores no prompts, executable grants or
credentials; Send still confirms actual provider configuration through native
admission.

Layout-only changes, including opening/closing the bottom panel, MUST retain the
existing chat controller/draft and MUST NOT launch another model probe. Focused
production-shell stories assert view identity, source calls and native probes;
they are separate from live-provider and distribution qualification.
