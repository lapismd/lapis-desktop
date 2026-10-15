import { mount } from "svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "./shell.css";
import Shell from "./Shell.svelte";
import { startShell } from "./shell-startup";

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
  if (import.meta.env.MODE === "native-test")
    await import("@wdio/tauri-plugin");
  await startShell({
    mount: () => mount(Shell, { target: document.getElementById("app")! }),
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
