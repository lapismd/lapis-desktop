# AI application code attribution

Restored app-owned contracts and conversation hashing from the Apache-2.0 Lapis
first-party AI plugin in lapismd/lapis-plugins. The pre-controller runtime seam
is pinned at 27c1427a3aa35e5e41d11e58be56c38821888364; memory extraction is
pinned at ea4fc89b31d74b0ff9946b6d7a395c0b4fb3307f. Current plugin data fields,
source at 56b5d6c1, and the published Apache-2.0 ai-controller 0.1.0
compatibility declarations were compared to retain newer optional fields. No
controller client, runtime or memory implementation is imported into the desktop
dependency graph. The desktop owns these contracts.

Context projection is adapted for separate native text/context fields.

Conversation storage, validation, durable redaction and tool identity helpers
retain the current plugin at 56b5d6c1. Validation is split by record family.

Handoff projection is restored from 27c1427a3aa3 with desktop-owned bounds and
summary admission; no controller implementation is imported.

The ACP runtime/session/event seam adapts the pre-controller design to the
public lapis-ai client and raw control-v3 observations. Legacy semantic-option
fallbacks and JavaScript host execution are not restored.

Skill discovery, parsing, snapshots, manifest generation and bundled seeding,
with their applicable original policy regression suites, retain 56b5d6c1.
