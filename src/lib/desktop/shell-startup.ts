import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
import { isNativeDesktopRuntime } from "@lapis-notes/api/runtime";
import { invoke } from "@tauri-apps/api/core";
import { validateTasksSelection } from "../native/tasks/tasks.ts";

export interface ShellInfo {
  runtime: "tauri-desktop";
  aiOwner?: "renderer" | "core";
  metadataOwner?: "renderer" | "core";
  editingOwner?: "renderer" | "core";
  tasksOwner?: "renderer" | "core";
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
  const metadataOwner = info.metadataOwner ?? "renderer";
  if (metadataOwner !== "renderer" && metadataOwner !== "core")
    throw new Error("The native host reported an invalid metadata owner");
  const editingOwner = info.editingOwner ?? "renderer";
  if (editingOwner !== "renderer" && editingOwner !== "core")
    throw new Error("The native host reported an invalid editing owner");
  const tasksOwner = info.tasksOwner ?? "renderer";
  validateTasksSelection(tasksOwner, metadataOwner, editingOwner);
  document.documentElement.dataset.appStateDirectory =
    DEFAULT_APP_STATE_DIRECTORY;
  document.documentElement.dataset.lapisRuntime = info.runtime;
  document.documentElement.dataset.runtimeClass = "desktop";
  document.documentElement.dataset.lapisPlatform = info.os;
  document.documentElement.dataset.aiOwner = info.aiOwner ?? "renderer";
  document.documentElement.dataset.metadataOwner = metadataOwner;
  document.documentElement.dataset.editingOwner = editingOwner;
  document.documentElement.dataset.tasksOwner = tasksOwner;
  mount();
  await call("shell_ready");
  document.getElementById("boot")?.setAttribute("hidden", "");
  document.documentElement.dataset.shellReady = "true";
}
