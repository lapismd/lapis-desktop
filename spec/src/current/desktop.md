# Desktop shell

M0.1 establishes the native shell; M2 adds admitted folder access and a
launcher. The existing Notes workspace and App will be integrated through public
packages in M3.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-DESK-001  | The desktop MUST display Lapis branding and the public Design Core Lapis theme in a bundled Svelte renderer. Startup MUST expose an accessible loading status, followed by ready content or an accessible failure.                                                                            |
| LD-DESK-002  | macOS MUST retain native close, minimize and fullscreen controls in an overlay titlebar. A 40px header MUST reserve 80px for traffic lights at 16,25 logical pixels, provide explicit drag regions, and retain usable content at the minimum window size.                                     |
| LD-DESK-003  | Native IPC MUST grant only named shell and admitted-vault commands and window-drag/zoom permissions to the local main window. External navigation, generic filesystem, shell execution and remote capability grants MUST remain denied.                                                       |
| LD-DESK-004  | The shell MUST persist window geometry in its separate application profile, provide normal native application/edit/window menus, and support cold close and relaunch without leaving an owned process behind.                                                                                 |
| LD-DESK-005  | Native acceptance MUST exercise the actual macOS WebView, resizing, window movement, close, and relaunch using isolated test state. Automation plugins, permissions and frontend hooks MUST be absent from normal bundles.                                                                    |
| LD-HOST-001  | The desktop MUST consume the shared API through public package exports, identify its runtime as `tauri-desktop`, and use the shared `.lapis` state default. Migration acceptance MUST use verified source-owned pnpm archives until publication at the final release gate.                    |
| LD-VAULT-001 | Open and Create MUST use a native folder picker. Cancellation MUST leave the current selection and recent profiles unchanged. Create MUST validate a single folder name and reject existing destinations without overwriting them.                                                            |
| LD-VAULT-002 | Recent vault profiles MUST live in the separate native application profile and reopen only by a host-owned profile ID. Missing or changed physical roots MUST report failure without silently selecting another folder.                                                                       |
| LD-VAULT-003 | Filesystem commands MUST require a live host-issued admission and relative vault paths. Absolute paths, parent traversal, symlink escape, and operations after close MUST reject. Directory handles MUST enforce containment during operations, including concurrent symlink substitution.    |
| LD-VAULT-004 | Text and binary writes MUST stage in the destination directory, flush the staged file, and atomically replace the destination. Failed or interrupted staging MUST preserve the previous complete destination. Permission and encoding failures MUST remain observable.                        |
| LD-VAULT-005 | Attachment URLs MUST use revocable, unguessable admission tokens and the contained native resource handler. Responses MUST have explicit media types, no-store and nosniff headers; executable document types, arbitrary file URLs, traversal, and closed admissions MUST remain unavailable. |
| LD-VAULT-006 | The launcher MUST expose accessible Open, Create, recent-vault, and Close actions, selected-vault identity, and a bounded root listing. Native tests MUST use isolated profiles and real temporary folders; acceptance instrumentation MUST remain absent from ordinary bundles.              |

The product name is Lapis Notes Preview and the application identifier is
`com.lapismd.lapis-desktop.preview`. Development Vite binds literal loopback on
port 1431. Production loads bundled assets through Tauri's local application
protocol and permits no network connection except native IPC.

Use public Tauri overlay configuration and native menus. Glass, platform-pointer
interop, extra windows and user documents remain later work. Closing the only
window exits this shell; unsaved-document coordination is introduced before
document editing is considered qualified in M4.

The private `shell_info` command reports runtime, platform, process identity and
application version. `shell_ready` acknowledges renderer readiness. Native
state, rather than a DOM marker alone, confirms that handshake. These commands
confer no vault or process authority.

Cold-process acceptance waits for the Rust readiness acknowledgement before
driver script evaluation. A listening WebDriver socket alone does not establish
that the initial WebView document has its IPC bindings; an early evaluation can
lose its reply during navigation. Keep the existing bounded startup deadline.

Startup reads the public API `path` and `runtime` entrypoints. Runtime identity
does not need to load optional database or model services.

The native e2e feature uses separate configuration and a test profile. Its
artifact is never the ordinary application bundle. Browser and Rust tests are
supporting evidence; neither can replace the actual WebView gate.

Application signing and notarization are deferred to M11 at the user's request.
The local bundle gate checks identity, architecture and runtime contents without
requiring a signature. WebDriver's embedded pointer actions dispatch DOM
MouseEvents and cannot establish AppKit titlebar dragging. Physical native input
and persisted window positions must qualify that boundary separately; synthetic
pointer results cannot waive it.

## Native vault access (M2)

The native profile owns at most 20 recent `desktop-folder` records. A picker
selection admits one canonical root through a directory capability; the renderer
receives its identity and an opaque session ID. Reopening requires a saved
profile ID, never a renderer-provided absolute path. Closing revokes the session
and its resource token. Every process starts without a live admission.

Create opens the new child through the selected parent's directory capability.
It MUST NOT grant admission by reopening an ambient child pathname, which could
have become a symlink outside that parent after creation.

M2 supplies bounded stat, existence, list, text/binary read, range read, mkdir,
append, and whole-file atomic write operations. Requests are serialized by the
native vault owner. Files are limited to 64 MiB per whole-file operation, range
reads to 256 KiB, and listings to 2,000 entries. The public Notes adapter is
translated through an explicit command allowlist; unrelated service capabilities
remain unavailable. File-management operations, watching, and streamed writes
remain later intake and MUST fail explicitly until implemented.

Vault paths use forward slashes; the virtual root is the empty string. Reject
dot/parent components, NUL, backslashes, drive prefixes, and paths over 4,096
bytes. Symlinks are unsupported, including links whose targets remain inside a
vault. Capability-based filesystem resolution provides an additional containment
boundary if a path changes after validation. Reads accept only regular files;
listings omit symbolic links and special files.

Atomic replacement preserves existing permissions and honors a supplied valid
modification time. Creation times are filesystem-owned. A power loss after the
rename is outside M2's process-interruption guarantee. Pre-release application
state may be reset; ordinary note-write integrity still applies.

The `lapis-vault` protocol serves only supported image, audio, video, and PDF
attachments, with a restrictive response CSP. Neither raw HTML nor scripts are
served. The only added renderer network origins are this local resource scheme
and its platform-local equivalent. M2 does not construct App or claim note
editing; M3 mounts the existing workspace and proves the native database.
