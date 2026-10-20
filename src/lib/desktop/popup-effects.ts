import {
  installDesktopClipboard,
  installDesktopExternalLinks,
  type DesktopIntegrationPorts,
} from "../native/desktop-integration.ts";
import type { PopupCall } from "./popup-handle.ts";

/** Related documents keep main-owned native ports and their own DOM listeners. */
export function installPopupEffects(
  owner: Window,
  label: string,
  call: PopupCall,
  ports: DesktopIntegrationPorts,
  reload: () => Promise<void>,
  report: (error: unknown) => void,
): () => void {
  const stopClipboard = installDesktopClipboard(ports, owner.navigator);
  const stopLinks = installDesktopExternalLinks(ports, report, owner);
  const drag = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const target = event.target as Element | null;
    if (typeof target?.closest !== "function") return;
    const region = target.closest("[data-desktop-drag-region]");
    if (!region || region.getAttribute("data-desktop-drag-region") === "false")
      return;
    if (
      target.closest(
        "button,input,textarea,select,a,[role=button],[contenteditable=true]",
      )
    )
      return;
    event.preventDefault();
    void call({ action: event.detail === 2 ? "zoom" : "drag", label }).catch(
      report,
    );
  };
  const key = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) void reload().catch(report);
    }
  };
  owner.addEventListener("mousedown", drag);
  owner.addEventListener("keydown", key, { capture: true });
  return () => {
    stopLinks();
    stopClipboard();
    owner.removeEventListener("mousedown", drag);
    owner.removeEventListener("keydown", key, { capture: true });
  };
}
