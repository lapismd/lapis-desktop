import { listen } from "@tauri-apps/api/event";
import type { DesktopUrlDelivery } from "../native/integration-urls.ts";

/** Use each focused editor's existing history; ordinary inputs retain DOM undo. */
export function runFocusedHistory(
  document: Document,
  action: "undo" | "redo",
  mac: boolean,
): void {
  const target = document.activeElement;
  const view = document.defaultView;
  if (!target || !view) return;
  const event = new view.KeyboardEvent("keydown", {
    key: "z",
    code: "KeyZ",
    metaKey: mac,
    ctrlKey: !mac,
    shiftKey: action === "redo",
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  if (target.dispatchEvent(event)) document.execCommand(action);
}

export async function installDesktopMenu(
  openVaults: () => Promise<void>,
  report: (failure: unknown) => void,
  urls: DesktopUrlDelivery,
  canEdit: () => boolean,
  focusedDocument: () => Document = () => document,
): Promise<() => void> {
  const stopMenu = await listen<string>("lapis-menu-action", ({ payload }) => {
    if (payload === "open-vault") void openVaults().catch(report);
    else if ((payload === "undo" || payload === "redo") && canEdit())
      runFocusedHistory(
        focusedDocument(),
        payload,
        document.documentElement.dataset.lapisPlatform === "macos",
      );
  });
  const stopErrors = await listen<string>(
    "lapis-integration-error",
    ({ payload }) => report(payload),
  );
  const stopUrls = await listen<void>("lapis-app-urls-pending", () => {
    void urls.flush();
  });
  return () => {
    stopMenu();
    stopErrors();
    stopUrls();
    urls.dispose();
  };
}
