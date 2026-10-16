import type { DesktopLauncherAppearance } from "@lapis-notes/workspace";

const key = "lapis.desktop.launcher.appearance";
export function readLauncherAppearance(): DesktopLauncherAppearance {
  const stored = localStorage.getItem(key);
  return stored === "dark" || stored === "light" ? stored : "system";
}
export function saveLauncherAppearance(mode: DesktopLauncherAppearance): void {
  localStorage.setItem(key, mode);
}
