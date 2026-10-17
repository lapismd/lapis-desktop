import { mount, tick, unmount } from "svelte";
import ShellStartup from "../../components/views/ShellStartup.svelte";
import { readLauncherAppearance } from "../launcher/launcher-appearance.ts";
import { loadShell } from "./load-shell.ts";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "../../styles/shell.css";

/** This small entry deliberately has no static dependency on the Notes shell. */
export async function launchDesktop(
  load: () => Promise<unknown>,
): Promise<void> {
  try {
    await loadShell(async () => {
      const mode = readLauncherAppearance();
      document.documentElement.classList.toggle(
        "dark",
        mode === "dark" ||
          (mode === "system" &&
            matchMedia("(prefers-color-scheme: dark)").matches),
      );
      const startup = mount(ShellStartup, {
        target: document.getElementById("boot")!,
      });
      await tick();
      return {
        close: () => unmount(startup),
        fail: (error: unknown) => startup.fail(error),
      };
    }, load);
  } catch (error) {
    console.error("Desktop startup failed", error);
  }
}
