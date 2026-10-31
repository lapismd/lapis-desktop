# AI and shared-screen qualification

Outstanding implementation and qualification are recorded here. Existing feature
contracts and requirement verification retain the implemented scope. Legacy task
identities below are provenance, not a separate completion ledger. Preserve each
original acceptance boundary; parent and child entries are not independent jobs.

## Native AI workflow qualification

Former reference: M10. Dependencies: Installed-plugin/native ACP intake is
already qualified.

Disposition at consolidation: **In progress**. Requirements: LD-MIG-002.

Acceptance: Native chat, approvals, cancellation, tool edits, recovery,
isolation and cleanup pass without ai-controller; compute receives separate
model-lifecycle and peer-admission qualification.

Remaining outcome: Continue native AI and persistence qualification.

Evidence: [E-PLUGINS-003](../history/E-PLUGINS-003.md),
[E-AI-104](../history/E-AI-104.md), [E-CORE-047](../history/E-CORE-047.md),
[E-CORE-048](../history/E-CORE-048.md).

## Retained AI presentation and recovery

Former reference: M10.2. Dependencies: Reusable native ACP adapter; complete
retained UI and service integration.

Disposition at consolidation: **In progress**. Requirements:
LD-MIG-002,LD-PLUG-001,LD-AI-002,LD-AI-004.

Acceptance: Desktop AI retains conversations, context, memory and current UI
with complete migrated story coverage through direct ACP and no controller.

Remaining outcome: Qualify staged Core chat/history/trust; finish Lapis, avatar
accessibility and provider recovery.

Evidence: [E-AI-093](../history/E-AI-093.md),
[E-AI-123](../history/E-AI-123.md), [E-AI-125](../history/E-AI-125.md),
[E-CORE-027](../history/E-CORE-027.md),
[E-CATALOG-017](../history/E-CATALOG-017.md).

## Bundled agent application tools

Former reference: M10.3. Dependencies: Retained AI integration and authenticated
native tool IPC.

Disposition at consolidation: **In progress**. Requirements:
LD-MIG-002,LD-AI-001,LD-AI-003,LD-AI-004.

Acceptance: Packaged lapis-agent performs native chat, exact approvals, guarded
tool reads/edits, cancellation, recovery and isolated cleanup over authenticated
Rust app-tool IPC.

Remaining outcome: External native tools verified; bundled Lapis local app-tool
turns fail the native grammar sampler.

Evidence: [E-AI-103](../history/E-AI-103.md),
[E-AI-123](../history/E-AI-123.md).

## Local inference and device pairing

Former reference: M10.4. Dependencies: Bundled native tools and independently
qualified Compute lifecycle.

Disposition at consolidation: **In progress**. Requirements:
LD-MIG-002,LD-COMP-001.

Acceptance: Optional compute downloads/imports, starts and stops explicitly;
disabled startup, admitted pairing, failures and shutdown pass independently of
ACP.

Remaining outcome: Downloaded library, progress and recovery added; qualify real
local tool inference and two-device pairing.

Evidence: [E-AI-123](../history/E-AI-123.md),
[E-AI-124](../history/E-AI-124.md), [E-AI-125](../history/E-AI-125.md).

## Shared-screen consumer qualification

Former reference: M15.1. Dependencies: Qualified shared desktop presentation and
host adapters.

Disposition at consolidation: **In progress**. Requirements:
LD-CAT-001,LD-AI-002,LD-REPO-002.

Acceptance: Existing Desktop chat, history, catalog, imports, recorded and
repository views mount shared public complete screens; exact and affected
interaction checks pass in an isolated workspace, with comparable before/after
stories and cold native acceptance.

Remaining outcome: Integrated into default workspaces; finish remaining consumer
qualification here.

Evidence: [E-SHARED-007](../history/E-SHARED-007.md),
[E-CATALOG-017](../history/E-CATALOG-017.md).

## Coherent native intake

E-CORE-047 qualifies the landed native queue cohort; E-CORE-048 records
integrated-main portable requalification with visible/headed and catalog reruns
still pending. Preserve E-CORE-045/046 as historical receipts. Their success
does not automatically complete broader AI/tools/compute, shared-screen
interaction or provider matrices. Resume exact missing native/provider journeys
with fresh receipts; keep local model inference and two-device pairing distinct.
Native macOS/provider lanes remain explicitly requested opt-ins.

Further application tools stay in [AI tool expansion](ai-tool-expansion.md).
Shared participant, context/handoff, native tools, memory and durable-job work
belongs to the
[Server backlog](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog.md);
Desktop supplies its admitted Tauri integration and current public screens.
