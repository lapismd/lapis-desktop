# Shared UI migration review

The shared-screen migration is integrated into the default `lapis-desktop`
workspace. Follow-up changes belong here and in the owning sibling defaults:
`agent-ui`, `design-core`, `lapis-notes` and `lapis-plugins`. The five temporary
migration workspaces have been retired. Other workspaces remain independent.

The original Desktop source remains available at Jujutsu revision `52516ae9`.
Matching story IDs and the previous comparison evidence are retained; there is
no longer a separate comparison server on port 7481.

| Surface            | Main workspace review                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Chat layout        | <http://localhost:7480/?path=/story/desktop-ai-chat-layout-review--conversation>            |
| Repository History | <http://localhost:7480/?path=/story/desktop-repository-history--pinned-history-and-diff>    |
| Op Log             | <http://localhost:7480/?path=/story/desktop-repository-op-log--operation-graph-and-changes> |

Shared packages own complete screen layout; Desktop owns native admission,
routing, storage, preferences, notifications and controller lifetime. Portable
dependency ranges stay tracked. The ignored `.local/archives/manifest.json` pins
the verified migration cohort, with archives now stored in this workspace.
`pnpm local:install` reinstalls that cohort without changing tracked dependency
files. It deliberately retains the qualified package bytes rather than silently
adopting unrelated newer sibling work during integration.

The migration logs, original receipts and native build output are preserved in
`.local/shared-ui-integration`. Source qualification logs are retained under the
same directory name in Agent UI and Design Core. Historical absolute paths in
those archived logs describe the retired workspaces; active install receipts and
package paths use the main workspace.

For a subsequent source refresh, use the owning default workspaces:

```sh
unset LAPIS_DESKTOP_SOURCE_WORKSPACES
pnpm local:refresh
pnpm local:install
pnpm local:status
pnpm storybook:restart -- --port 7480
```

A refresh builds and adopts current sibling inputs and needs its own consumer
qualification. M15.1 remains In progress: remaining interaction modes, normal
bundle audit and final static catalog qualification continue in the main
workspace. Integration does not mark those gates passed. Publication, installed
app replacement and visual-baseline approval remain separate.
