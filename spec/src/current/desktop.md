# Desktop shell

M0.1 establishes a native shell. It does not yet open a vault or construct App.
The existing Notes workspace will be integrated through its public package in
M3.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-DESK-001 | The desktop MUST display Lapis branding and the public Design Core Lapis theme in a bundled Svelte renderer. Startup MUST expose an accessible loading status, followed by ready content or an accessible failure.                                        |
| LD-DESK-002 | macOS MUST retain native close, minimize and fullscreen controls in an overlay titlebar. A 40px header MUST reserve 80px for traffic lights at 16,25 logical pixels, provide explicit drag regions, and retain usable content at the minimum window size. |
| LD-DESK-003 | Native IPC MUST grant only named shell metadata/readiness and window-drag/zoom permissions to the local main window. External navigation, generic filesystem, shell execution and remote capability grants MUST remain denied.                            |
| LD-DESK-004 | The shell MUST persist window geometry in its separate application profile, provide normal native application/edit/window menus, and support cold close and relaunch without leaving an owned process behind.                                             |
| LD-DESK-005 | Native acceptance MUST exercise the actual macOS WebView, resizing, window movement, close, and relaunch using isolated test state. Automation plugins, permissions and frontend hooks MUST be absent from normal bundles.                                |

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

The native e2e feature uses separate configuration and a test profile. Its
artifact is never the ordinary application bundle. Browser and Rust tests are
supporting evidence; neither can replace the actual WebView gate.

Application signing and notarization are deferred to M11 at the user's request.
The local bundle gate checks identity, architecture and runtime contents without
requiring a signature. WebDriver's embedded pointer actions dispatch DOM
MouseEvents and cannot establish AppKit titlebar dragging. Physical native input
and persisted window positions must qualify that boundary separately; synthetic
pointer results cannot waive it.
