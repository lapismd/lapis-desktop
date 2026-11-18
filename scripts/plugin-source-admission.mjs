import { execFileSync } from "node:child_process";

// Use the owning source audit before any workspace install or plugin build.
// A stale checkout without the audit fails closed, including warm installs.
export function assertRetiredFreePlugins(source) {
  execFileSync(process.execPath, ["scripts/check-retired-ai.mjs"], {
    cwd: source,
    stdio: "inherit",
  });
}
