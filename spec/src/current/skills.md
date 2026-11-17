# Plugin-contributed agent skills

Skills are installed explicitly into the active vault's `.agents/skills` root.
Desktop uses the shared native service and public plugin package resources. The
[source evidence](../history/E-SKILL-001.md) and
[verification](../verification/skills.md) retain separate acceptance boundaries.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-SKILL-001 | Desktop MUST expose explicit plugin-skill install and update commands through the owning native service. Main-window admission MUST retain vault identity. Packaged resources MUST come from public plugin exports; local edits, unmanaged directories and interrupted receipts MUST be preserved. |

Released Core intake uses Server v2.4.0 source
`83fca8ddd25b7b7913723e231779862f94f7dbcb`;
[E-SKILL-003](../history/E-SKILL-003.md) records current-main integration and
keeps source, package, native and distribution acceptance separate.
