# Design Core transcript reference

This catalog-only example renders the same recorded conversation and synthetic
review discussions as Design Core's `Chat/Transcript` full-conversation demo. It
composes installed public Design Core exports directly, outside the Notes AI
adapter. Document/Classic run in the ordinary desktop AppShell with both docks
collapsed. A standalone variant retains the source geometry for comparison.
Pixel parity and visual baselines still require user review.

Source: `design-core` revision `dae8ca429db122d7e40e077d00f862751ec6c337`,
`src/shared/chat/transcript/Transcript.stories.fixture.svelte` and
`reference/{capture,adapter,discussions,people,markdown-blocks,offsets,patches,turns}.stories.fixture.*`.
The source derives from jj-store `2a479c74`, Apache-2.0, LapisMD contributors.
The copied Codex SVG retains the source fixture asset. The source and copied
footer controls include selected values in accessible names for axe 4.14.

`design-core-reference.json` is a one-time materialized projection of those
captured items and synthetic discussions. Generation resolves fixture icons to
stable names, then this host restores the same public Lucide components and
local avatar. It imports no sibling source or private runtime module. The
capture, comments, replies, pending message, metadata and unknown-context
overlay are demonstrations. No agent, provider, native store or tool is
executed.

The ordinary Notes AI plugin retains its current presentation pending review.
