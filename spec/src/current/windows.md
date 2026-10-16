# Native workspace windows

This post-M7 workstream follows [POPOUT_PLAN.md](../../../POPOUT_PLAN.md). M7.1
proves the native hosting boundary before shared workspace changes or
ordinary-app popup admission. M7.2 and M7.3 remain separate review slices.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-POP-001 | The native hosting proof MUST create related Tauri WebViews with an accessible Window and Document, mount the existing shared popup surface, and verify focus, resize, native control alignment, close and cleanup in isolated actual WebViews. Proof creation and instrumentation MUST require the debug acceptance feature and explicit fixture opt-in, and MUST be absent from ordinary bundles. |
| LD-POP-002 | Live workspace projection MUST preserve popup records, existing leaf/editor identity, drafts and history, bind compatibility windows to existing controller handles, and retain one owned App and layout writer. Failed creation MUST leave the source tab reachable. Persisted restoration MUST continue omitting session-only popups.                                                             |
| LD-POP-003 | Detached workspaces MUST reuse the existing popup tab/split surface with chromeless native controls and window-specific HTML dragging. Styles and themes MUST update live. Focus, palettes, keyboard and editing actions MUST use the popup's document and active leaf. Existing pane menus MUST provide return to the last valid main pane, falling back to the first main pane.                   |
| LD-POP-004 | Native close, last-tab close, main close, Quit, Reload and vault switching MUST await owned pending writers, focused blur-saving controls and layout persistence before removing affected views. Failure MUST keep drafts and windows available. Completed teardown MUST release popup mounts, listeners, observers and native records exactly once and prevent further admission.                  |
| LD-POP-005 | Ordinary popup admission MUST be limited to owned blank related windows in the current App session. Native filesystem, database and watcher ownership MUST remain in the main session; attachment reads MUST require a registered window in that session. Arbitrary navigation and unowned windows MUST remain denied.                                                                              |
| LD-POP-006 | Each popup MUST reserve the main window's full native-control safe area in its top-left top or stacked tab strip, including after resize. The shared surface MUST consume public clearance tokens without main-window ribbon subtraction, and tabs MUST remain at the top edge.                                                                                                                     |

## Hosting proof boundary

The installed Tauri 2.12.4 exposes `NewWindowResponse::Create` and
`window_features(features)`, which carries the opener's WebView configuration on
macOS. The proof uses these supported APIs, never a second application
bootstrap, cloned vault session, copied component or remote document.

M7.1 permits `about:blank` only from the main window's new-window callback in
debug acceptance builds with `LAPIS_DESKTOP_POPOUT_PROOF=1`. A proof window
inherits shell presentation, has a generated native label, and denies nested
windows and nonblank navigation. It receives no new IPC capability grant. The
ordinary renderer and native callback keep denying popup creation until M7.3
supplies safe admission and shared close coordination.

Native chrome observers belong to individual windows and are removed on window
destruction or host exit. No raw native pointer survives its live main-thread
callback. The original 40px strip and y=20 native-control centers remain
unchanged for the main window.

## Remaining integration

Native focus, resize and close use public Tauri operations on registered window
labels. The renderer's Window and Document remain the shared surface's DOM host.
Shared popup header clearance is separately governed by LD-POP-006 and remains
part of M7.2 and M7.3 qualification.

The embedded WebDriver replaces WebKit's UI delegate and removes Wry's popup
callback. Popup proof processes therefore retain Wry's delegate, self-drive the
existing shared surface and report passive console receipts. The driver stays
enabled for the other native suites. A `deny` proof mode exercises the same
native denial without enabling creation. Only acceptance configuration grants
main-window enumeration for public native focus/resize checks.

M7.2 owns source-first Design Core/API/Workspace changes and browser evidence.
M7.3 owns Tauri admission, native action routing, registered attachment access,
save-safe lifecycle and ordinary-bundle qualification. A passing proof is not
evidence that tab transfer or native editing is implemented.

Detached windows last for the current session only. Native cross-window drag
transfer, independent-vault windows and restart restoration remain deferred. M8
remains paused. Signing, publication and other-platform qualification retain
their original deferred gates.
