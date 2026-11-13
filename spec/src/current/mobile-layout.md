# Notes mobile layout

## Requirements

| ID             | Requirement                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-SESSION-005 | The production Notes shell MUST follow App-owned mobile preferences. Always/Never switch immediately; Auto observes live shell width and its configured breakpoint. The host MUST NOT force desktop presentation. |

Catalog examples retain deterministic presentation through fixture
configuration. The production-root responsive scenario overrides that
preference, waits for App-owned Always to mount mobile chrome after the shell
starts, and verifies both resize directions and compact Settings dismissal in
light/dark and wide/narrow viewports. Generic rendering, sidebar controls and
dismissal belong to Design Core; the Desktop host supplies its owning App and
native adapters.

The host MUST consume Workspace's App-owned mobile actions: Search opens the
registered search sidebar, note creation opens a real vault note, and the
command palette uses the owning App. The production-root catalog MUST exercise
these actions with released Core and Notes packages, including the shared
sidebar selector. Deterministic fixture modes do not disable the responsive
scenario above.

Source and browser evidence in [E-MOBILE-003](../history/E-MOBILE-003.md) and
[E-MOBILE-005](../history/E-MOBILE-005.md) remains separate from registry
publication and actual native window qualification.
