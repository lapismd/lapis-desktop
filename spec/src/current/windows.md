# Native workspace windows

After successful leave preflight, the rendered Notes shell MUST unmount before
workspace or related plugin authority is retired. Existing related-window
admission and failure-preservation gates remain required.

E-REPO-050 retains LD-POP-004's original final-persistence-before-teardown gate;
failed backup preparation must preserve the same related editors and drafts.

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
qualified M7.3 implementation supplies ordinary renderer admission and shared
close coordination through the session registry below.

Explicit background API acceptance creates only the hidden, unfocused main
window and prohibits macOS activation. Its launcher removes popup-proof opt-in
and real-picker flags. This debug-only IPC lane cannot qualify visible popup
hosting, control geometry or window movement; ordinary window configuration and
the headed proof stay unchanged.

Native chrome observers belong to individual windows and are removed on window
destruction or host exit. No raw native pointer survives its live main-thread
callback. The original 40px strip and y=20 native-control centers remain
unchanged for the main window.

## Session integration

M7.3 uses a desktop-owned session registry. Only the active main session may
open related blank windows, with at most sixteen issued, pending or live
windows. The synchronous shared opener uses exact `about:blank`, preserving the
initial related document without a later fragment navigation. Native claims
consume preissued one-use identities in order; failed opens await cancellation
or acknowledged fencing before another open can proceed. Arbitrary fragments and
stale tickets are denied. Creation tickets and close receipts are
native-generated and cannot survive retirement or session replacement. Fencing
invalidates pending creation before close, reload or vault switching; existing
drafts retain their window until save admission succeeds. Failed saves keep the
same window usable and require a fresh close request. This registry is a
prerequisite for ordinary window admission, not acceptance of the complete
native pop-out workflow.

The ordinary host supplies tickets before exposing the shared opener. Native
close awaits the main App's existing asynchronous save guard. Only that App
finishes a correlated close request; detached windows receive no IPC grants.
Attachment/plugin reads remain restricted to the window's admitted vault. On
macOS the supplied related configuration gets its own content controller before
creation, retaining WebKit's opener/process relationship and separate message
IPC callers. Before framework scripts run, `connect-src 'none'` confines fetch
and network services to the main App, including scheme-based IPC. The detached
SDK's message fallback retains its own native caller and receives no grant.
Shared resource handlers, including main, are confined to the active App's
vault; another admitted native vault cannot widen that scope. Main-window
network and protocol IPC remain unchanged. Resource token checks use the same
once-decoded path as the reader, including Tauri-encoded separators. Popup
focus, dragging and zoom use named main-owned operations. Focus restores the
native window and explicitly focuses its related webview before editor input.
Closing the vault rejects while related windows remain; failed leave resumes the
original owner.

Native focus, resize and close use public Tauri operations on registered window
labels. The renderer's Window and Document remain the shared surface's DOM host.
Shared popup header clearance is separately governed by LD-POP-006. M7.2
qualifies its public token and browser geometry; M7.3 measures actual native
control bounds in ordinary popup windows.

The embedded WebDriver replaces WebKit's UI delegate and removes Wry's popup
callback. Popup proof processes therefore retain Wry's delegate, self-drive the
existing shared surface and report passive console receipts. The driver stays
enabled for the other native suites. A `deny` proof mode exercises the same
native denial without enabling creation. Only acceptance configuration grants
main-window enumeration for public native focus/resize checks.

M7.2 owns source-first Design Core/API/Workspace changes and browser evidence.
Shared close admission also keeps ordinary note and editable-preview tabs
mounted after failed saving. Native acceptance retains the tab, draft and
shutdown barrier, then retries tab removal after explicit recovery. M7.3 owns
Tauri admission, native action routing, registered attachment access, save-safe
lifecycle and ordinary-bundle qualification. A passing proof is not evidence
that tab transfer or native editing is implemented.

Detached windows last for the current session only. Native cross-window drag
transfer, independent-vault windows and restart restoration remain deferred.
Signing, publication and other-platform qualification retain their original
deferred gates.

The main window’s bundled-origin resource hook validates installed plugin assets
under the existing vault admission. This adds no popup admission or window
permission; ordinary popup integration remains M7.3.

Window creation, navigation admission and macOS chrome group under
`host/windows`; popup proof helpers live under debug-only
`acceptance/popouts.rs`. The window contract maps those paths explicitly. The
native chrome module alone retains its binary unsafe-code allowance; service
code remains forbidden unsafe.

E-POPOUT-004 qualifies M7.3 on macOS ARM64 with fourteen real Notes/native
checks and both related-host allow/deny cases. E-REPO-050 additionally proves
failed final persistence preserves the live editor before a successful retry.

Workspace WebViews inherit `dragDropEnabled: false` from the shared main-window
configuration. HTML tab dragging within each window remains WebKit-owned;
Tauri's native file-drop interception cannot consume its drag updates/drops.
This is separate from native titlebar movement and does not enable cross-window
tab transfer, external file imports or new popup admission.
