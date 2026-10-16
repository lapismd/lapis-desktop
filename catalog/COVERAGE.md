# Desktop catalog coverage

The canonical task ledger owns completion status. This maps application surfaces
to their real component stories; migrated plugin stages extend it with source
revision, source story, destination story and retained assertions before
retiring an old registration.

| Source surface                     | Destination                    | Assertions                                                                                        |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Production `VaultLauncher.svelte`  | `plugins/Launcher.stories.ts`  | Open, recoverable failure, return to existing vault, light/dark, narrow/desktop                   |
| Production `NotesWorkspace.svelte` | `plugins/Workspace.stories.ts` | Real App boot, in-memory database/vault, note editing, owned teardown, light/dark, narrow/desktop |

Terminal application stories arrive in M8.1, portable plugin qualification in
M8.3 and retained AI scenarios in M10.2. Library-specific viewport/runtime
catalogs remain with `lapis-terminal` and `lapis-ai`.
