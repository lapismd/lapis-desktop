# Source provenance and acceptance

Current behavior is specified in the owning feature chapters and verification
rows. [Backlog](../backlog.md) is the sole entry point for remaining work. The
original source inventory is retained byte-for-byte in
[historical provenance](../../evidence/migration-inventory.json); its former
task fields describe the original capture and are not live completion state.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-MIG-001 | Historical source inventory MUST retain source revisions and original legacy desktop requirement, command/event, service, plugin, packaging and acceptance dispositions. Current feature contracts and backlog destinations MUST account for that scope without maintaining the original milestone ledger.                                            |
| LD-MIG-002 | Outstanding implementation and qualification MUST live in canonical backlog topics with their original acceptance boundaries, dependencies and evidence. Deferred capabilities MUST remain visible. Product implementation MUST first introduce its owning contract; bookkeeping or substituted tests MUST NOT complete an unproved product boundary. |
| LD-MIG-003 | The Deno desktop MUST remain superseded and frozen. Further desktop features, fixes and host qualification MUST target Tauri. Shared changes MUST remain in their owning packages. The frozen host MAY remain a reference until its backlog retirement is completed; Deno services used by other hosts are outside this freeze.                       |

## Supported boundaries

Tauri owns windows, OS policy, admission, routing and native adapters. Shared
public Notes/Design Core/Agent/Repository surfaces retain presentation
ownership; lapis-server owns the shared native core/protocol. Generic engines
and plugin algorithms remain in their owning repositories. Existing windows
observe native services rather than running a second durable scheduler.

The shared vault-local application state default is .lapis across hosts. OS
profiles/databases retain their application-data locations. Pre-release settings
and generated state may be reset; this does not waive normal note integrity,
dirty-buffer, conditional-write or database transaction requirements. Legacy
.obsidian discovery/import/merge is not a general release gate.

[Writer audit](writer-audit.md), [files](files.md), [navigation](navigation.md),
[integration](integration.md) and [windows](windows.md) retain the actual native
acceptance contracts. Quiet or mocked checks cannot qualify native windows,
Finder/default-open/trash dispatch, real provider behavior or distribution.
Existing completed receipts retain their revisions and failed attempts.

Published package fixes belong upstream. Verified temporary public archives may
support private development acceptance under
[dependency intake](local-dependencies.md); tracked manifests and registry
lockfiles remain portable. Source qualification, consumer adoption, public
release and installed-app replacement are independent. The
[distribution backlog](../backlog/distribution.md) retains the original
clean-machine, upgrade/rollback and frozen-host retirement acceptance.

Parallel-branch CI receipts retain their original bytes and legacy review
metadata. Their original revisions and hashes are pinned in historical evidence
provenance; this grants no current completion authority or new schema exception.
