import AppKit
import CoreGraphics
import Foundation

func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}
guard CommandLine.arguments.count == 2 else { fail("Require installed application path") }
let url = URL(fileURLWithPath: CommandLine.arguments[1]).standardizedFileURL
var application: NSRunningApplication?
var launchError: Error?
var finished = false
let configuration = NSWorkspace.OpenConfiguration()
configuration.createsNewApplicationInstance = true
configuration.environment = ["PATH": "/usr/bin:/bin"]
for directory in ["/usr/bin", "/bin"] {
    for executable in ["node", "deno"] {
        if FileManager.default.isExecutableFile(atPath: directory + "/" + executable) {
            fail("Application smoke PATH unexpectedly provides Node or Deno")
        }
    }
}
NSWorkspace.shared.openApplication(at: url, configuration: configuration) { app, error in
    application = app
    launchError = error
    finished = true
}
func spin(until deadline: Date, condition: () -> Bool) -> Bool {
    while Date() < deadline {
        if condition() { return true }
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.05))
    }
    return condition()
}
guard spin(until: Date(timeIntervalSinceNow: 45), condition: { finished }) else { fail("Application launch timed out") }
if let error = launchError { fail("Application launch failed: \(error)") }
guard let app = application, app.bundleURL?.standardizedFileURL == url else { fail("A different application was launched") }
func hasWindow() -> Bool {
    guard !app.isTerminated,
          let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else { return false }
    return windows.contains { window in
        guard (window[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value == app.processIdentifier,
              (window[kCGWindowLayer as String] as? NSNumber)?.intValue == 0,
              let bounds = window[kCGWindowBounds as String] as? [String: Any],
              let width = bounds["Width"] as? NSNumber, let height = bounds["Height"] as? NSNumber else { return false }
        return width.doubleValue >= 640 && height.doubleValue >= 480
    }
}
guard spin(until: Date(timeIntervalSinceNow: 45), condition: { app.isFinishedLaunching && hasWindow() }) else {
    app.forceTerminate()
    fail("Installed app did not present its native window")
}
guard app.terminate(), spin(until: Date(timeIntervalSinceNow: 30), condition: { app.isTerminated }) else {
    app.forceTerminate()
    fail("Installed app did not quit gracefully")
}
let result: [String: Any] = ["pid": app.processIdentifier, "visibleNativeWindow": true, "gracefulQuit": true, "nodeDenoOnPath": false]
let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
print(String(decoding: data, as: UTF8.self))
