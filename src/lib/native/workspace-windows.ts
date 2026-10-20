import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createDesktopPopouts,
  type DesktopPopouts,
} from "../desktop/workspace-popouts.ts";
import { installPopupEffects } from "../desktop/popup-effects.ts";
import { requestReload } from "../desktop/desktop-lifecycle.ts";
import { DesktopIntegrationPorts } from "./desktop-integration.ts";
import type { PopupClose } from "../desktop/popup-handle.ts";

export function createNativeWorkspaceWindows(
  sessionId: string,
  open: Window["open"],
  report: (error: unknown) => void,
): Promise<DesktopPopouts> {
  const ports = new DesktopIntegrationPorts(invoke);
  const call = <T = unknown>(
    frame: import("../desktop/popup-handle.ts").PopupFrame,
  ) => invoke<T>("desktop_workspace_windows", { frame });
  return createDesktopPopouts({
    sessionId,
    call,
    open,
    report,
    onClose: (callback) =>
      listen<PopupClose>("lapis-popup-close", ({ payload }) => {
        void callback(payload).catch(report);
      }),
    onRetire: (callback) =>
      listen<string>("lapis-popup-retired", ({ payload }) => callback(payload)),
    setup: (window, label) =>
      installPopupEffects(window, label, call, ports, requestReload, report),
  });
}
