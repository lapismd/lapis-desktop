import { mount } from "svelte";
import {
  setNativeDesktopBridge,
  type NativeDesktopPlatformOs,
} from "@lapis-notes/api/desktop-native";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "./shell.css";
import "./vault-launcher.css";
import "./notes-workspace.css";
import Shell from "./Shell.svelte";
import { startShell } from "./shell-startup";
import { VaultClient } from "./vault-client.ts";
import { createNativeBridge } from "./native-bridge.ts";

const vaultClient = new VaultClient();

try {
  const appearance = matchMedia("(prefers-color-scheme: dark)");
  const applyAppearance = () =>
    document.documentElement.classList.toggle("dark", appearance.matches);
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
      setNativeDesktopBridge(createNativeBridge(vaultClient, platform));
      return mount(Shell, {
        target: document.getElementById("app")!,
        props: { client: vaultClient },
      });
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
