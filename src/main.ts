import { mount } from "svelte";
import {
  setNativeDesktopBridge,
  type NativeDesktopPlatformOs,
} from "@lapis-notes/api/desktop-native";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "./styles/shell.css";
import "./styles/notes-workspace.css";
import "./styles/window-chrome.css";
import Shell from "./components/views/Shell.svelte";
import { readLauncherAppearance } from "./lib/launcher/launcher-appearance.ts";
import { startShell } from "./lib/desktop/shell-startup";
import { VaultClient } from "./lib/native/vault-client.ts";
import { createNativeBridge } from "./lib/native/native-bridge.ts";
import { installDesktopLifecycle } from "./lib/desktop/desktop-lifecycle.ts";
import { installWindowDragRegions } from "./lib/desktop/window-drag.ts";
import { invoke } from "@tauri-apps/api/core";
import { installDesktopMenu } from "./lib/desktop/desktop-integration.ts";
import { DesktopUrlDelivery } from "./lib/native/integration-urls.ts";
import {
  DesktopIntegrationPorts,
  installDesktopClipboard,
  installDesktopExternalLinks,
} from "./lib/native/desktop-integration.ts";

const vaultClient = new VaultClient();

try {
  const stopDragRegions = installWindowDragRegions(document.documentElement);
  addEventListener("pagehide", stopDragRegions, { once: true });
  let shell:
    | {
        prepareToLeave(): Promise<void>;
        openVaults(): Promise<void>;
        canEdit(): boolean;
        reportFailure(failure: unknown): void;
      }
    | undefined;
  const report = (failure: unknown) => shell?.reportFailure(failure);
  const ports = new DesktopIntegrationPorts(invoke);
  const urlDelivery = new DesktopUrlDelivery(invoke, report);
  const stopClipboard = installDesktopClipboard(ports, navigator);
  const stopExternal = installDesktopExternalLinks(ports, report);
  const stopMenu = await installDesktopMenu(
    async () => {
      await shell?.openVaults();
    },
    report,
    urlDelivery,
    () => shell?.canEdit() ?? false,
  );
  addEventListener(
    "pagehide",
    () => {
      stopMenu();
      stopExternal();
      stopClipboard();
    },
    { once: true },
  );
  const stopLifecycle = await installDesktopLifecycle(
    async () => {
      if (!shell)
        throw new Error("The workspace is still starting. Please try again.");
      await shell.prepareToLeave();
    },
    (failure) => shell?.reportFailure(failure),
  );
  addEventListener("pagehide", stopLifecycle, { once: true });
  const appearance = matchMedia("(prefers-color-scheme: dark)");
  const applyAppearance = () => {
    const mode = readLauncherAppearance();
    document.documentElement.classList.toggle(
      "dark",
      mode === "system" ? appearance.matches : mode === "dark",
    );
  };
  applyAppearance();
  appearance.addEventListener("change", applyAppearance);
  addEventListener(
    "pagehide",
    () => appearance.removeEventListener("change", applyAppearance),
    { once: true },
  );
  await startShell({
    mount: () => {
      const os = document.documentElement.dataset.lapisPlatform;
      const platform = ["macos", "windows", "linux"].includes(os ?? "")
        ? (os as NativeDesktopPlatformOs)
        : "unknown";
      setNativeDesktopBridge(createNativeBridge(vaultClient, platform, ports));
      shell = mount(Shell, {
        target: document.getElementById("app")!,
        props: { client: vaultClient, urlDelivery },
      });
      return shell;
    },
    document,
  });
} catch (error) {
  const boot = document.getElementById("boot")!;
  boot.setAttribute("role", "alert");
  boot.removeAttribute("aria-label");
  boot.textContent =
    "Lapis Notes could not start. Close the window and try again.";
  console.error("Desktop startup failed", error);
}
