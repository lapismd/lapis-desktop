import type { AppPluginDistributionOptions } from "@lapis-notes/api";
import { mount } from "svelte";
import {
  setNativeDesktopBridge,
  type NativeDesktopPlatformOs,
} from "@lapis-notes/api/desktop-native";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "../../styles/shell.css";
import "../../styles/notes-workspace.css";
import "../../styles/window-chrome.css";
import Shell from "../../components/views/Shell.svelte";
import { readLauncherAppearance } from "../launcher/launcher-appearance.ts";
import { startShell } from "./shell-startup";
import { VaultClient } from "../native/vault-client.ts";
import { createNativeBridge } from "../native/native-bridge.ts";
import { installDesktopLifecycle } from "./desktop-lifecycle.ts";
import { installWindowDragRegions } from "./window-drag.ts";
import { invoke } from "@tauri-apps/api/core";
import { installDesktopMenu } from "./desktop-integration.ts";
import { DesktopUrlDelivery } from "../native/integration-urls.ts";
import {
  DesktopIntegrationPorts,
  installDesktopClipboard,
  installDesktopExternalLinks,
} from "../native/desktop-integration.ts";

export async function bootstrapDesktop(
  pluginDistributionOptions?: AppPluginDistributionOptions,
): Promise<void> {
  const vaultClient = new VaultClient();

  const stopDragRegions = installWindowDragRegions(document.documentElement);
  addEventListener("pagehide", stopDragRegions, { once: true });
  let shell:
    | {
        prepareToLeave(action?: "close" | "reload"): Promise<void>;
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
    async (action) => {
      if (!shell)
        throw new Error("The workspace is still starting. Please try again.");
      await shell.prepareToLeave(action);
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
        props: {
          client: vaultClient,
          urlDelivery,
          pluginDistributionOptions,
        },
      });
      return shell;
    },
    document,
  });
}
