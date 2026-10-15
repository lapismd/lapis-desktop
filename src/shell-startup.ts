import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
import { isNativeDesktopRuntime } from "@lapis-notes/api/runtime";
import { invoke } from "@tauri-apps/api/core";

export interface ShellInfo {
  runtime: "tauri-desktop";
  os: string;
  version: string;
  ready: boolean;
}

export async function startShell({
  mount,
  document,
  call = invoke,
}: {
  mount: () => unknown;
  document: Document;
  call?: typeof invoke;
}): Promise<void> {
  const info = await call<ShellInfo>("shell_info");
  if (!isNativeDesktopRuntime(info.runtime)) {
    throw new Error(
      "The native host did not report a supported desktop runtime",
    );
  }
  document.documentElement.dataset.appStateDirectory =
    DEFAULT_APP_STATE_DIRECTORY;
  document.documentElement.dataset.lapisRuntime = info.runtime;
  document.documentElement.dataset.runtimeClass = "desktop";
  document.documentElement.dataset.lapisPlatform = info.os;
  mount();
  await call("shell_ready");
  document.getElementById("boot")?.setAttribute("hidden", "");
  document.documentElement.dataset.shellReady = "true";
}
