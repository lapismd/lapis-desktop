# Shared UI migration review

The migration lives in the `shared-ui` Jujutsu workspace at
`../lapis-desktop-shared-ui`. The default checkout stays the before reference.
The source packages use `../agent-ui-desktop-integration`,
`../lapis-notes-shared-ui`, `../lapis-plugins-shared-ui` and
`../design-core-desktop-integration`.

The baseline source is `52516ae9`; dependency receipts and a fresh static
catalog are retained under `.local/migration` in the migration workspace.
Neither `node_modules` root nor native test profiles are shared between
workspaces.

| Surface            | Before                                                                                      | After                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Repository History | <http://localhost:7480/?path=/story/desktop-repository-history--pinned-history-and-diff>    | <http://localhost:7481/?path=/story/desktop-repository-history--pinned-history-and-diff>    |
| Op Log             | <http://localhost:7480/?path=/story/desktop-repository-op-log--operation-graph-and-changes> | <http://localhost:7481/?path=/story/desktop-repository-op-log--operation-graph-and-changes> |
| Chat layout        | <http://localhost:7480/?path=/story/desktop-ai-chat-layout-review--conversation>            | <http://localhost:7481/?path=/story/desktop-ai-chat-layout-review--conversation>            |

The catalogs retain original story names and isolated fixtures, allowing
matching light/dark, viewport and selection comparisons. Shared packages own
complete screen layout; Desktop owns native admission, routing, storage,
preferences, notifications and controller lifetime. No private dependency
imports or consumer CSS conceal package defects.

The before source remains `52516ae9`. Its ignored review setup now uses the same
verified package cohort for its 17 declared packages, including the source-owned
MemoryVault conditional-write correction. Temporary compatible package ranges
are restored after installation; tracked baseline code and dependency files stay
unchanged. The before implementation does not import the two new shared UI
packages. This compares the original and migrated Desktop layouts against the
same corrected foundation, with receipts under the checkout's `.local/`.

For development refresh, select the exact isolated source inputs:

```sh
export LAPIS_DESKTOP_SOURCE_WORKSPACES='{"design-core":"/Users/stevejuma/code/lapismd/design-core-desktop-integration","agent-ui":"/Users/stevejuma/code/lapismd/agent-ui-desktop-integration","lapis-notes":"/Users/stevejuma/code/lapismd/lapis-notes-shared-ui","lapis-plugins":"/Users/stevejuma/code/lapismd/lapis-plugins-shared-ui"}'
pnpm local:refresh
pnpm local:install
pnpm local:status
pnpm storybook:start -- --port 7481
```

The snapshot paths and source selection are temporary local review inputs.
Publication, replacing the installed app and integration into the default
checkout are separate steps. Visual baselines retain their existing approval
state.
