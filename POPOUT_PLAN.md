# Native tab windows for Lapis Desktop

## Summary

Implement **Open in new window** with the existing workspace components and
Electron's ownership model: one App and vault session, with tabs displayed in
additional native windows. Detached windows are session-only and are not
restored after restart, as selected by the user on 2026-10-16.

The action already exists. Tauri blocks popup creation in the renderer and
native host. Shared live layout projection also discards popup records. Both
boundaries need fixing before exposing this functionality.

## Expected behavior

- Move a selected tab into a native window, preserving its editor, unsaved
  content, history and view state.
- Reuse the existing popup tab/split shell, chromeless presentation, centered
  traffic lights and HTML drag regions. Reserve the same native-control safe
  area in each popup's top-left top or stacked tab strip, including after
  resize; do not add content above the tabs or subtract the main window's ribbon
  width.
- Support multiple detached windows within the same vault.
- Route shortcuts, palettes, menus, clipboard and attachments to their owning
  window; propagate live theme and style changes.
- Close a detached window's tabs after successful saving. Failed saving keeps
  the window and draft available.
- Add **Move to → Main window** to the existing pane menu. Use the last valid
  main pane, falling back to the first main pane.
- Coordinate every detached window before main close, Quit, Reload or vault
  switching tears down the owning App.

## M7.1 — Record the plan and prove native hosting

Save this plan and introduce the canonical popup contract, verification rows and
three independent post-M7 tasks. Preserve all M0–M7 completion gates and keep M8
paused. Generate `MIGRATION.md` from the task ledger.

Prove related native WebViews using the installed Tauri `on_new_window`,
`window_features(features)` and `NewWindowResponse::Create` APIs. Reuse the
native shell configuration and make traffic-light observer lifetime specific to
each window. Until later slices qualify transfer and saving, enable popup
creation only in the debug acceptance build with an explicit fixture opt-in.

**Gate:** An isolated actual native WebView opens a related window with an
accessible Window and Document, mounts an existing shared surface, and proves
focus, resize, close and cleanup. Ordinary bundles retain denied popup creation
and contain no proof instrumentation. Commit and pause for review.

## M7.2 — Connect the shared workspace

Make reusable fixes in Design Core and Lapis Notes before consuming their
verified public archives in Desktop:

- Expose the existing injectable popup-host contract through WorkspaceShell.
- Separate live projection from persisted restoration: preserve popup records
  and claimed leaf identity during live updates; omit session-only popups on
  cold restoration.
- Attach compatibility windows to the controller's existing popup handles
  without duplicate native creation.
- Preserve owned App context, editor document ownership and one layout writer.
- Extend the existing popup surface with document-local key handling, focused
  host tracking, palette placement and live style/theme propagation. Make its
  top-left top/stacked pane consume the public native-control clearance tokens.
- Admit close asynchronously before removing any tab or window. Failed admission
  preserves the layout.

**Gate:** Browser acceptance moves a real note into a popup and back while
preserving its draft and editor history. Multiple popups remain independent,
overlays stay in their own document, and failed opening/closing leaves source
content reachable. Top and stacked popup headers reserve native-control
clearance after resize. Commit each owning repository and pause for review.

## M7.3 — Integrate Tauri and qualify everyday use

Supply the desktop adapter and a native popup registry tied to the current App
session. Admit only owned blank popup creation; preserve bounded external-link
handling and deny arbitrary navigation. Filesystem, database and watcher
ownership stays in the main session. Admit attachment reads only for registered
windows in that session. Bind dragging, focus and controls to the correct native
window.

Editing commands target the focused document. Open Vault, Reload, Quit and
application URLs route through the existing App owner. Native close enters the
shared async guard, including focused blur-saving controls, pending writers,
conflicts and layout persistence. Dispose mounts, listeners, native observers
and registry entries once; stop popup admission during teardown.

**Gate:** The ordinary packaged app opens, edits, saves, redocks and safely
closes multiple native windows with no duplicate sessions or stale resources.
Commit, restart the ordinary app with the preserved user vault and pause.

## Validation and tracking

Start with exact failing targets and record before/after counts. Widen to each
changed owner's checks, tests, build and required Storybook interaction/axe
lanes, then affected consumers using verified public package archives. Native
acceptance uses isolated profiles and actual WebViews with no Node/Deno on the
app PATH. Update fresh immutable evidence, the task ledger and generated status;
run specification and architecture checks for every slice.

Cover actual tab actions, failed creation, dirty drafts, undo/redo, attachments,
focus, popup-local overlays, last-tab/native close, failed saves and recovery,
main close/Quit/Reload, vault switching, repeated opening/closing and relaunch.
Saved notes survive session-only popup disposal. Verify ordinary bundle chrome
and permission/instrumentation boundaries separately.

Safe-area acceptance compares the first interactive tab/control bounds against
the measured native traffic-light bounds in each popup, before and after resize,
for both top and stacked tab modes. Keep the strip at the top edge.

Deno desktop and legacy Electron remain reference-only. Reuse shared components
and existing screens. Restoration, native cross-window drag transfer,
independent-vault windows, signing and other-platform qualification remain
deferred. This work does not begin M8.
