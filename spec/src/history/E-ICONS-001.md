# Plugin file artwork through public packages

```json
{
  "id": "E-ICONS-001",
  "tasks": ["M8.0"],
  "requirements": ["LD-CAT-001", "LD-CAT-002", "LD-GOV-006", "LD-GOV-008"],
  "revision": "enclosing Jujutsu change vwktonpn",
  "versions": {
    "base": "fa13c1ce2adf7128c76e5c27bf0825bd5f747978",
    "designCoreSource": "99fa0952",
    "notesPublicSnapshot": "db95a879b866b7a033c7f908d76d0536a2b88ab1",
    "pluginsSource": "67c763aa038b846075301d1f821d0b01725bc597",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "svelte": "5.56.10"
  },
  "files": [
    "catalog/plugins/Workspace.stories.ts",
    "catalog/support/desktop/PluginFileIconsDemo.svelte",
    "catalog/story-parity.json",
    "catalog/COVERAGE.md",
    "spec/src/current/plugins.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-ICONS-001.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "original-notes-workspace",
      "command": "pnpm test:storybook -- catalog/plugins/Workspace.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Four original production Notes cases pass in all four viewport/theme presentations: 16 cases. Initial strict types and production renderer build also pass."
    },
    {
      "name": "packed-custom-artwork",
      "command": "pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Plugin File Icon'",
      "result": "pass",
      "failures": 0,
      "note": "Four cold cases assert the actual packed Bases SVG, decorative accessible file name, and opening in the contributed view. The fixture explicitly owns App, database, plugins and teardown and mounts the public WorkspaceShell."
    },
    {
      "name": "final-public-cohort",
      "command": "pnpm check:types\npnpm build\npnpm test:storybook -- --shard=1/4\npnpm test:storybook -- --shard=2/4\npnpm test:storybook -- --shard=3/4\npnpm test:storybook -- --shard=4/4",
      "result": "pass",
      "failures": 0,
      "note": "Strict types have zero errors/warnings; production renderer builds. All 2,060 interaction/accessibility cases pass across 110 families, both themes and both viewports. Four separate JJ workspaces run one bounded shard each against the same 28 checksum-pinned archives and equivalent final source."
    }
  ],
  "milestoneReview": "M8.0 remains Done with packed file-artwork and complete catalog evidence. No native, provider, Rust migration or distribution status changes.",
  "contractReview": "API and Explorer own generic metadata/resolution, Design Core owns scoped rendering, and Bases owns artwork. Desktop uses public archives without production routing changes or copied package code.",
  "completedGates": {
    "M8.0": "Desktop catalog renders real production composition, builds statically and passes both-theme interaction/accessibility cases without native services."
  }
}
```

## Public source and consumer boundary

Notes owns editor metadata, manifest/catalog validation, App icon resources,
owned plugin registration and the Explorer adapter. Design Core owns generic
scoped SVG rendering, filename fallback and mount/rename lifetime. Bases owns
its artwork and filename patterns. Desktop adds consumer acceptance without a
production extension map, copied SVG implementation or host routing change.

The dedicated packed-plugin fixture is declared as the public WorkspaceShell
component within the existing application family. The default Desktop profile
does not load Bases. The fixture selects it explicitly for this integration; the
ordinary production Notes cases retain their existing composition.

Selective archive qualification preserves the other prerequisites. It does not
claim a complete latest-source review refresh, change tracked dependency ranges,
publish packages or replace an installed app. Native admission, filesystem,
window and OS behavior retain their existing evidence and gates.

## Archive cohort

The final `.local/validation/file-icons-final-cohort.json` holds all 28 exact
archive identities. Important SHA-256 values are:

- Design Core:
  `ad82a73a5323b70ac814a69f7db4ee10f032a1b1146eef11d38f341dad1543fb`.
- API: `cfff557ff2ccbb7e2751777f62ef467bd445eee7bb6180dd05525389b566b712`.
- Explorer: `47d10e8f1f8c88b24ecd07cc6a5ece123d35c274d8c64fe3004cf3980ab05da3`.
- Bases: `a7ab0601c7feacca7341eea612b417f481ff40c276e400a3307f7c603fc40930`.

The Notes public snapshot contains the final runtime inputs; later source
closure changes are documentation and evidence. Bases runtime/public inputs are
unchanged from its qualified artifact snapshot `ea51f96f`; its committed
successor is `67c763aa`. The source records retain prepack, deterministic
payload/test-signature, source unit, browser and explicit baseline findings.

Final shard reports are `a3195080`, `97bbd3cf`, `0edf8c0e` and `72894025`,
retained under each workspace's ignored `.local/validation/runs/`.
Per-presentation case counts are 121, 121, 131 and 142; each runs four
presentations.

## Failed attempts retained

The initial custom-icon case fails once with an older Bases package. One refresh
attempt omitted Bases from the overlay. A subsequent fixture incorrectly assumed
the default Notes profile loaded Bases, then used a CSS name as a view type. The
corrected fixture explicitly selects the public plugin and imports
`FileExplorerViewType`. Exact after-run `5f2085c8` passes all four cases.

Initial fixture type checking reports three errors: the required Markdown
renderer callback, an incompatible generic story render and an unsupported
role-query option. The first render cast still fails once. Typing that story
against its actual component and retaining ordinary exact string name matching
produces zero errors/warnings (`cc372f33`); no production type shim is added.

An initial broad catalog was deliberately interrupted after 360 passing cases to
freeze the new Bases cohort. Its stopped container was confirmed exited before
its retained workspace lease was released. One attempted run rejected that
retained lease before tests; it is not a functional failure.

The first complete-cohort shard-1 run finds one existing AI Attachments/Classic
narrow layout failure: 52px versus the 36px maximum. Exact cold run `907ace49`
passes all four presentations with the same API cohort and no code or assertion
change. The final full cohort reruns every shard and passes all 2,060 cases.
Initial other shards also pass, but the final counts use only the final cohort.

The initial documentation close exceeds the 400-line limit in `plugins.md` (405)
and the history index (401), and an earlier progress snapshot lacks the required
evidence reviews. Concise prose, preserved index links and explicit reviews
repair these documentation gates without changing product source.

## Milestone review

M8.0 remains Done with additional packed-plugin/catalog evidence. This slice
does not close any native, provider, signing, distribution, Review or Rust
migration milestone. Visual review remains pending and no baseline is updated.
The accepted unrelated source audit/CSV/release findings remain recorded in the
owning Notes and Plugins records; none is converted into a passing release gate
by this consumer result.
