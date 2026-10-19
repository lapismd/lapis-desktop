# Addressed local messages

AGENT-01 adopts jj-store's participant addressing for LD-AI-002/004 while
retaining local transcript files. Its first delivery slice, AGENT-01A, adds
explicit recipient selection and saved tags. Multiple-recipient execution and
queued delivery remain AGENT-01B/C; a single-recipient implementation cannot
claim those gates.

The application reuses `@lapismd/jj-conversations`' public built agent-token
codec. A saved recipient keeps its exact installation setup ID, canonical token
and captured display label. Display names, public keys, process generations and
native binding IDs are separate identities. Tags confer no executable,
credential, file, tool or resume authority. Native admission still resolves the
separately selected runtime target.

The @ picker distinguishes agent choices from file attachments. Selecting an
agent creates a removable addressed-agent pill without sending, switching a
provider session or rewriting the authored message. Document and Classic retain
the same recipient selection. The first native profile offers its configured
Codex agent; hosts can inject their admitted catalog for other profiles.

Explicit Send snapshots the selected recipients before asynchronous work. The
exact recipient metadata and authored message are saved before dispatch under
the existing local turn intent. Failed or unknown preparation retains the draft,
recipient and attachments and cannot prompt. An unresolvable recipient refuses;
there is no implicit fallback to the selected agent. AGENT-01A refuses multiple
recipients explicitly before message/intent creation or dispatch.

Saved transcript messages may carry optional `recipients`; old files without the
field remain readable and are never rewritten. The bounded field contains
distinct IDs, matching canonical tokens and one-line labels. Unknown saved
recipients remain visible attribution and never create an executable binding.
Cold History restores those tags without dispatch or implicit provider resume.
Message text, comment anchors and hashes retain their original content.

Source-derived recipient pills reuse Design Core Button and Avatar. Operational
selection/send failures use existing App-owned notifications and retain draft
context. Fixture stories prove selection, removal, view switching and saved
projection separately from actual native delivery and cold local persistence.
