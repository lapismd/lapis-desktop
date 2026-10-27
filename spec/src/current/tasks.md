# Native Tasks intake

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-TASK-001 | Explicit native Tasks selection MUST require Core metadata and editing owners, use the existing admitted App client and installation-owned Task storage, and reject invalid, foreign or revoked authority without renderer fallback. Renderer ownership remains the default.                       |
| LD-TASK-002 | Native Task calls MUST retain generated command/value types, conditional writes, ordered lifecycle journal, provider policy and typed uncertain outcomes. Observation detach MUST drain accepted calls without disabling or replaying work; explicit plugin disable remains the shared App policy. |
| LD-TASK-003 | Native Tasks adoption MUST preserve startup declaration reconciliation, existing installed-plugin registration and planner/editor surfaces, including provider, locale, recovery and cold native acceptance. Source/editor qualification alone MUST NOT complete this gate.                        |

## Staged native Tasks intake (M16.9)

`LAPIS_DESKTOP_TASKS_OWNER=core` selects the public native Task port only with
`LAPIS_DESKTOP_METADATA_OWNER=core` and `LAPIS_DESKTOP_EDITING_OWNER=core`.
Invalid or incomplete selection refuses startup before App/plugin construction.
The default remains renderer-owned. This does not add Tasks to the bundled
profile: installed Tasks registration and declaration remain source-owned.

The Tauri adapter supplies only the existing admitted vault session and
generated Task command. Core owns the private profile journal, provider policy,
tracked materialization, guarded transformations and ordered daily/Task
publication. Saved state and observation use that same App client. The App's
public native Task session reconciles absent/failed declarations, drains passive
observation before metadata teardown and distinguishes explicit plugin disable.
Transport loss retains its original uncertain identity and never retries
automatically.

The local main capability registers only `vault_tasks`; startup validates and
manages its declared owner before plugin construction. The quiet default stays
unchanged; the hidden native API script includes the two typed Task cases.

M16.9 depends on M16.7 and remains In progress under
[E-CORE-037](../history/E-CORE-037.md), following immutable staged E-CORE-036.
Immutable Notes `0ff929b1` is the source qualified by aggregate `823317ad`. API
`419b47c5`, History `e714935f` and the 31-archive/116-route cohort pass the four
exact Rust and eleven Node cases. Composed Desktop
installed-plugin/native/catalog and strict host gates remain pending. M16.7's 58
native and 2,068 catalog cases do not qualify this Task selection.

## Installed native acceptance

The native acceptance candidate MUST bundle the verified public Tasks archive,
validate every external module against the Desktop host import map, then use the
existing ephemeral signed-distribution fixture and production installer. Fixture
resource hashes MUST be checked before signing. Acceptance helpers remain
confined to the debug e2e entry; ordinary bundles reject their markers.

Headed acceptance MUST exercise the real planner and source editor, configured
locale and daily provider, stale admission, uncertain replies, read-only journal
inspection and a cold reopen of the same isolated profile. A transport probe may
hold a conditional save or submission before admission and may discard a reply
after native completion; it MUST forward all other commands unchanged and
release held work during cleanup. It cannot add Task state, retries, provider
callbacks or an alternate save path. Provider refusal MUST preserve file bytes
and never execute the unsupported renderer provider callbacks. Recovery
references MUST omit original and replacement document bytes. Prepared cases and
fixture checks alone do not satisfy LD-TASK-003 or finish M16.9.

[E-CORE-039](../history/E-CORE-039.md) records nine passing fixture/transport
checks and four prepared native cases. E-CORE-038 composes their e2e entry,
signed fixture and ordinary-bundle rejection. The public artifact now passes its
complete package fingerprint and all 16 host externals against the same 31
archives. Actual native execution and the original completion gates remain
pending.
