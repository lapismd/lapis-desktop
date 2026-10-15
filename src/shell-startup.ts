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
  document.documentElement.dataset.lapisPlatform = info.os;
  mount();
  await call("shell_ready");
  document.getElementById("boot")?.setAttribute("hidden", "");
  document.documentElement.dataset.shellReady = "true";
}
