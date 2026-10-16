# Desktop integration (M7)

M7 adds the native services and delivery required by PLAN.md to the qualified
Notes profile. Reuse the existing chooser, workspace commands, progress and
notification components. Use the native About panel; do not add replacement
renderer screens. Deno remains a frozen reference.

Startup recovery's existing Copy error details action must copy the complete
displayed diagnostic through the same native clipboard adapter, including when
Notes startup failed before a ready workspace existed.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-INT-001 | The macOS shell MUST provide Application, File, Edit, View, Window and Help menus with established labels and platform accelerators, including About and Quit in Application. Native clipboard, selection and window actions MUST use Tauri roles. Editor Undo/Redo MUST use the focused control's existing history keymap with a standard-input fallback. Unavailable actions MUST remain disabled or have a documented equivalent. |
| LD-INT-002 | Open Vault, guarded Reload/Quit and renderer-owned menu actions MUST enter the same host/application operations used by the existing UI and shortcuts. Menu delivery MUST target only the current ready owned App; launcher, failed startup, reload and retired-session states MUST NOT route into a stale App.                                                                                                                      |
| LD-INT-003 | The desktop MUST support operating-system text clipboard round trips and existing note copy/paste workflows. Named native ports MUST bound text and report failures through the owning host. Native Edit roles MUST retain standard platform accelerators.                                                                                                                                                                           |
| LD-INT-004 | The public native notification port MUST dispatch bounded title/message/severity payloads through the desktop host. Permission denial or unavailable delivery MUST remain explicit and recoverable; the existing in-app notification history and progress surface MUST remain authoritative.                                                                                                                                         |
| LD-INT-005 | About MUST show the current application identity/version using native presentation. Help/external links MUST open through a bounded operating-system URL service while the WebView remains at its admitted origin. Credential URLs, executable schemes, arbitrary file URLs and malformed requests MUST be rejected.                                                                                                                 |
| LD-INT-006 | A second launch MUST deliver supported application URLs to the existing instance, raise its main window and exit without opening a competing Notes owner. Cold launch and operating-system URL delivery to an already-running instance MUST share the same queue and routing rules.                                                                                                                                                  |
| LD-INT-007 | Application URL requests MUST remain bounded and queued until the explicitly owned App and its workspace are ready. Each accepted request MUST be dispatched once through the public AppUrlService and respect admitted vault containment and current-vault matching. Unhandled or invalid requests MUST remain visible without arbitrary filesystem admission.                                                                      |
| LD-INT-008 | Native services, menu listeners and URL subscriptions MUST retire with their owning host/App. Close, Quit, reload, launcher return and repeated switching MUST preserve the original M4 pending-writer and failure guarantees. Native menus MUST NOT bypass the existing leave coordinator.                                                                                                                                          |
| LD-INT-009 | Ordinary bundles MUST exclude acceptance drivers and profile overrides. New native authority MUST use named bounded commands on the owned main window; signing, publication, additional platforms and post-M7 plugin intake MUST remain deferred.                                                                                                                                                                                    |

## Qualification

Exercise actual menu dispatch, clipboard/native notification ports, native About
and safe external opening alongside renderer command routing. Use isolated real
vaults for cold and already-running application URL delivery, repeated requests
and invalid/cross-vault requests. Verify note bytes and saved layout
before/after requests, including failed-save recovery and teardown.

After implementation, run every deferred source, Storybook interaction/axe, web,
Desktop, ordinary-bundle and original M4–M7 gate. Passing unit tests or
registering a plugin cannot replace actual native acceptance. Finish at M7's
original gate, launch the ordinary app for review and pause.

The superseded Deno inspector has no Tauri runtime to inspect. Native WebView
developer tools are its available replacement. Preserve the captured inventory
and the complete M7 gate rather than carrying Deno runtime code forward.

The native navigation and new-window callbacks enforce the same bounded link
policy as renderer anchors and window.open. External links enter the OS opener;
supported application links enter the native queue. The original admitted
WebView origins remain exact. Additional WebViews remain denied except for the
debug-only [native hosting proof](windows.md). Global link fallback must run
after component and document-delegated actions, respect their prevented default,
and avoid duplicate OS opens or application URL admissions. Components retain
their existing action ownership.

URL delivery waits for the public workspace controller's awaitable start after
the shared shell mounts. Core Notes/layout loading alone cannot admit delivery:
the shell's own startup must finish before navigation can supersede its saved
layout. Shutdown during that wait leaves requests with the native queue. The
Notes ready marker must agree with the interactive state: a mounted shell that
is still busy or inert is not ready for user actions or native acceptance.

On macOS, native notifications await the UserNotifications authorization and
request result. Denial remains an explicit error with the existing in-app
history available; delivery does not claim a visible banner against OS settings.

Native Undo/Redo selectors do not reach CodeMirror history. The desktop forwards
those menu actions to the focused control’s existing keyboard command path, then
uses standard DOM history only when that path does not handle the event. Busy,
starting and retired owners cannot admit editing actions. Clipboard and window
roles stay native. Public absolute-path application URLs remain supported
through the existing admitted-vault resolver, without new filesystem admission.

Final qualification retains the established native chrome and editable-preview
contracts. Tauri's inset must request the same 40px titlebar container as the
native alignment helper; a later native draw must not shrink it after resize.
Preview recovery acceptance establishes keyboard focus before requesting the
focus-visible link card, then establishes the dirty draft before external disk
changes. Keep exact draft/disk, retired-owner and failed-close assertions. The
compressed-resource test harness retains the build toolchain PATH while building
its development fixture. Each actual native app process still receives only
`/usr/bin:/bin`; build-tool availability cannot substitute for that proof.
